/**
 * Skeleton Loader pour les graphiques Recharts
 * 
 * @phase Phase 4 - Performance (Quick Wins)
 * @purpose Améliorer la perception de performance pendant le chargement lazy
 * @impact Réduit l'impression de lenteur (LCP, TTI)
 */

export function ChartSkeleton() {
  return (
    <div className="w-full h-[300px] rounded-lg border bg-card animate-pulse">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded" />
        </div>
        
        {/* Chart area */}
        <div className="h-48 bg-muted/50 rounded flex items-end justify-around gap-2 p-4">
          {/* Bars simulation */}
          {[65, 45, 80, 50, 70, 40, 90].map((height, i) => (
            <div
              key={i}
              className="bg-muted rounded-t w-full"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-muted rounded-full" />
            <div className="h-3 w-16 bg-muted rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-muted rounded-full" />
            <div className="h-3 w-16 bg-muted rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PieChartSkeleton() {
  return (
    <div className="w-full h-[300px] rounded-lg border bg-card animate-pulse">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded" />
        </div>
        
        {/* Pie Chart area */}
        <div className="h-48 flex items-center justify-center">
          <div className="relative w-40 h-40">
            <div className="absolute inset-0 rounded-full bg-muted" />
            <div className="absolute inset-6 rounded-full bg-card" />
          </div>
        </div>
        
        {/* Legend */}
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-3 w-3 bg-muted rounded" />
              <div className="h-3 w-20 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LineChartSkeleton() {
  return (
    <div className="w-full h-[300px] rounded-lg border bg-card animate-pulse">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded" />
        </div>
        
        {/* Line Chart area with wave pattern */}
        <div className="h-48 bg-muted/30 rounded relative overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 300 150">
            <path
              d="M 0 100 Q 50 80, 100 90 T 200 70 T 300 85"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-muted"
            />
            <path
              d="M 0 120 Q 50 110, 100 115 T 200 100 T 300 110"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-muted/50"
            />
          </svg>
        </div>
        
        {/* Legend */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-4 bg-muted rounded" />
            <div className="h-3 w-16 bg-muted rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-4 bg-muted/50 rounded" />
            <div className="h-3 w-16 bg-muted rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
