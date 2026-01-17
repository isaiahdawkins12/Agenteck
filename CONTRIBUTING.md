# Contributing to Agenteck

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Git

### Setup

```bash
git clone https://github.com/YOUR_USERNAME/agenteck.git
cd agenteck
npm install
git checkout -b feature/your-feature-name
```

### Running Locally

```bash
npm run dev      # Start dev server + TypeScript watch
npm start        # In another terminal, start Electron
```

## Code Guidelines

### Project Structure

- `src/main/` — Electron main process
- `src/renderer/` — React frontend
- `src/shared/` — Shared types and utilities

### TypeScript

- Avoid `any` — use proper types or `unknown`
- Define interfaces in `shared/types/`
- Prefix unused parameters with underscore: `_unusedParam`

### React

- Functional components with hooks
- Use Zustand stores for global state
- Component styles in adjacent `.css` files

### IPC

- Define channels in `shared/constants.ts`
- Add payload types in `shared/types/ipc.ts`

## Submitting Changes

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add custom shell path support
fix: resolve terminal resize on Windows
docs: update installation instructions
refactor: simplify layout state management
```

### Pull Request Checklist

- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] Documentation updated if needed
- [ ] Tests added for new features (when applicable)

## Reporting Issues

### Bug Reports

Include:
1. Steps to reproduce
2. Expected vs actual behavior
3. OS and Node.js version
4. Error logs or screenshots

### Feature Requests

Include:
1. Use case / motivation
2. Proposed implementation (if any)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
