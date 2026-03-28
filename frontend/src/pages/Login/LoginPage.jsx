import { useEffect, useState } from 'react';
import Alert from '../../components/Alert/Alert.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import {
  getProfile,
  login,
  register,
  saveAuthSession,
} from '../../services/userService.js';

export default function LoginPage({ authState, isAuthLoading }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
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
      const session =
        mode === 'register'
          ? await register({
              name: name.trim(),
              email: email.trim(),
              password,
            })
          : await login({
              email: email.trim(),
              password,
            });
      const profile = await getProfile();

      saveAuthSession({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        user: profile,
      });
      window.location.hash = '#/dashboard';
    } catch (error) {
      setErrorMessage(
        error.message ||
          (mode === 'register' ? 'Account creation failed.' : 'Sign-in failed.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="login-shell">
      <section className="login-hero">
        <p className="eyebrow">Secure access</p>
        <h1>
          {mode === 'register'
            ? 'Create an account to start managing protected field cases.'
            : 'Sign in to manage field cases with protected history and profile access.'}
        </h1>
        <p className="hero-text">
          {mode === 'register'
            ? 'Create a farmer account with your own email and password, then continue directly into the protected dashboard.'
            : 'The backend now issues JWT tokens and protects the user profile route. Use the demo account below to test the authenticated flow or create your own account.'}
        </p>
        <div className="login-credentials">
          <span>Demo email: farmer@example.com</span>
          <span>Demo password: farmer123</span>
        </div>
      </section>

      <section className="page login-card">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">
              {mode === 'register' ? 'New operator' : 'Operator login'}
            </p>
            <h1>{mode === 'register' ? 'Create your account' : 'Access the dashboard'}</h1>
          </div>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          {mode === 'register' ? (
            <label className="field">
              <span>Full name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                autoComplete="name"
                minLength={2}
                required
              />
            </label>
          ) : null}
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
              placeholder={
                mode === 'register'
                  ? 'At least 8 characters with letters and numbers'
                  : 'Enter your password'
              }
              autoComplete="current-password"
              minLength={8}
              required
            />
          </label>
          <button
            type="submit"
            className="primary-link form-submit"
            disabled={isSubmitting || isAuthLoading}
          >
            {isSubmitting
              ? mode === 'register'
                ? 'Creating account...'
                : 'Signing in...'
              : mode === 'register'
                ? 'Create account'
                : 'Sign in'}
          </button>
        </form>
        <button
          type="button"
          className="secondary-link"
          onClick={() => {
            setErrorMessage('');
            setMode((currentMode) =>
              currentMode === 'login' ? 'register' : 'login',
            );
          }}
          disabled={isSubmitting || isAuthLoading}
        >
          {mode === 'register'
            ? 'Already have an account? Sign in'
            : 'Need an account? Create one'}
        </button>
        {isSubmitting || isAuthLoading ? <Loader /> : null}
        {errorMessage ? <Alert message={errorMessage} /> : null}
      </section>
    </section>
  );
}
