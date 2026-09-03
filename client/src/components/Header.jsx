export default function Header({ onNavigate, theme, onToggleTheme }) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <button className="brand" onClick={() => onNavigate("analyze")}>
          <span className="brand-mark" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Deepfake Forensics Lab
        </button>

        <nav className="site-nav">
          <span className="nav-links">
            <button onClick={() => onNavigate("analyze")}>Analyze</button>
            <button onClick={() => onNavigate("how-it-works")}>How It Works</button>
            <button onClick={() => onNavigate("about")}>About / Limitations</button>
          </span>
          <button
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            title="Toggle light/dark theme"
          >
            {theme === "dark" ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" />
                <path
                  d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8L6 18M18 6l1.8-1.8"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 14.5A8.5 8.5 0 119.5 4a7 7 0 0010.5 10.5z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
