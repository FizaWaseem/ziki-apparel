# Video Commands for Hero Banner

## Using FFmpeg to Optimize Videos

### Install FFmpeg
```bash
# Windows (using Chocolatey)
choco install ffmpeg

# macOS (using Homebrew)
brew install ffmpeg

# Linux (Ubuntu/Debian)
sudo apt update && sudo apt install ffmpeg
```

### Optimize Video for Web
```bash
# Basic optimization - reduces file size while maintaining quality
ffmpeg -i input-video.mov -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k -movflags +faststart hero-video-1.mp4

# For smaller file sizes (more compression)
ffmpeg -i input-video.mov -c:v libx264 -preset slow -crf 28 -c:a aac -b:a 96k -movflags +faststart hero-video-1.mp4

# For highest quality (larger file)
ffmpeg -i input-video.mov -c:v libx264 -preset slow -crf 18 -c:a aac -b:a 192k -movflags +faststart hero-video-1.mp4
```

### Resize Video to Specific Resolution
```bash
# Resize to 1920x1080 (Full HD)
ffmpeg -i input-video.mov -vf scale=1920:1080 -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k hero-video-1.mp4

# Resize to 1280x720 (HD)
ffmpeg -i input-video.mov -vf scale=1280:720 -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k hero-video-1.mp4
```

### Create Multiple Formats for Better Compatibility
```bash
# Create MP4 version
ffmpeg -i input-video.mov -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k hero-video-1.mp4

# Create WebM version
ffmpeg -i input-video.mov -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus -b:a 128k hero-video-1.webm

# Create OGV version
ffmpeg -i input-video.mov -c:v libtheora -q:v 6 -c:a libvorbis -q:a 5 hero-video-1.ogv
```

### Extract Poster Image from Video
```bash
# Extract frame at 2 seconds as poster image
ffmpeg -i hero-video-1.mp4 -ss 00:00:02 -frames:v 1 -q:v 2 hero-poster-1.jpg

# Extract frame at 5 seconds
ffmpeg -i hero-video-1.mp4 -ss 00:00:05 -frames:v 1 -q:v 2 hero-poster-1.jpg
```

### Trim Video Duration
```bash
# Trim to first 15 seconds
ffmpeg -i input-video.mov -t 15 -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k hero-video-1.mp4

# Trim from 5 seconds to 20 seconds (15 second duration)
ffmpeg -i input-video.mov -ss 5 -t 15 -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k hero-video-1.mp4
```

## Quick Copy Commands for Your Videos

### Copy your videos to the correct location:
```bash
# Windows PowerShell
Copy-Item "C:\path\to\your\video.mp4" "d:\Projects\ziki-apparel\public\videos\hero-video-1.mp4"
Copy-Item "C:\path\to\your\second-video.mp4" "d:\Projects\ziki-apparel\public\videos\hero-video-2.mp4"

# Windows Command Prompt
copy "C:\path\to\your\video.mp4" "d:\Projects\ziki-apparel\public\videos\hero-video-1.mp4"

# macOS/Linux
cp "/path/to/your/video.mp4" "/path/to/ziki-apparel/public/videos/hero-video-1.mp4"
```

### Copy poster images:
```bash
# Windows PowerShell
Copy-Item "C:\path\to\your\poster.jpg" "d:\Projects\ziki-apparel\public\images\hero-poster-1.jpg"

# macOS/Linux
cp "/path/to/your/poster.jpg" "/path/to/ziki-apparel/public/images/hero-poster-1.jpg"
```

## File Naming Convention

Use consistent naming for easy management:

```
public/
├── videos/
│   ├── hero-video-1.mp4     # Main hero video
│   ├── hero-video-2.mp4     # Second video
│   ├── hero-video-3.mp4     # Third video
│   └── hero-video-4.mp4     # Fourth video
└── images/
    ├── hero-poster-1.jpg    # Poster for video 1
    ├── hero-poster-2.jpg    # Poster for video 2
    ├── hero-poster-3.jpg    # Poster for video 3
    └── hero-poster-4.jpg    # Poster for video 4
```

## Checking Video Information
```bash
# Get video information
ffprobe -v quiet -print_format json -show_format -show_streams hero-video-1.mp4

# Quick video info
ffmpeg -i hero-video-1.mp4 2>&1 | grep -E "(Duration|Stream)"
```

## Testing Your Changes

After adding videos:

1. Restart your development server:
```bash
npm run dev
```

2. Check browser console for any loading errors
3. Test on different browsers and devices
4. Monitor network tab for video loading performance