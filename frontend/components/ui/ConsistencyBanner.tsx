interface ConsistencyBannerProps {
  presenterName: string;
  brandKit: string | null;
}

export function ConsistencyBanner({ presenterName, brandKit }: ConsistencyBannerProps) {
  return (
    <div className="consistency-banner">
      <span>🔒</span>
      <span>
        <strong>{presenterName}&apos;s</strong> appearance is locked and auto-injected into every scene.
        {brandKit && <> Brand kit <strong>&apos;{brandKit}&apos;</strong> applied.</>}
      </span>
    </div>
  );
}
