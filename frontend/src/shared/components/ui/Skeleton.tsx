

export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200 dark:bg-white/10 ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div className="flex items-end gap-2 px-2" style={{ height }} aria-label="Loading chart" role="status">
      {[40, 65, 45, 80, 55, 70, 35].map((h, i) => (
        <Skeleton
          key={i}
          className="flex-1 rounded-t-md rounded-b-none"
          style={{ height: `${h}%`, animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}
