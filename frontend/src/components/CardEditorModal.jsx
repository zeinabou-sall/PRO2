import { useEffect, useState } from 'react';

const COLOR_OPTIONS = ['#f72585', '#b5179e', '#7209b7', '#4361ee', '#f97316', '#14b8a6'];

export default function CardEditorModal({
  open,
  mode,
  initialCard,
  labels = [],
  onCreateLabel,
  loading = false,
  onClose,
  onConfirm
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    coverColor: '#f72585',
    labels: []
  });
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#f72585');

  useEffect(() => {
    if (!open) return;
    setForm({
      title: initialCard?.title || '',
      description: initialCard?.description || '',
      dueDate: initialCard?.dueDate ? String(initialCard.dueDate).slice(0, 10) : '',
      priority: initialCard?.priority || 'medium',
      coverColor: initialCard?.coverColor || '#f72585',
      labels: (initialCard?.labels || []).map((label) => label.id)
    });
  }, [open, initialCard]);

  if (!open) return null;

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleLabel(labelId) {
    setForm((prev) => ({
      ...prev,
      labels: prev.labels.includes(labelId)
        ? prev.labels.filter((id) => id !== labelId)
        : [...prev.labels, labelId]
    }));
  }

  function submit(e) {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) return;
    onConfirm({
      title,
      description: form.description.trim(),
      dueDate: form.dueDate || null,
      priority: form.priority,
      coverColor: form.coverColor,
      labels: form.labels
    });
  }

  async function createLabelAndSelect() {
    const name = newLabelName.trim();
    if (!name || !onCreateLabel) return;
    const created = await onCreateLabel({ name, color: newLabelColor });
    if (!created?.id) return;

    setForm((prev) => ({
      ...prev,
      labels: prev.labels.includes(created.id) ? prev.labels : [...prev.labels, created.id]
    }));
    setNewLabelName('');
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>{mode === 'create' ? 'Nouvelle carte' : 'Modifier la carte'}</h3>
        <form onSubmit={submit} className="modal-form">
          <label>Titre</label>
          <input autoFocus value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Titre de la carte" />

          <label>Description</label>
          <textarea rows={4} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Description detaillee" />

          <label>Date d'echeance</label>
          <input type="date" value={form.dueDate} onChange={(e) => update('dueDate', e.target.value)} />

          <label>Priorite</label>
          <select value={form.priority} onChange={(e) => update('priority', e.target.value)}>
            <option value="high">Haute</option>
            <option value="medium">Moyenne</option>
            <option value="low">Basse</option>
          </select>

          <label>Couleur</label>
          <div className="color-palette">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                type="button"
                className={`color-dot ${form.coverColor === color ? 'active' : ''}`}
                style={{ background: color }}
                onClick={() => update('coverColor', color)}
                aria-label={`Couleur ${color}`}
              />
            ))}
          </div>

          <label>Labels</label>
          <div className="label-picker">
            {labels.length === 0 ? <small>Aucun label cree</small> : null}
            {labels.map((label) => (
              <button
                key={label.id}
                type="button"
                className={`label-chip ${form.labels.includes(label.id) ? 'selected' : ''}`}
                onClick={() => toggleLabel(label.id)}
                style={{ borderColor: label.color }}
              >
                <span className="label-dot" style={{ background: label.color }} />
                {label.name}
              </button>
            ))}
          </div>

          <div className="new-label-wrap">
            <label>Nouveau label</label>
            <div className="new-label-row">
              <input
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="Ex: Bug"
              />
              <input
                type="color"
                value={newLabelColor}
                onChange={(e) => setNewLabelColor(e.target.value)}
              />
              <button type="button" onClick={createLabelAndSelect}>Creer</button>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose} disabled={loading}>Annuler</button>
            <button type="submit" disabled={loading}>
              {loading ? 'Chargement...' : mode === 'create' ? 'Creer' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
