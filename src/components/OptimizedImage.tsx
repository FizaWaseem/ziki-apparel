import Image from 'next/image';
import { ImgHTMLAttributes } from 'react';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    fill?: boolean;
    priority?: boolean;
    className?: string;
    objectFit?: 'contain' | 'cover' | 'fill' | 'scale-down';
    objectPosition?: string;
}

/**
 * OptimizedImage Component
 * 
 * Handles both remote and local uploaded images properly.
 * For uploaded files in /uploads/, it disables optimization on production.
 * For external images, it uses Next.js image optimization.
 */
export default function OptimizedImage({
    src,
    alt,
    width,
    height,
    fill = false,
    priority = false,
    className = '',
    objectFit = 'cover',
    objectPosition = 'center',
    ...props
}: OptimizedImageProps) {
    // Check if this is a local uploaded image
    const isLocalUpload = src.startsWith('/uploads/');

    // On Vercel (production), disable optimization for local uploads
    // This prevents the "INVALID_IMAGE_OPTIMIZE_REQUEST" error
    const shouldOptimize = !isLocalUpload;

    return (
        <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            fill={fill}
            priority={priority}
            unoptimized={!shouldOptimize}
            className={className}
            style={
                fill
                    ? {
                        objectFit,
                        objectPosition,
                    }
                    : {}
            }
            {...props}
        />
    );
}
