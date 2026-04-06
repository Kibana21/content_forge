interface ProgressBarProps {
  percent: number;
}

export function ProgressBar({ percent }: ProgressBarProps) {
  return (
    <div className="progress-bar-track">
      <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
    </div>
  );
}
