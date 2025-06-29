# Building Twitch Backup

This guide explains how to build Twitch Backup for different platforms.

## Prerequisites

### All Platforms
- Node.js 16+ and npm
- Git
- yt-dlp installed and available in PATH

### Platform-Specific

**macOS:**
- Xcode Command Line Tools: `xcode-select --install`
- (Optional) ImageMagick for icon generation: `brew install imagemagick`

**Windows:**
- Windows Build Tools: `npm install -g windows-build-tools`
- (Optional) ImageMagick for icon generation

**Linux:**
- Build essentials: `sudo apt install build-essential`
- (Optional) Icon tools: `sudo apt install imagemagick librsvg2-bin`

## Quick Build

```bash
# Clone the repository
git clone <repository-url>
cd twitch-backup

# Install dependencies
npm install

# Build for your current platform
npm run release

# Or build for all platforms (requires proper setup)
npm run release:all
```

## Platform-Specific Builds

### macOS
```bash
npm run dist:mac
```
Generates:
- `.dmg` installer for macOS (universal binary for Intel and Apple Silicon)

### Windows
```bash
npm run dist:win
```
Generates:
- `.exe` NSIS installer
- `.exe` portable version

### Linux
```bash
npm run dist:linux
```
Generates:
- `.AppImage` (universal Linux binary)
- `.deb` package (for Debian/Ubuntu)

## Output

Built applications will be in the `release/{version}/` directory:
- `Twitch Backup-1.0.0-mac-x64.dmg`
- `Twitch Backup-1.0.0-win-x64.exe`
- `Twitch Backup-1.0.0-linux-x64.AppImage`

## Code Signing

### macOS
To sign the app for distribution:
1. Set environment variables:
   ```bash
   export APPLE_ID="your-apple-id@email.com"
   export APPLE_ID_PASSWORD="your-app-specific-password"
   export APPLE_TEAM_ID="your-team-id"
   ```
2. The build process will automatically sign if certificates are available

### Windows
To sign the app:
1. Obtain a code signing certificate
2. Set environment variables:
   ```bash
   export CSC_LINK="path/to/certificate.pfx"
   export CSC_KEY_PASSWORD="certificate-password"
   ```

## Troubleshooting

### Icon Generation Failed
- Install ImageMagick or continue without custom icons
- Default icons will be used as fallback

### Build Fails on macOS
- Ensure Xcode Command Line Tools are installed
- Check that you have proper permissions

### Build Fails on Windows
- Run as Administrator if needed
- Ensure Windows Build Tools are installed

### Build Fails on Linux
- Install required system libraries:
  ```bash
  sudo apt install libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils libatspi2.0-0 libsecret-1-0
  ```

## Distribution

### Manual Distribution
1. Build the app: `npm run release`
2. Find the installer in `release/{version}/`
3. Distribute the appropriate file for each platform

### Auto-Update Setup
The app is configured for GitHub Releases auto-update:
1. Create a GitHub release
2. Upload the built files
3. The app will check for updates automatically

## Development Build

For development without packaging:
```bash
npm run dev
```

This runs the app with hot-reload enabled.