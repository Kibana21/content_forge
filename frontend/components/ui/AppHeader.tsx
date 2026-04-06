"use client";
import Link from "next/link";

interface AppHeaderProps {
  right?: React.ReactNode;
  showAutosave?: boolean;
}

export function AppHeader({ right, showAutosave }: AppHeaderProps) {
  return (
    <header className="app-header">
      <Link href="/" className="logo">Story Studio</Link>
      <div className="header-actions">
        {showAutosave && (
          <span className="autosave">
            <span className="autosave-dot" />
            Autosaved
          </span>
        )}
        {right}
      </div>
    </header>
  );
}
