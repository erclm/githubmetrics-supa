# GitHubMetrics Frontend Agent Guide

## Commands
- Start dev server: `npm start`
- Build: `npm run build`

## Code Style
- React functional components with hooks (useState, useEffect)
- TailwindCSS for styling
- JSDoc comments for function documentation
- Imports order: React, external libraries, internal modules
- Error handling: try/catch with specific error messages and detailed error tracking
- Async/await pattern for API calls

## Naming Conventions
- camelCase for variables, functions, and component props
- PascalCase for React components
- Descriptive variable names (e.g., `fetchRepos` instead of `fetch`)
- Boolean variables prefixed with 'is', 'has', or 'show' (e.g., `showDetailedError`)

## Architecture
- API calls using axios
- Environment variables with fallbacks (e.g., `process.env.REACT_APP_API_URL || 'http://localhost:3000'`)