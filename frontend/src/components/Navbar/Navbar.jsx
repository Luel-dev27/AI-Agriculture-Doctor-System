const navItems = [
  { label: 'Home', href: '#/' },
  { label: 'Upload Crop', href: '#/upload-crop' },
  { label: 'Diagnosis Result', href: '#/diagnosis-result' },
  { label: 'History', href: '#/history' },
  { label: 'Dashboard', href: '#/dashboard' },
];

export default function Navbar({ currentHash }) {
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
      </nav>
    </header>
  );
}
