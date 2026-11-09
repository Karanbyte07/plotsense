import { useState } from 'react';
import { posterFallbackSeed, safeYear } from '@/lib/format';

/**
 * TMDB poster with a designed fallback.
 * On error (or when no URL is present) it renders a charcoal card
 * showing the title + year — never a broken image.
 *
 * @param {{
 *   url: string | null,
 *   title: string,
 *   year: number | null,
 *   sizes?: string,
 *   priority?: boolean,
 * }} props
 */
export function Poster({ url, title, year, sizes, priority = false }) {
  const [errored, setErrored] = useState(false);
  const showFallback = !url || errored;

  if (showFallback) {
    return <PosterFallback title={title} year={year} />;
  }

  return (
    <img
      src={url}
      alt={`${title} poster`}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setErrored(true)}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      }}
    />
  );
}

/**
 * Fallback poster shown when no image URL is available or the image fails to load.
 *
 * @param {{ title: string, year: number | null }} props
 */
export function PosterFallback({ title, year }) {
  const hue = posterFallbackSeed(title);
  const yr = safeYear(year);
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden p-4 text-center"
      style={{
        background: `linear-gradient(155deg, hsl(${hue}, 8%, 11%) 0%, #0b0d10 70%)`,
      }}
      aria-label={`${title} poster unavailable`}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(245,184,65,0.35), transparent)',
        }}
      />
      <span className="label-eyebrow mb-2">PlotSense</span>
      <span className="font-display text-md font-semibold leading-tight text-ink-2 clamp-4" style={{ WebkitLineClamp: 4 }}>
        {title}
      </span>
      {yr != null && (
        <span className="telemetry mt-2 text-[11px] text-ink-3">{yr}</span>
      )}
    </div>
  );
}

