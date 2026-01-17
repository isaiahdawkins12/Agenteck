/**
 * Git Worktree Feature Types
 * Shared between main and renderer processes
 */

/** Repository detected from terminal working directory */
export interface Repository {
  /** Unique identifier (hash of root path) */
  id: string;
  /** Absolute path to repository root (.git parent) */
  rootPath: string;
  /** Repository directory name */
  name: string;
  /** Current HEAD branch name */
  currentBranch: string;
  /** All worktrees associated with this repository */
  worktrees: Worktree[];
  /** Has uncommitted changes in main worktree */
  isDirty: boolean;
  /** Remote URL if available */
  remoteUrl?: string;
}

/** Individual git worktree */
export interface Worktree {
  /** Absolute path to worktree directory */
  path: string;
  /** Branch checked out in this worktree */
  branch: string;
  /** Is this the main/primary worktree */
  isMain: boolean;
  /** HEAD is in detached state */
  isDetached: boolean;
  /** Has uncommitted changes */
  isDirty: boolean;
  /** Terminal IDs currently working in this worktree */
  terminalIds: string[];
  /** Short commit hash of HEAD */
  commitHash?: string;
}

/** Branch information */
export interface Branch {
  /** Branch name (without refs/heads/) */
  name: string;
  /** Is this a remote tracking branch */
  isRemote: boolean;
  /** Is this the current branch */
  isCurrent: boolean;
  /** Has a worktree checked out */
  hasWorktree: boolean;
  /** Path to worktree if checked out */
  worktreePath?: string;
  /** Last commit message (short) */
  lastCommit?: string;
  /** Commits ahead of upstream */
  ahead?: number;
  /** Commits behind upstream */
  behind?: number;
}

/** Git status for a working directory */
export interface GitStatus {
  /** Is this path inside a git repository */
  isRepo: boolean;
  /** Repository root path */
  rootPath?: string;
  /** Current branch name */
  branch?: string;
  /** Has uncommitted changes */
  isDirty?: boolean;
  /** Is HEAD detached */
  isDetached?: boolean;
  /** Number of staged files */
  staged?: number;
  /** Number of modified files */
  modified?: number;
  /** Number of untracked files */
  untracked?: number;
}

/** Terminal to git context mapping */
export interface TerminalGitContext {
  /** Terminal ID */
  terminalId: string;
  /** Repository ID if in a git repo */
  repositoryId?: string;
  /** Worktree path (may differ from repo root) */
  worktreePath?: string;
  /** Current branch */
  branch?: string;
  /** Is the terminal's cwd dirty */
  isDirty?: boolean;
}

/** Options for creating a new worktree */
export interface CreateWorktreeOptions {
  /** Repository root path */
  repoPath: string;
  /** Path where worktree will be created */
  worktreePath: string;
  /** Existing branch to checkout, or new branch name if createBranch is true */
  branch: string;
  /** Create a new branch */
  createBranch?: boolean;
  /** Base branch/commit for new branch (defaults to HEAD) */
  baseBranch?: string;
}

/** Result of a git operation */
export interface GitOperationResult {
  /** Operation succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Additional data from operation */
  data?: unknown;
}

/** IPC channel names for git operations */
export const GitIpcChannels = {
  DETECT_REPO: 'git:detect-repo',
  GET_STATUS: 'git:get-status',
  GET_REPOSITORY: 'git:get-repository',
  LIST_WORKTREES: 'git:list-worktrees',
  LIST_BRANCHES: 'git:list-branches',
  CREATE_WORKTREE: 'git:create-worktree',
  REMOVE_WORKTREE: 'git:remove-worktree',
  REFRESH: 'git:refresh',
} as const;

export type GitIpcChannel = typeof GitIpcChannels[keyof typeof GitIpcChannels];
