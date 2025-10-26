# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Super Strong** is a React + TypeScript + Vite application that serves as a test/demo for the custom UI component library [@egornevada/folder-ui](https://www.npmjs.com/package/@egornevada/folder-ui). The app includes Telegram Web App integration and is styled with Tailwind CSS.

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7 with SWC for fast refresh
- **Styling**: Tailwind CSS 3.4 with custom preset from @egornevada/folder-ui
- **UI Components**: @egornevada/folder-ui (custom library with Folder UI design system)
- **Linting**: ESLint with TypeScript support and React hooks/refresh rules
- **Type Checking**: TypeScript 5.9 with strict mode enabled

## Development Commands

```bash
# Start development server with HMR
pnpm dev

# Build for production
pnpm build

# Run linter
pnpm lint

# Preview production build
pnpm preview

# Install dependencies
pnpm install
```

## Project Structure

```
src/
├── main.tsx          # React entry point with StrictMode
├── App.tsx           # Main application component demonstrating folder-ui
├── index.css         # Global styles (Tailwind imported here)
└── vite-env.d.ts    # Vite type definitions
```

## Key Architecture Details

### Build Pipeline
- TypeScript compilation (`tsc -b`) followed by Vite bundling ensures type safety before minification
- The build process creates a composite tsconfig setup with separate configs for app and node environments

### Styling System
- Tailwind CSS is configured with a preset from @egornevada/folder-ui (see `tailwind.config.cjs`)
- PostCSS processes Tailwind directives with autoprefixer for cross-browser support
- Component library styles are automatically scanned and included via Tailwind content configuration

### Component Library Integration
- The app imports and demonstrates components from @egornevada/folder-ui (Button, Field)
- The library provides both React components and Tailwind CSS configuration
- Refer to the library documentation for available components and their props

### Telegram Integration
- The HTML page includes `<script src="https://telegram.org/js/telegram-web-app.js"></script>`
- This enables Telegram Web App API integration (currently not actively used in App.tsx)
- The app uses Russian language (lang="ru") by default

## ESLint Configuration

The project uses a flat config setup with:
- TypeScript ESLint recommended rules
- React Hooks plugin for hook dependency warnings
- React Refresh plugin for Vite fast refresh validation
- Browser globals for client-side code

Note: Type-aware lint rules are not currently enabled. If production-level linting is needed, see README.md for instructions to enable `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`.

## TypeScript Configuration

- **Target**: ES2022
- **Module**: ESNext (for Vite bundling)
- **Module Resolution**: Bundler
- **JSX**: react-jsx (automatic JSX transform)
- **Strict Mode**: Enabled (`strict: true`)
- The build info is cached in `node_modules/.tmp/tsconfig.app.tsbuildinfo`

## Common Development Tasks

### Adding a New Component
1. Create the component file in `src/` (e.g., `src/MyComponent.tsx`)
2. Import the component in `App.tsx` and use it
3. Run `pnpm dev` to see HMR in action
4. Use folder-ui components (Button, Field, etc.) as needed

### Debugging Type Issues
Run `pnpm build` to perform full TypeScript type checking. The `tsc -b` step will catch type errors before Vite bundling attempts.

### CSS Styling
- Use Tailwind utility classes in React components
- For global styles, edit `src/index.css`
- Custom Tailwind theme extensions go in `theme.extend` in `tailwind.config.cjs`
- The folder-ui preset includes predefined Tailwind utilities

## Notes

- The app is configured for Russian language (see `index.html` lang attribute and component text)
- StrictMode is enabled in development to help identify issues with side effects
- HMR is fully enabled for fast development iteration
