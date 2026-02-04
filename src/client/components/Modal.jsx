import { useEffect } from 'react';

export function Modal({ open, onClose, title, body, footer }) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.classList.add('modal-open');

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('modal-open');
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="modal"
        role="dialog"
        style={{ display: 'block' }}
        onClick={onClose}
      >
        <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content">
            <div className="modal-header">
              <button
                type="button"
                className="close"
                aria-label="Close"
                onClick={onClose}
              >
                <span aria-hidden="true">&times;</span>
              </button>
              <h4 className="modal-title">{title}</h4>
            </div>

            <div className="modal-body">{body}</div>
            <div className="modal-footer">{footer}</div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade in" />
    </>
  );
}
