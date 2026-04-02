import { useEffect, useState } from 'react';
import { resolveRoute } from './router.jsx';
import Navbar from '../components/Navbar/Navbar.jsx';
import {
  clearAuthSession,
  getProfile,
  getStoredAuthSession,
  logout,
} from '../services/userService.js';

const protectedRoutes = new Set([
  '#/upload-crop',
  '#/history',
  '#/dashboard',
  '#/knowledge-admin',
]);

function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');
  const [authState, setAuthState] = useState(() => getStoredAuthSession());
  const [isAuthLoading, setIsAuthLoading] = useState(
    Boolean(getStoredAuthSession()?.accessToken),
  );

  useEffect(() => {
    const onHashChange = () => {
      setCurrentHash(window.location.hash || '#/');
    };

    const onAuthChange = () => {
      setAuthState(getStoredAuthSession());
    };

    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('authchange', onAuthChange);

    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('authchange', onAuthChange);
    };
  }, []);

  useEffect(() => {
    async function hydrateProfile() {
      const session = getStoredAuthSession();

      if (!session?.accessToken) {
        setIsAuthLoading(false);
        return;
      }

      try {
        const profile = await getProfile();
        setAuthState({
          ...session,
          user: profile,
        });
      } catch {
        clearAuthSession();
      } finally {
        setIsAuthLoading(false);
      }
    }

    void hydrateProfile();
  }, []);

  useEffect(() => {
    if (!authState?.accessToken && protectedRoutes.has(currentHash)) {
      window.location.hash = '#/login';
    }
  }, [authState, currentHash]);

  const CurrentPage = resolveRoute(currentHash);

  const handleLogout = async () => {
    try {
      if (getStoredAuthSession()?.accessToken) {
        await logout();
      }
    } catch {
      // Best-effort remote logout; local cleanup still happens.
    } finally {
      clearAuthSession();
    }
  };

  return (
    <div className="app-shell">
      <div className="app-backdrop app-backdrop-one" />
      <div className="app-backdrop app-backdrop-two" />
      <Navbar
        currentHash={currentHash}
        authState={authState}
        onLogout={handleLogout}
      />
      <main>
        <CurrentPage authState={authState} isAuthLoading={isAuthLoading} />
      </main>
    </div>
  );
}

export default App;
