import { useEffect, useState } from 'react';
import Alert from '../../components/Alert/Alert.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import { getProfile, login, saveAuthSession } from '../../services/userService.js';

export default function LoginPage({ authState, isAuthLoading }) {
  const [email, setEmail] = useState('farmer@example.com');
  const [password, setPassword] = useState('farmer123');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (authState?.accessToken) {
      window.location.hash = '#/dashboard';
    }
  }, [authState]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const session = await login({
        email: email.trim(),
        password,
      });
      const profile = await getProfile();

      saveAuthSession({
        accessToken: session.accessToken,
        user: profile,
      });
      window.location.hash = '#/dashboard';
    } catch (error) {
      setErrorMessage(error.message || 'Sign-in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="login-shell">
      <section className="login-hero">
        <p className="eyebrow">Secure access</p>
        <h1>Sign in to manage field cases with protected history and profile access.</h1>
        <p className="hero-text">
          The backend now issues JWT tokens and protects the user profile route.
          Use the demo account below to test the authenticated flow.
        </p>
        <div className="login-credentials">
          <span>Demo email: farmer@example.com</span>
          <span>Demo password: farmer123</span>
        </div>
      </section>

      <section className="page login-card">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">Operator login</p>
            <h1>Access the dashboard</h1>
          </div>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="farmer@example.com"
              autoComplete="username"
              required
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </label>
          <button
            type="submit"
            className="primary-link form-submit"
            disabled={isSubmitting || isAuthLoading}
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        {isSubmitting || isAuthLoading ? <Loader /> : null}
        {errorMessage ? <Alert message={errorMessage} /> : null}
      </section>
    </section>
  );
}
