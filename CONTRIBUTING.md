# Contributing to Agenteck

Thank you for your interest in contributing to Agenteck! This document provides guidelines and information for contributors.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git

### Setting Up the Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/agenteck.git
   cd agenteck
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Running the Application

```bash
# Start the Vite dev server (renderer process)
npm run dev:renderer

# In another terminal, compile and watch the main process
npm run dev:main

# In another terminal, start Electron
npm start
```

Or use the combined command:
```bash
npm run dev
```

## Development Guidelines

### Project Structure

- `src/main/` - Electron main process code
- `src/renderer/` - React frontend code
- `src/shared/` - Shared types and utilities

### Code Style

- We use TypeScript for type safety
- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic

### TypeScript

- Avoid using `any` type when possible
- Define interfaces for all data structures
- Export types from the `shared/types/` directory

### React Components

- Use functional components with hooks
- Keep components focused and single-purpose
- Place component-specific styles in `.css` files next to components
- Use the existing CSS variables for theming

### State Management

- Use Zustand stores for global state
- Keep stores focused on specific domains (terminal, layout, theme, settings)
- Avoid redundant state

### IPC Communication

- Define all IPC channels in `shared/constants.ts`
- Add types for IPC payloads in `shared/types/ipc.ts`
- Handle errors gracefully in IPC handlers

## Making Changes

### Commit Messages

Use clear and descriptive commit messages:

```
feat: add support for custom shell paths
fix: resolve terminal resize issue on Windows
docs: update installation instructions
refactor: simplify layout state management
```

### Pull Requests

1. Update documentation if needed
2. Add tests for new features (when applicable)
3. Ensure the build passes: `npm run build`
4. Ensure linting passes: `npm run lint`
5. Create a pull request with a clear description

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Screenshots (if applicable)
Add screenshots for UI changes
```

## Feature Requests

Have an idea for a new feature? Open an issue with:

1. A clear title and description
2. Use case / motivation
3. Proposed implementation (if you have ideas)

## Bug Reports

Found a bug? Open an issue with:

1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. System information (OS, Node version)
5. Screenshots or error logs if applicable

## Questions?

Feel free to open an issue for questions about the codebase or contribution process.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
