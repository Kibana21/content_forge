import { clsx } from "clsx";

type BadgeVariant = "draft" | "exported" | "review" | "rendering" | "ready" | "video";

const LABELS: Record<string, string> = {
  draft: "Draft",
  in_review: "In Review",
  exported: "Exported",
  rendering: "Rendering",
  ready: "Ready",
  queued: "Queued",
  failed: "Failed",
};

const VARIANT_MAP: Record<string, BadgeVariant> = {
  draft: "draft",
  in_review: "review",
  exported: "exported",
  rendering: "rendering",
  ready: "ready",
  queued: "rendering",
  failed: "draft",
};

interface BadgeProps {
  status: string;
  className?: string;
}

export function Badge({ status, className }: BadgeProps) {
  const variant = VARIANT_MAP[status] || "draft";
  return (
    <span className={clsx("badge", `badge-${variant}`, className)}>
      <span className="badge-dot" />
      {LABELS[status] || status}
    </span>
  );
}
