import { useEffect, useState } from 'react';
import { resolveRoute } from './router.jsx';
import Navbar from '../components/Navbar/Navbar.jsx';

function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');

  useEffect(() => {
    const onHashChange = () => {
      setCurrentHash(window.location.hash || '#/');
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const CurrentPage = resolveRoute(currentHash);

  return (
    <div className="app-shell">
      <div className="app-backdrop app-backdrop-one" />
      <div className="app-backdrop app-backdrop-two" />
      <Navbar currentHash={currentHash} />
      <main>
        <CurrentPage />
      </main>
    </div>
  );
}

export default App;
