# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Twitch Backup is an Electron-based desktop application for backing up Twitch VODs. Built with TypeScript, React, and Electron, it provides scheduled and batch download capabilities for technical users.

## Key Commands

### Development
```bash
npm run dev              # Start concurrent development (main + renderer with hot reload)
npm run dev:main         # Watch TypeScript changes in main process only
npm run dev:renderer     # Start Vite dev server for renderer only
```

### Building
```bash
npm run build            # Build both main and renderer for production
npm run release          # Build and package for current platform
npm run release:all      # Build for all platforms (mac, win, linux)
npm run dist:mac         # Build macOS .dmg
npm run dist:win         # Build Windows .exe installer
npm run dist:linux       # Build Linux AppImage and .deb
```

### Testing
```bash
npm test                 # Run structure/mock tests
npm run test:app         # Interactive system test (checks yt-dlp, API)
npm run test:e2e         # Automated E2E tests (requires build)
npm run test:screenshots # Visual regression tests
```

### Utilities
```bash
npm run check-deps       # Check system dependencies
python3 -m venv venv     # Create Python venv if needed for pip installs
```

## Architecture

### Process Separation (Electron)
- **Main Process** (`src/main/`): Node.js environment with system access
  - `index.ts` - App lifecycle, window creation
  - `ipc.ts` - IPC handlers for renderer requests
  - `downloader.ts` - yt-dlp integration with p-queue
  - `twitch-api.ts` - Twitch API client (app auth)
  - `scheduler.ts` - Cron-based task scheduling
  - `store.ts` - Persistent config (electron-store)

- **Renderer Process** (`src/renderer/`): Isolated browser environment
  - React components in `components/`
  - Zustand store for state management
  - IPC communication via contextBridge API

- **Shared Types** (`src/shared/types.ts`): Interfaces used by both processes

### Build Configuration
- TypeScript outputs to `dist/` maintaining source structure
- Main process: CommonJS modules (`tsconfig.main.json`)
- Renderer process: ES modules via Vite
- Production builds in `release/{version}/`

### IPC Communication Pattern
```typescript
// Renderer
const result = await api.searchStreamers(query);

// Main (ipc.ts)
ipcMain.handle('search-streamers', async (_, query) => {
  return await searchStreamers(query);
});
```

### Download Path Structure
Downloads are organized as: `<configured_path>/<streamer_id>/<vod_file>`

## External Dependencies

- **yt-dlp**: Required for VOD downloads (must be in PATH)
- **Twitch API**: Requires Client ID and Secret from dev.twitch.tv

## Security Notes

- Credentials stored encrypted via electron-store
- Context isolation enabled, no nodeIntegration
- Preload script bridges main/renderer securely

## Common Issues

1. **TypeScript Build Errors**: Check `tsconfig.main.json` outputs to correct directory
2. **Icon Generation**: Falls back to default if ImageMagick missing
3. **Path Operations**: Always verify current directory with `pwd` before file operations
4. **Build Output Structure**: Main process files must be in `dist/main/`, not nested deeper