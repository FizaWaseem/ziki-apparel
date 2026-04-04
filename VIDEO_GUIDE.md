# How to Add Videos Manually to Hero Banner

## Method 1: Local Videos (Recommended)

### Step 1: Prepare Your Videos
1. **Video Format**: Use MP4 format for best browser compatibility
2. **Video Size**: Recommended resolution 1920x1080 or higher
3. **File Size**: Keep videos under 10MB for good loading performance
4. **Duration**: 10-30 seconds works best for hero banners

### Step 2: Add Videos to Public Directory
1. Place your video files in: `public/videos/`
2. Name them descriptively: `hero-video-1.mp4`, `hero-video-2.mp4`, etc.

### Step 3: Update the Hero Slides Configuration
Edit `src/pages/index.tsx` and modify the `heroSlides` array:

```tsx
const heroSlides: HeroSlide[] = [
  {
    id: 1,
    type: 'video',
    src: '/videos/your-video-name.mp4', // Your video path
    title: 'Your Title',
    subtitle: 'Your subtitle text',
    ctaText: 'Button Text',
    ctaLink: '/your-link'
  },
  // Add more slides...
]
```

## Method 2: External Videos (YouTube, Vimeo, etc.)

For external videos, you need to use direct video URLs:

```tsx
{
  id: 1,
  type: 'video',
  src: 'https://your-video-hosting-service.com/video.mp4',
  title: 'Your Title',
  subtitle: 'Your subtitle',
  ctaText: 'Button Text',
  ctaLink: '/your-link'
}
```

## Method 3: Cloud Storage (AWS S3, Google Cloud, etc.)

```tsx
{
  id: 1,
  type: 'video',
  src: 'https://your-bucket.s3.amazonaws.com/videos/hero-video.mp4',
  title: 'Your Title',
  subtitle: 'Your subtitle',
  ctaText: 'Button Text',
  ctaLink: '/your-link'
}
```

## Adding Multiple Videos

To add more video slides, simply add more objects to the `heroSlides` array:

```tsx
const heroSlides: HeroSlide[] = [
  // Video Slide 1
  {
    id: 1,
    type: 'video',
      src: '/videos/video0.mp4', 
    title: 'Premium Trouser Collection',
    subtitle: 'Crafted for the modern lifestyle',
    ctaText: 'Shop Now',
    ctaLink: '/products'
  },
  
  // Video Slide 2
  {
    id: 2,
    type: 'video',
    src: '/videos/sustainable-fashion.mp4',
    title: 'Sustainable Fashion',
    subtitle: 'Eco-friendly denim for a better tomorrow',
    ctaText: 'Learn More',
    ctaLink: '/products?sustainable=true'
  },
  
  // Image Slide (for variety)
  {
    id: 3,
    type: 'image',
    src: '/images/hero-image.jpg',
    title: 'Raw Selvedge Denim',
    subtitle: 'Authentic Japanese denim',
    ctaText: 'Explore',
    ctaLink: '/products?category=raw-denim'
  }
]
```

## Video Optimization Tips

### 1. Compress Your Videos
Use tools like:
- **HandBrake** (free)
- **FFmpeg** (command line)
- **Adobe Media Encoder**

### 2. Recommended Settings
- **Format**: MP4 (H.264)
- **Resolution**: 1920x1080 (Full HD)
- **Bitrate**: 2-5 Mbps
- **Frame Rate**: 24-30 fps
- **Audio**: Keep audio track but it will be muted

### 3. Multiple Format Support
For better browser compatibility, you can add multiple video sources:

Edit the video component in `src/pages/index.tsx`:

```tsx
{slide.type === 'video' ? (
  <video
    autoPlay
    muted
    loop
    playsInline
    className="w-full h-full object-cover"
  >
    <source src={slide.src} type="video/mp4" />
    <source src={slide.src.replace('.mp4', '.webm')} type="video/webm" />
    <source src={slide.src.replace('.mp4', '.ogv')} type="video/ogg" />
    Your browser does not support the video tag.
  </video>
) : (
  // Image fallback...
)}
```

## File Structure Example

```
public/
├── videos/
│   ├── hero-video-1.mp4
│   ├── hero-video-2.mp4
│   ├── hero-video-3.mp4
│   └── hero-video-4.mp4
├── images/
│   ├── hero-image-1.jpg
│   └── hero-image-2.jpg
└── ziki-apparel-logo.png
```

## Customizing Slide Settings

### Change Auto-Play Duration
In `src/pages/index.tsx`, modify the interval:

```tsx
useEffect(() => {
  const interval = setInterval(() => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
  }, 10000) // Change from 8000 to 10000 (10 seconds)

  return () => clearInterval(interval)
}, [heroSlides.length])
```

### Disable Auto-Play
Comment out or remove the useEffect for auto-play:

```tsx
// useEffect(() => {
//   const interval = setInterval(() => {
//     setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
//   }, 8000)
//   return () => clearInterval(interval)
// }, [heroSlides.length])
```

## Testing Your Videos

1. Save your changes
2. The development server will automatically reload
3. Check the browser console for any video loading errors
4. Test on different devices and browsers

## Troubleshooting

### Video Not Loading
- Check the file path is correct
- Ensure the video file exists in `public/videos/`
- Check browser console for errors
- Try a different video format

### Video Too Large
- Compress the video file
- Consider using a cloud storage service
- Use video streaming services for large files

### Performance Issues
- Optimize video file size
- Use lazy loading for videos
- Consider using poster images while videos load