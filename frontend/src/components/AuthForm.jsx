import { useEffect, useState } from 'react';

export default function AuthForm({ mode, onSubmit, loading, error }) {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const isRegister = mode === 'register';

  useEffect(() => {
    setForm({ username: '', email: '', password: '' });
  }, [mode]);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit(e) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <form className="auth-card" onSubmit={submit} autoComplete="off">
      <h1>SupTaskFlow</h1>
      <p>{isRegister ? 'Creer un compte' : 'Connexion'}</p>
      {isRegister && (
        <input
          required
          placeholder="Nom d'utilisateur"
          value={form.username}
          onChange={(e) => update('username', e.target.value)}
          autoComplete="off"
        />
      )}
      <input
        required
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => update('email', e.target.value)}
        autoComplete="off"
      />
      <input
        required
        type="password"
        minLength={6}
        placeholder="Mot de passe"
        value={form.password}
        onChange={(e) => update('password', e.target.value)}
        autoComplete="new-password"
      />
      {error && <div className="error-text">{error}</div>}
      <button disabled={loading}>{loading ? 'Chargement...' : isRegister ? "S'inscrire" : 'Se connecter'}</button>
    </form>
  );
}
