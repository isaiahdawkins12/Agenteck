/**
 * Git Store - Manages git repository and worktree state
 */

import { create } from 'zustand';
import type {
  Repository,
  Worktree,
  Branch,
  GitStatus,
  TerminalGitContext,
  CreateWorktreeOptions,
  GitOperationResult,
} from '@shared/types/git';
import { GitIpcChannels } from '@shared/types/git';

interface GitState {
  /** All discovered repositories */
  repositories: Record<string, Repository>;
  /** Terminal to git context mappings */
  terminalContexts: Record<string, TerminalGitContext>;
  /** Expanded repository IDs in the UI */
  expandedRepos: Set<string>;
  /** Currently selected branch path (repoId:branch) */
  selectedBranch: string | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
}

interface GitActions {
  /** Detect and load repository for a directory path */
  detectRepository: (dirPath: string) => Promise<Repository | null>;
  /** Refresh a repository's data */
  refreshRepository: (repoId: string) => Promise<void>;
  /** Update terminal's git context when its cwd changes */
  updateTerminalContext: (terminalId: string, cwd: string) => Promise<void>;
  /** Remove terminal context when terminal closes */
  removeTerminalContext: (terminalId: string) => void;
  /** Get branches for a repository */
  getBranches: (repoPath: string) => Promise<Branch[]>;
  /** Create a new worktree */
  createWorktree: (options: CreateWorktreeOptions) => Promise<GitOperationResult>;
  /** Remove a worktree */
  removeWorktree: (repoPath: string, worktreePath: string, force?: boolean) => Promise<GitOperationResult>;
  /** Toggle repository expansion in UI */
  toggleRepoExpanded: (repoId: string) => void;
  /** Set selected branch */
  setSelectedBranch: (branchPath: string | null) => void;
  /** Clear all state */
  reset: () => void;
}

type GitStore = GitState & GitActions;

const initialState: GitState = {
  repositories: {},
  terminalContexts: {},
  expandedRepos: new Set(),
  selectedBranch: null,
  isLoading: false,
  error: null,
};

export const useGitStore = create<GitStore>((set, get) => ({
  ...initialState,

  detectRepository: async (dirPath: string) => {
    try {
      const repo = await window.electronAPI.invoke(
        GitIpcChannels.GET_REPOSITORY,
        dirPath
      ) as Repository | null;

      if (repo) {
        set((state) => ({
          repositories: { ...state.repositories, [repo.id]: repo },
          error: null,
        }));
      }

      return repo;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to detect repository' });
      return null;
    }
  },

  refreshRepository: async (repoId: string) => {
    const repo = get().repositories[repoId];
    if (!repo) return;

    set({ isLoading: true });

    try {
      const updatedRepo = await window.electronAPI.invoke(
        GitIpcChannels.GET_REPOSITORY,
        repo.rootPath
      ) as Repository | null;

      if (updatedRepo) {
        // Preserve terminal associations from current worktrees
        const currentWorktrees = repo.worktrees;
        updatedRepo.worktrees = updatedRepo.worktrees.map(wt => {
          const existing = currentWorktrees.find(c => c.path === wt.path);
          return {
            ...wt,
            terminalIds: existing?.terminalIds || [],
          };
        });

        set((state) => ({
          repositories: { ...state.repositories, [repoId]: updatedRepo },
          isLoading: false,
          error: null,
        }));
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to refresh repository',
      });
    }
  },

  updateTerminalContext: async (terminalId: string, cwd: string) => {
    try {
      const status = await window.electronAPI.invoke(
        GitIpcChannels.GET_STATUS,
        cwd
      ) as GitStatus;

      if (!status.isRepo || !status.rootPath) {
        // Terminal is not in a git repo, remove its context
        get().removeTerminalContext(terminalId);
        return;
      }

      // Detect or get the repository
      let repo = Object.values(get().repositories).find(r => r.rootPath === status.rootPath);
      if (!repo) {
        repo = await get().detectRepository(cwd);
      }

      if (!repo) return;

      // Find which worktree this terminal is in
      const worktreePath = await window.electronAPI.invoke(
        GitIpcChannels.GET_STATUS,
        cwd
      ).then((s: GitStatus) => s.rootPath);

      const context: TerminalGitContext = {
        terminalId,
        repositoryId: repo.id,
        worktreePath: worktreePath || undefined,
        branch: status.branch,
        isDirty: status.isDirty,
      };

      set((state) => {
        // Update terminal context
        const newContexts = { ...state.terminalContexts, [terminalId]: context };

        // Update worktree terminal associations
        const updatedRepo = state.repositories[repo!.id];
        if (updatedRepo) {
          const updatedWorktrees = updatedRepo.worktrees.map(wt => {
            // Remove terminal from this worktree if it was there
            const filteredIds = wt.terminalIds.filter(id => id !== terminalId);

            // Add terminal to this worktree if it matches
            if (wt.path === worktreePath) {
              return { ...wt, terminalIds: [...filteredIds, terminalId] };
            }

            return { ...wt, terminalIds: filteredIds };
          });

          return {
            terminalContexts: newContexts,
            repositories: {
              ...state.repositories,
              [repo!.id]: { ...updatedRepo, worktrees: updatedWorktrees },
            },
          };
        }

        return { terminalContexts: newContexts };
      });
    } catch (error) {
      console.error('Failed to update terminal git context:', error);
    }
  },

  removeTerminalContext: (terminalId: string) => {
    set((state) => {
      const { [terminalId]: removed, ...remainingContexts } = state.terminalContexts;

      // Remove terminal from all worktree associations
      const updatedRepos = { ...state.repositories };
      for (const repoId of Object.keys(updatedRepos)) {
        updatedRepos[repoId] = {
          ...updatedRepos[repoId],
          worktrees: updatedRepos[repoId].worktrees.map(wt => ({
            ...wt,
            terminalIds: wt.terminalIds.filter(id => id !== terminalId),
          })),
        };
      }

      return {
        terminalContexts: remainingContexts,
        repositories: updatedRepos,
      };
    });
  },

  getBranches: async (repoPath: string) => {
    try {
      return await window.electronAPI.invoke(
        GitIpcChannels.LIST_BRANCHES,
        repoPath
      ) as Branch[];
    } catch (error) {
      console.error('Failed to get branches:', error);
      return [];
    }
  },

  createWorktree: async (options: CreateWorktreeOptions) => {
    set({ isLoading: true });

    try {
      const result = await window.electronAPI.invoke(
        GitIpcChannels.CREATE_WORKTREE,
        options
      ) as GitOperationResult;

      if (result.success) {
        // Refresh the repository to get the new worktree
        const repo = Object.values(get().repositories).find(r => r.rootPath === options.repoPath);
        if (repo) {
          await get().refreshRepository(repo.id);
        }
      }

      set({ isLoading: false, error: result.error || null });
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to create worktree';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  removeWorktree: async (repoPath: string, worktreePath: string, force = false) => {
    set({ isLoading: true });

    try {
      const result = await window.electronAPI.invoke(
        GitIpcChannels.REMOVE_WORKTREE,
        repoPath,
        worktreePath,
        force
      ) as GitOperationResult;

      if (result.success) {
        // Refresh the repository
        const repo = Object.values(get().repositories).find(r => r.rootPath === repoPath);
        if (repo) {
          await get().refreshRepository(repo.id);
        }
      }

      set({ isLoading: false, error: result.error || null });
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to remove worktree';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  toggleRepoExpanded: (repoId: string) => {
    set((state) => {
      const newExpanded = new Set(state.expandedRepos);
      if (newExpanded.has(repoId)) {
        newExpanded.delete(repoId);
      } else {
        newExpanded.add(repoId);
      }
      return { expandedRepos: newExpanded };
    });
  },

  setSelectedBranch: (branchPath: string | null) => {
    set({ selectedBranch: branchPath });
  },

  reset: () => {
    set(initialState);
  },
}));
