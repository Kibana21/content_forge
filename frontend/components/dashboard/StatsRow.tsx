import type { ProjectStats } from "@/lib/types/project";

interface StatsRowProps {
  stats: ProjectStats;
}

export function StatsRow({ stats }: StatsRowProps) {
  return (
    <div className="stats-row">
      <div className="stat-card">
        <div className="stat-value">{stats.total}</div>
        <div className="stat-label">Total Projects</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{stats.drafts}</div>
        <div className="stat-label">Drafts</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{stats.exported}</div>
        <div className="stat-label">Exported</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{stats.videos_generated}</div>
        <div className="stat-label">Videos Generated</div>
      </div>
    </div>
  );
}
