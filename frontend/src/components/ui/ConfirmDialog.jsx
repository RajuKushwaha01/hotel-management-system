import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Are you sure?', message }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-text-secondary text-sm mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          variant="primary"
          className="!bg-danger !bg-none"
          onClick={() => { onConfirm(); onClose(); }}
        >
          Confirm
        </Button>
      </div>
    </Modal>
  );
}
