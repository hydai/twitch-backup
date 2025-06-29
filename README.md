# Twitch Backup

A tool to backup VODs from Twitch streamers for creating clips later.

## Prerequisites

1. **yt-dlp** must be installed:
   ```bash
   # macOS
   brew install yt-dlp
   
   # Windows (with Python)
   pip install yt-dlp
   
   # Linux
   sudo apt install yt-dlp  # or use pip
   ```

2. **Twitch App Registration**:
   - Go to https://dev.twitch.tv/console/apps
   - Create a new application
   - Save your Client ID and Client Secret

## Setup

```bash
# Clone the repository
git clone <repository-url>
cd twitch-backup

# Check build dependencies
npm run check-deps

# Install dependencies
npm install

# Run in development
npm run dev
```

## Building

```bash
# Build for current platform
npm run release

# Build for all platforms
npm run release:all

# Platform-specific builds
npm run dist:mac      # macOS (.dmg)
npm run dist:win      # Windows (.exe)
npm run dist:linux    # Linux (.AppImage, .deb)
```

Built applications will be in `release/{version}/`

## Features

- Backup Twitch VODs for clip creation
- Batch download support
- Scheduled automatic backups with cron expressions
- Minimal, technical UI
- VODs organized by streamer ID
- Secure credential storage

## Configuration

On first run, go to Settings and configure:
- Twitch Client ID
- Twitch Client Secret  
- Download path (default: ~/Downloads/twitch-vods)
- Max concurrent downloads
- Preferred quality

## Scheduled Downloads

Uses standard cron expressions:
- `0 * * * *` - Every hour
- `0 */4 * * *` - Every 4 hours
- `0 0 * * *` - Daily at midnight
- `0 9 * * 1` - Every Monday at 9 AM