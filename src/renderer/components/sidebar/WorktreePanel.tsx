/**
 * WorktreePanel - Git repositories and worktrees sidebar panel
 * Shows detected repositories, their branches, and active worktrees
 */

import { useState, useEffect } from 'react';
import { useGitStore } from '../../store/gitStore';
import { useTerminalStore } from '../../store/terminalStore';
import type { Repository, Worktree, Branch } from '@shared/types/git';
import './WorktreePanel.css';

export function WorktreePanel() {
  const {
    repositories,
    expandedRepos,
    selectedBranch,
    isLoading,
    toggleRepoExpanded,
    setSelectedBranch,
    detectRepository,
    createWorktree,
    removeWorktree,
    getBranches,
  } = useGitStore();

  const { terminals, setActiveTerminal } = useTerminalStore();

  const repoList = Object.values(repositories);

  // Detect repositories from terminal cwds on mount
  useEffect(() => {
    const terminalList = Object.values(terminals);
    for (const terminal of terminalList) {
      if (terminal.cwd) {
        detectRepository(terminal.cwd);
      }
    }
  }, [terminals, detectRepository]);

  if (repoList.length === 0) {
    return (
      <div className="worktree-panel">
        <div className="worktree-panel-header">
          <h3>Repositories</h3>
        </div>
        <div className="worktree-panel-empty">
          <div className="worktree-empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93s3.06-7.44 7-7.93v15.86zm2 0V4.07c3.94.49 7 3.85 7 7.93s-3.06 7.44-7 7.93z" />
            </svg>
          </div>
          <p>No repositories detected</p>
          <span className="worktree-empty-hint">
            Open a terminal in a git repository to see it here
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="worktree-panel">
      <div className="worktree-panel-header">
        <h3>Repositories</h3>
        <span className="worktree-count-badge">{repoList.length}</span>
      </div>
      <div className="worktree-repo-list">
        {repoList.map((repo) => (
          <RepositoryItem
            key={repo.id}
            repository={repo}
            isExpanded={expandedRepos.has(repo.id)}
            selectedBranch={selectedBranch}
            onToggleExpand={() => toggleRepoExpanded(repo.id)}
            onSelectBranch={setSelectedBranch}
            onFocusTerminal={setActiveTerminal}
            onCreateWorktree={createWorktree}
            onRemoveWorktree={(worktreePath) => removeWorktree(repo.rootPath, worktreePath)}
            getBranches={() => getBranches(repo.rootPath)}
          />
        ))}
      </div>
      {isLoading && (
        <div className="worktree-loading">
          <span className="worktree-spinner" />
        </div>
      )}
    </div>
  );
}

interface RepositoryItemProps {
  repository: Repository;
  isExpanded: boolean;
  selectedBranch: string | null;
  onToggleExpand: () => void;
  onSelectBranch: (branchPath: string | null) => void;
  onFocusTerminal: (id: string) => void;
  onCreateWorktree: (options: { repoPath: string; worktreePath: string; branch: string; createBranch?: boolean }) => Promise<{ success: boolean }>;
  onRemoveWorktree: (worktreePath: string) => Promise<{ success: boolean }>;
  getBranches: () => Promise<Branch[]>;
}

function RepositoryItem({
  repository,
  isExpanded,
  selectedBranch,
  onToggleExpand,
  onSelectBranch,
  onFocusTerminal,
  onCreateWorktree,
  onRemoveWorktree,
  getBranches,
}: RepositoryItemProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showNewWorktree, setShowNewWorktree] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      getBranches().then(setBranches);
    }
  }, [isExpanded, getBranches]);

  const getStatusColor = (worktree: Worktree) => {
    if (worktree.isDetached) return 'var(--color-error)';
    if (worktree.isDirty) return 'var(--color-warning)';
    if (!worktree.isMain) return 'var(--color-info)';
    return 'var(--color-success)';
  };

  const handleWorktreeClick = (worktree: Worktree) => {
    const branchPath = `${repository.id}:${worktree.branch}`;
    onSelectBranch(branchPath);

    // Focus the first terminal in this worktree if any
    if (worktree.terminalIds.length > 0) {
      onFocusTerminal(worktree.terminalIds[0]);
    }
  };

  return (
    <div className="worktree-repo">
      <button className="worktree-repo-header" onClick={onToggleExpand}>
        <span className={`worktree-expand-icon ${isExpanded ? 'expanded' : ''}`}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M4.5 2l4 4-4 4" />
          </svg>
        </span>
        <span className="worktree-repo-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M2 4a2 2 0 012-2h4.586A2 2 0 0110 2.586L13.414 6A2 2 0 0114 7.414V12a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        </span>
        <div className="worktree-repo-info">
          <span className="worktree-repo-name">{repository.name}</span>
          <span className="worktree-repo-branch">
            {repository.currentBranch}
            {repository.isDirty && <span className="worktree-dirty-indicator">*</span>}
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="worktree-branches">
          {repository.worktrees.map((worktree) => (
            <WorktreeItem
              key={worktree.path}
              worktree={worktree}
              repoId={repository.id}
              isSelected={selectedBranch === `${repository.id}:${worktree.branch}`}
              statusColor={getStatusColor(worktree)}
              onClick={() => handleWorktreeClick(worktree)}
              onRemove={worktree.isMain ? undefined : () => onRemoveWorktree(worktree.path)}
              onFocusTerminal={onFocusTerminal}
            />
          ))}

          {/* Non-worktree branches */}
          {branches
            .filter(b => !b.hasWorktree && !b.isRemote)
            .map((branch) => (
              <BranchItem
                key={branch.name}
                branch={branch}
                repoId={repository.id}
                repoPath={repository.rootPath}
                isSelected={selectedBranch === `${repository.id}:${branch.name}`}
                onClick={() => onSelectBranch(`${repository.id}:${branch.name}`)}
                onCreateWorktree={onCreateWorktree}
              />
            ))}

          <button
            className="worktree-add-button"
            onClick={() => setShowNewWorktree(true)}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 2v4H2v2h4v4h2V8h4V6H8V2H6z" />
            </svg>
            <span>New Worktree</span>
          </button>

          {showNewWorktree && (
            <NewWorktreeForm
              repoPath={repository.rootPath}
              onSubmit={async (options) => {
                await onCreateWorktree(options);
                setShowNewWorktree(false);
              }}
              onCancel={() => setShowNewWorktree(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

interface WorktreeItemProps {
  worktree: Worktree;
  repoId: string;
  isSelected: boolean;
  statusColor: string;
  onClick: () => void;
  onRemove?: () => void;
  onFocusTerminal: (id: string) => void;
}

function WorktreeItem({
  worktree,
  isSelected,
  statusColor,
  onClick,
  onRemove,
  onFocusTerminal,
}: WorktreeItemProps) {
  return (
    <div className={`worktree-item ${isSelected ? 'selected' : ''}`}>
      <button className="worktree-item-main" onClick={onClick}>
        <span className="worktree-status-dot" style={{ backgroundColor: statusColor }} />
        <div className="worktree-item-info">
          <span className="worktree-item-branch">
            {worktree.branch}
            {worktree.isMain && <span className="worktree-main-badge">main</span>}
          </span>
          {!worktree.isMain && (
            <span className="worktree-item-path">{worktree.path}</span>
          )}
        </div>
      </button>

      {/* Terminal badges */}
      {worktree.terminalIds.length > 0 && (
        <div className="worktree-terminals">
          {worktree.terminalIds.map((termId) => (
            <button
              key={termId}
              className="worktree-terminal-badge"
              onClick={(e) => {
                e.stopPropagation();
                onFocusTerminal(termId);
              }}
              title="Focus terminal"
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4.5 3A1.5 1.5 0 003 4.5v7A1.5 1.5 0 004.5 13h7a1.5 1.5 0 001.5-1.5v-7A1.5 1.5 0 0011.5 3h-7zM5 6l3 2-3 2V6z" />
              </svg>
            </button>
          ))}
        </div>
      )}

      {/* Remove button for non-main worktrees */}
      {onRemove && (
        <button
          className="worktree-remove-button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          title="Remove worktree"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M3.05 3.05a.5.5 0 01.707 0L6 5.293l2.243-2.243a.5.5 0 01.707.707L6.707 6l2.243 2.243a.5.5 0 01-.707.707L6 6.707 3.757 8.95a.5.5 0 01-.707-.707L5.293 6 3.05 3.757a.5.5 0 010-.707z" />
          </svg>
        </button>
      )}
    </div>
  );
}

interface BranchItemProps {
  branch: Branch;
  repoId: string;
  repoPath: string;
  isSelected: boolean;
  onClick: () => void;
  onCreateWorktree: (options: { repoPath: string; worktreePath: string; branch: string }) => Promise<{ success: boolean }>;
}

function BranchItem({
  branch,
  repoPath,
  isSelected,
  onClick,
  onCreateWorktree,
}: BranchItemProps) {
  const handleAddWorktree = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // Create worktree in parent directory with branch name
    const parentDir = repoPath.replace(/[/\\][^/\\]+$/, '');
    const worktreePath = `${parentDir}/${branch.name.replace(/\//g, '-')}`;
    await onCreateWorktree({
      repoPath,
      worktreePath,
      branch: branch.name,
    });
  };

  return (
    <div className={`worktree-branch-item ${isSelected ? 'selected' : ''}`}>
      <button className="worktree-branch-main" onClick={onClick}>
        <span className="worktree-branch-icon">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M11.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122V6A2.5 2.5 0 0110 8.5H6a1 1 0 00-1 1v1.128a2.251 2.251 0 11-1.5 0V5.372a2.25 2.25 0 111.5 0v1.836A2.5 2.5 0 016 7h4a1 1 0 001-1v-.628A2.25 2.25 0 019.5 3.25zM4.25 12a.75.75 0 100 1.5.75.75 0 000-1.5zM3.5 3.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0z" clipRule="evenodd" />
          </svg>
        </span>
        <span className="worktree-branch-name">{branch.name}</span>
        {branch.ahead && branch.ahead > 0 && (
          <span className="worktree-branch-ahead">+{branch.ahead}</span>
        )}
        {branch.behind && branch.behind > 0 && (
          <span className="worktree-branch-behind">-{branch.behind}</span>
        )}
      </button>
      <button
        className="worktree-add-worktree-button"
        onClick={handleAddWorktree}
        title="Create worktree for this branch"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 2v4H2v2h4v4h2V8h4V6H8V2H6z" />
        </svg>
      </button>
    </div>
  );
}

interface NewWorktreeFormProps {
  repoPath: string;
  onSubmit: (options: { repoPath: string; worktreePath: string; branch: string; createBranch: boolean }) => Promise<void>;
  onCancel: () => void;
}

function NewWorktreeForm({ repoPath, onSubmit, onCancel }: NewWorktreeFormProps) {
  const [branchName, setBranchName] = useState('');
  const [isNewBranch, setIsNewBranch] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim()) return;

    const parentDir = repoPath.replace(/[/\\][^/\\]+$/, '');
    const worktreePath = `${parentDir}/${branchName.replace(/\//g, '-')}`;

    await onSubmit({
      repoPath,
      worktreePath,
      branch: branchName,
      createBranch: isNewBranch,
    });
  };

  return (
    <form className="worktree-new-form" onSubmit={handleSubmit}>
      <div className="worktree-form-field">
        <input
          type="text"
          placeholder="Branch name"
          value={branchName}
          onChange={(e) => setBranchName(e.target.value)}
          autoFocus
        />
      </div>
      <label className="worktree-form-checkbox">
        <input
          type="checkbox"
          checked={isNewBranch}
          onChange={(e) => setIsNewBranch(e.target.checked)}
        />
        <span>Create new branch</span>
      </label>
      <div className="worktree-form-actions">
        <button type="button" className="worktree-form-cancel" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="worktree-form-submit" disabled={!branchName.trim()}>
          Create
        </button>
      </div>
    </form>
  );
}
