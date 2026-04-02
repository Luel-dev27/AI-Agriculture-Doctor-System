export default function Navbar({ currentHash, authState, onLogout }) {
  const userName = authState?.user?.name || 'Guest';
  const userRole = authState?.user?.role || 'visitor';
  const navItems = [
    { label: 'Home', href: '#/' },
    ...(authState?.accessToken ? [] : [{ label: 'Login', href: '#/login' }]),
    { label: 'Upload Crop', href: '#/upload-crop' },
    { label: 'Diagnosis Result', href: '#/diagnosis-result' },
    { label: 'History', href: '#/history' },
    { label: 'Dashboard', href: '#/dashboard' },
    ...(userRole === 'admin'
      ? [{ label: 'Knowledge Base', href: '#/knowledge-admin' }]
      : []),
  ];

  return (
    <header className="site-header">
      <nav className="navbar" aria-label="Main navigation">
        <a href="#/" className="brand-mark">
          <span className="brand-kicker">AI Crop Intelligence</span>
          <strong>AI Agriculture Doctor</strong>
        </a>
        <div className="nav-links">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={currentHash === item.href ? 'active' : ''}
              aria-current={currentHash === item.href ? 'page' : undefined}
            >
              {item.label}
            </a>
          ))}
        </div>
        <div className="nav-session">
          <div className="session-badge">
            <span>{userName}</span>
            <strong>{userRole}</strong>
          </div>
          {authState?.accessToken ? (
            <button
              type="button"
              className="nav-action"
              onClick={async () => {
                await onLogout();
                window.location.hash = '#/';
              }}
            >
              Log out
            </button>
          ) : (
            <a href="#/login" className="nav-action">
              Sign in
            </a>
          )}
        </div>
      </nav>
    </header>
  );
}
