export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = 'Confirmer',
  loading = false,
  onCancel,
  onConfirm
}) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card confirm-card" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onCancel} disabled={loading}>Annuler</button>
          <button type="button" className="danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Suppression...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
