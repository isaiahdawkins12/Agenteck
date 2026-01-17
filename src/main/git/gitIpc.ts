/**
 * Git IPC Handlers
 * Registers IPC handlers for git operations
 */

import { ipcMain } from 'electron';
import { gitService } from './GitService';
import { GitIpcChannels, type CreateWorktreeOptions } from '../../shared/types/git';

/**
 * Register all git-related IPC handlers
 */
export function registerGitIpcHandlers(): void {
  // Detect if path is in a git repository
  ipcMain.handle(GitIpcChannels.DETECT_REPO, async (_event, dirPath: string) => {
    return gitService.isGitRepo(dirPath);
  });

  // Get detailed git status for a directory
  ipcMain.handle(GitIpcChannels.GET_STATUS, async (_event, dirPath: string) => {
    return gitService.getStatus(dirPath);
  });

  // Get full repository information
  ipcMain.handle(GitIpcChannels.GET_REPOSITORY, async (_event, dirPath: string) => {
    return gitService.getRepository(dirPath);
  });

  // List all worktrees for a repository
  ipcMain.handle(GitIpcChannels.LIST_WORKTREES, async (_event, repoPath: string) => {
    return gitService.listWorktrees(repoPath);
  });

  // List all branches
  ipcMain.handle(GitIpcChannels.LIST_BRANCHES, async (_event, repoPath: string) => {
    return gitService.listBranches(repoPath);
  });

  // Create a new worktree
  ipcMain.handle(GitIpcChannels.CREATE_WORKTREE, async (_event, options: CreateWorktreeOptions) => {
    return gitService.createWorktree(options);
  });

  // Remove a worktree
  ipcMain.handle(
    GitIpcChannels.REMOVE_WORKTREE,
    async (_event, repoPath: string, worktreePath: string, force?: boolean) => {
      return gitService.removeWorktree(repoPath, worktreePath, force);
    }
  );
}
