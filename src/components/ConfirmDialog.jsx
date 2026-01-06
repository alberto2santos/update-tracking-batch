export default function ConfirmDialog({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel 
}) {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal confirm-dialog">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn-danger" onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}