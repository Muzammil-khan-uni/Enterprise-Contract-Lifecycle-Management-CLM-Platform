import { useState } from 'react';

const PALETTE = [
  'bg-brass-500 text-ink-950',
  'bg-info-500 text-white',
  'bg-success-600 text-white',
  'bg-danger-600 text-white',
  'bg-ink-700 text-white',
  'bg-warning-500 text-ink-950',
] as const;

function colorFor(seed: string): (typeof PALETTE)[number] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const SIZE_CLASSES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
  xl: 'h-24 w-24 text-3xl',
} as const;

export function Avatar({
  name,
  seed,
  size = 'md',
  className = '',
  photoUrl,
}: {
  name: string;
  
  seed?: string;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
  
  photoUrl?: string | null;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showPhoto = photoUrl && !imgFailed;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-white dark:ring-ink-900 overflow-hidden ${
        showPhoto ? 'bg-slate-100 dark:bg-ink-800' : colorFor(seed ?? name)
      } ${SIZE_CLASSES[size]} ${className}`}
    >
      {showPhoto ? (
        <img src={photoUrl} alt="" className="h-full w-full object-cover" onError={() => setImgFailed(true)} />
      ) : (
        initialsFor(name || '?')
      )}
    </span>
  );
}
