'use client';
import Image from 'next/image';

// Tiny 1x1 transparent blur placeholder.
const BLUR =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAH+gJ/6cZ3WwAAAABJRU5ErkJggg==';

/**
 * EAImage — thin wrapper around next/image with a built‑in blur placeholder.
 *
 * Usage examples:
 *  <EAImage src={url} alt={title} width={600} height={800} sizes="(min-width:1024px) 25vw, 50vw" />
 *  <div className="relative w-full aspect-[3/4]">
 *    <EAImage src={url} alt="" fill className="object-cover" />
 *  </div>
 */
export default function EAImage({
  src,
  alt = '',
  width,
  height,
  sizes,
  className,
  priority = false,
  quality,
  fill = false,
  style,
  onClick,
}) {
  if (!src) return null;

  // Fill mode: consumer must wrap with a relative container and set sizing via CSS.
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={className}
        placeholder='blur'
        blurDataURL={BLUR}
        priority={priority}
        quality={quality}
        style={style}
        onClick={onClick}
      />
    );
  }

  // Next/Image requires width & height unless using fill. Provide sensible fallbacks.
  const w = typeof width === 'number' ? width : Number(width) || undefined;
  const h = typeof height === 'number' ? height : Number(height) || undefined;
  const finalWidth = w ?? 800;
  const finalHeight = h ?? 1000; // default to portrait-ish if not provided

  return (
    <Image
      src={src}
      alt={alt}
      width={finalWidth}
      height={finalHeight}
      sizes={sizes}
      className={className}
      placeholder='blur'
      blurDataURL={BLUR}
      priority={priority}
      quality={quality}
      style={style}
      onClick={onClick}
    />
  );
}
