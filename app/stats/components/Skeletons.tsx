export function ResultSkeleton({ table = false }: { table?: boolean }) {
  return <div className={table ? "stats-table-skeleton" : "stats-grid"} aria-hidden="true">
    {Array.from({ length: table ? 8 : 12 }, (_, index) => table ? <div className="stats-skeleton-row" key={index}><span className="stats-skeleton square" /><span className="stats-skeleton line" /><span className="stats-skeleton line short" /></div> : <div className="stats-card stats-skeleton-card" key={index}><span className="stats-skeleton square" /><span className="stats-skeleton line" /><span className="stats-skeleton line short" /><span className="stats-skeleton line" /></div>)}
  </div>;
}
export default function PageSkeleton() {
  return <div role="status" aria-label="Statistiken werden geladen"><span className="sr-only">Statistiken werden geladen</span><div className="stats-skeleton-hero" aria-hidden="true"><span className="stats-skeleton line short" /><span className="stats-skeleton title" /><span className="stats-skeleton line" /></div><div className="stats-metrics" aria-hidden="true">{Array.from({ length: 4 }, (_, index) => <div key={index}><span className="stats-skeleton line short" /><span className="stats-skeleton line" /></div>)}</div><ResultSkeleton /></div>;
}
