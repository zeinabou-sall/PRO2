import { useEffect, useState } from 'react';

export default function TextModal({ open, title, label, placeholder, initialValue = '', confirmText, onClose, onConfirm }) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  if (!open) return null;

  function submit(e) {
    e.preventDefault();
    const clean = value.trim();
    if (!clean) return;
    onConfirm(clean);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <form onSubmit={submit} className="modal-form">
          <label>{label}</label>
          <input autoFocus value={value} placeholder={placeholder} onChange={(e) => setValue(e.target.value)} />
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose}>Annuler</button>
            <button type="submit">{confirmText}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

