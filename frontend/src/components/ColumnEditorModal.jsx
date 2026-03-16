import { useEffect, useState } from 'react';

const COLORS = ['#f72585', '#b5179e', '#7209b7', '#4361ee', '#f97316', '#14b8a6'];

export default function ColumnEditorModal({ open, mode, initialColumn, loading = false, onClose, onConfirm }) {
  const [form, setForm] = useState({ title: '', color: '#b5179e', wipLimit: 0 });

  useEffect(() => {
    if (!open) return;
    setForm({
      title: initialColumn?.title || '',
      color: initialColumn?.color || '#b5179e',
      wipLimit: Number(initialColumn?.wipLimit || 0)
    });
  }, [open, initialColumn]);

  if (!open) return null;

  function submit(e) {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) return;
    onConfirm({
      title,
      color: form.color,
      wipLimit: Number.isFinite(form.wipLimit) ? Math.max(0, Number(form.wipLimit)) : 0
    });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>{mode === 'create' ? 'Nouvelle colonne' : 'Modifier la colonne'}</h3>
        <form onSubmit={submit} className="modal-form">
          <label>Titre</label>
          <input
            autoFocus
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Ex: A faire"
          />

          <label>Limite WIP (0 = sans limite)</label>
          <input
            type="number"
            min="0"
            value={form.wipLimit}
            onChange={(e) => setForm((p) => ({ ...p, wipLimit: Number(e.target.value) }))}
          />

          <label>Couleur de colonne</label>
          <div className="color-palette">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`color-dot ${form.color === c ? 'active' : ''}`}
                style={{ background: c }}
                onClick={() => setForm((p) => ({ ...p, color: c }))}
              />
            ))}
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose} disabled={loading}>Retour</button>
            <button type="submit" disabled={loading}>
              {loading ? 'Chargement...' : mode === 'create' ? 'Ajouter' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
