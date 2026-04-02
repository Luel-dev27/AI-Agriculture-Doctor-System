export default function HomePage() {
  return (
    <section className="home-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Field diagnostics, redesigned</p>
          <h1>Plant disease triage that feels as sharp as the science behind it.</h1>
          <p className="hero-text">
            Upload crop images, generate medicine-guided diagnoses, review expert feedback, and manage crop intelligence from one operational dashboard.
          </p>
          <div className="hero-actions">
            <a href="#/upload-crop" className="primary-link">Start a diagnosis</a>
            <a href="#/dashboard" className="secondary-link">View command center</a>
            <a href="#/login" className="secondary-link">Sign in</a>
          </div>
        </div>
        <div className="hero-grid">
          <article className="spotlight-card tall">
            <p className="eyebrow">Live workflow</p>
            <h2>Upload, inspect, respond</h2>
            <p>Guide farmers from visual symptoms to practical intervention steps in a single pass.</p>
          </article>
          <article className="spotlight-card accent">
            <p className="eyebrow">Built for continuity</p>
            <h2>Persistent diagnosis history</h2>
          </article>
          <article className="spotlight-card">
            <p className="eyebrow">AI-ready</p>
            <h2>Provider-backed interface</h2>
          </article>
        </div>
      </section>

      <section className="feature-ribbon">
        <article className="page feature-card">
          <p className="eyebrow">Upload Lab</p>
          <h2>Fast crop intake</h2>
          <p>Choose a crop, attach an image, and launch the diagnosis workflow in seconds.</p>
        </article>
        <article className="page feature-card">
          <p className="eyebrow">Case History</p>
          <h2>Trace every decision</h2>
          <p>Review severity, medicine guidance, provider source, and expert feedback across previous records.</p>
        </article>
        <article className="page feature-card">
          <p className="eyebrow">Knowledge Control</p>
          <h2>Teach the AI safely</h2>
          <p>Admins can add crop diseases, medicines, and symptom keywords that the diagnosis engine must follow.</p>
        </article>
      </section>
    </section>
  );
}
