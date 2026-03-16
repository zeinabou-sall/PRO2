import { useCallback, useEffect, useState } from 'react';
import AuthPage from './pages/AuthPage';
import BoardPage from './pages/BoardPage';
import Toast from './components/Toast';

const STORAGE_KEY = 'suptaskflow-session';
const LAST_BOARD_KEY = 'suptaskflow-last-board-id';

export default function App() {
  const [session, setSession] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      setSession(JSON.parse(saved));
    } catch (_err) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LAST_BOARD_KEY);
    }
  }, []);

  const notify = useCallback((type, message) => {
    setToast({ type, message });
  }, []);

  function onAuth(jwt, user) {
    const next = { jwt, user };
    setSession(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function onLogout() {
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LAST_BOARD_KEY);
  }

  return (
    <>
      {session?.jwt ? (
        <BoardPage token={session.jwt} notify={notify} onLogout={onLogout} />
      ) : (
        <AuthPage onAuth={onAuth} notify={notify} />
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
