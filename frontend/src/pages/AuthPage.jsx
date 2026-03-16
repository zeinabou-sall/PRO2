import { useState } from 'react';
import AuthForm from '../components/AuthForm';
import { authApi } from '../lib/api';

export default function AuthPage({ onAuth, notify }) {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(form) {
    try {
      setLoading(true);
      setError('');
      const payload = mode === 'register'
        ? await authApi.register(form.username, form.email, form.password)
        : await authApi.login(form.email, form.password);
      onAuth(payload.jwt, payload.user);
      notify('success', mode === 'register' ? 'Inscription réussie' : 'Connexion réussie');
    } catch (err) {
      setError(err.message);
      notify('error', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <AuthForm mode={mode} onSubmit={submit} loading={loading} error={error} />
      <button className="switch-btn" onClick={() => setMode((m) => (m === 'login' ? 'register' : 'login'))}>
        {mode === 'login' ? 'Créer un compte' : 'Déjà un compte ?'}
      </button>
    </main>
  );
}
