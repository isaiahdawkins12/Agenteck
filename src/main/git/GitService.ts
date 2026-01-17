/**
 * GitService - Handles all git operations in the main process
 * Executes git commands and parses their output
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as crypto from 'crypto';
import type {
  Repository,
  Worktree,
  Branch,
  GitStatus,
  CreateWorktreeOptions,
  GitOperationResult,
} from '../../shared/types/git';

const execFileAsync = promisify(execFile);

export class GitService {
  private static instance: GitService;

  private constructor() {}

  static getInstance(): GitService {
    if (!GitService.instance) {
      GitService.instance = new GitService();
    }
    return GitService.instance;
  }

  /**
   * Execute a git command in the specified directory
   */
  private async execGit(args: string[], cwd: string): Promise<string> {
    try {
      const { stdout } = await execFileAsync('git', args, {
        cwd,
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });
      return stdout.trim();
    } catch (error) {
      const err = error as { stderr?: string; message: string };
      throw new Error(err.stderr || err.message);
    }
  }

  /**
   * Generate a unique ID for a repository based on its path
   */
  private generateRepoId(rootPath: string): string {
    return crypto.createHash('md5').update(rootPath).digest('hex').slice(0, 12);
  }

  /**
   * Check if a path is inside a git repository
   */
  async isGitRepo(dirPath: string): Promise<boolean> {
    try {
      await this.execGit(['rev-parse', '--git-dir'], dirPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the root path of the git repository
   */
  async getRepoRoot(dirPath: string): Promise<string | null> {
    try {
      return await this.execGit(['rev-parse', '--show-toplevel'], dirPath);
    } catch {
      return null;
    }
  }

  /**
   * Get current branch name
   */
  async getCurrentBranch(dirPath: string): Promise<string | null> {
    try {
      const branch = await this.execGit(['branch', '--show-current'], dirPath);
      return branch || null; // Empty string means detached HEAD
    } catch {
      return null;
    }
  }

  /**
   * Check if working directory has uncommitted changes
   */
  async isDirty(dirPath: string): Promise<boolean> {
    try {
      const status = await this.execGit(['status', '--porcelain'], dirPath);
      return status.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get detailed git status for a directory
   */
  async getStatus(dirPath: string): Promise<GitStatus> {
    const isRepo = await this.isGitRepo(dirPath);
    if (!isRepo) {
      return { isRepo: false };
    }

    const rootPath = await this.getRepoRoot(dirPath);
    const branch = await this.getCurrentBranch(dirPath);
    const isDirty = await this.isDirty(dirPath);

    let staged = 0;
    let modified = 0;
    let untracked = 0;

    try {
      const status = await this.execGit(['status', '--porcelain'], dirPath);
      const lines = status.split('\n').filter(Boolean);

      for (const line of lines) {
        const indexStatus = line[0];
        const workTreeStatus = line[1];

        if (indexStatus !== ' ' && indexStatus !== '?') staged++;
        if (workTreeStatus === 'M' || workTreeStatus === 'D') modified++;
        if (indexStatus === '?') untracked++;
      }
    } catch {
      // Ignore errors in detailed status
    }

    return {
      isRepo: true,
      rootPath: rootPath || undefined,
      branch: branch || undefined,
      isDirty,
      isDetached: branch === null || branch === '',
      staged,
      modified,
      untracked,
    };
  }

  /**
   * List all worktrees for a repository
   */
  async listWorktrees(repoPath: string): Promise<Worktree[]> {
    try {
      const output = await this.execGit(['worktree', 'list', '--porcelain'], repoPath);
      const worktrees: Worktree[] = [];

      // Parse porcelain output
      // Format:
      // worktree /path/to/worktree
      // HEAD <sha>
      // branch refs/heads/branch-name (or "detached")
      // (blank line)

      const blocks = output.split('\n\n').filter(Boolean);
      let isFirst = true;

      for (const block of blocks) {
        const lines = block.split('\n');
        const worktree: Partial<Worktree> = {
          terminalIds: [],
          isDirty: false,
        };

        for (const line of lines) {
          if (line.startsWith('worktree ')) {
            worktree.path = line.slice(9);
          } else if (line.startsWith('HEAD ')) {
            worktree.commitHash = line.slice(5, 12); // Short hash
          } else if (line.startsWith('branch ')) {
            const branchRef = line.slice(7);
            worktree.branch = branchRef.replace('refs/heads/', '');
            worktree.isDetached = false;
          } else if (line === 'detached') {
            worktree.isDetached = true;
            worktree.branch = 'HEAD';
          }
        }

        if (worktree.path) {
          worktree.isMain = isFirst;
          worktree.isDirty = await this.isDirty(worktree.path);
          worktrees.push(worktree as Worktree);
        }

        isFirst = false;
      }

      return worktrees;
    } catch {
      return [];
    }
  }

  /**
   * List all branches (local and remote)
   */
  async listBranches(repoPath: string): Promise<Branch[]> {
    try {
      const output = await this.execGit(
        ['branch', '-a', '--format=%(refname:short)|%(upstream:short)|%(upstream:track)|%(HEAD)'],
        repoPath
      );

      const worktrees = await this.listWorktrees(repoPath);
      const worktreeBranches = new Map(
        worktrees.map(w => [w.branch, w.path])
      );

      const branches: Branch[] = [];
      const lines = output.split('\n').filter(Boolean);

      for (const line of lines) {
        const [name, _upstream, track, head] = line.split('|');

        // Parse ahead/behind from track (e.g., "[ahead 1, behind 2]")
        let ahead: number | undefined;
        let behind: number | undefined;

        if (track) {
          const aheadMatch = track.match(/ahead (\d+)/);
          const behindMatch = track.match(/behind (\d+)/);
          if (aheadMatch) ahead = parseInt(aheadMatch[1], 10);
          if (behindMatch) behind = parseInt(behindMatch[1], 10);
        }

        const isRemote = name.startsWith('origin/') || name.includes('/');
        const hasWorktree = worktreeBranches.has(name);

        branches.push({
          name,
          isRemote,
          isCurrent: head === '*',
          hasWorktree,
          worktreePath: worktreeBranches.get(name),
          ahead,
          behind,
        });
      }

      return branches;
    } catch {
      return [];
    }
  }

  /**
   * Get full repository information
   */
  async getRepository(dirPath: string): Promise<Repository | null> {
    const rootPath = await this.getRepoRoot(dirPath);
    if (!rootPath) return null;

    const currentBranch = await this.getCurrentBranch(rootPath) || 'HEAD';
    const isDirty = await this.isDirty(rootPath);
    const worktrees = await this.listWorktrees(rootPath);

    // Get remote URL
    let remoteUrl: string | undefined;
    try {
      remoteUrl = await this.execGit(['remote', 'get-url', 'origin'], rootPath);
    } catch {
      // No remote configured
    }

    return {
      id: this.generateRepoId(rootPath),
      rootPath,
      name: path.basename(rootPath),
      currentBranch,
      worktrees,
      isDirty,
      remoteUrl,
    };
  }

  /**
   * Create a new worktree
   */
  async createWorktree(options: CreateWorktreeOptions): Promise<GitOperationResult> {
    try {
      const args = ['worktree', 'add'];

      if (options.createBranch) {
        args.push('-b', options.branch);
        args.push(options.worktreePath);
        if (options.baseBranch) {
          args.push(options.baseBranch);
        }
      } else {
        args.push(options.worktreePath, options.branch);
      }

      await this.execGit(args, options.repoPath);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create worktree',
      };
    }
  }

  /**
   * Remove a worktree
   */
  async removeWorktree(repoPath: string, worktreePath: string, force = false): Promise<GitOperationResult> {
    try {
      const args = ['worktree', 'remove'];
      if (force) args.push('--force');
      args.push(worktreePath);

      await this.execGit(args, repoPath);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove worktree',
      };
    }
  }

  /**
   * Get the worktree path for a given directory (may be different from repo root)
   */
  async getWorktreePath(dirPath: string): Promise<string | null> {
    try {
      // git rev-parse --show-toplevel returns the worktree root, not the main repo root
      return await this.execGit(['rev-parse', '--show-toplevel'], dirPath);
    } catch {
      return null;
    }
  }
}

export const gitService = GitService.getInstance();
