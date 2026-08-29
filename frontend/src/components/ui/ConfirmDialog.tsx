import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  variant?: 'primary' | 'danger';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', variant = 'primary' }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <p className="text-gray-600 text-sm mb-6">{message}</p>
    <div className="flex justify-end gap-3 mt-4">
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button variant={variant} onClick={() => { onConfirm(); onClose(); }}>{confirmText}</Button>
    </div>
  </Modal>
);

export default ConfirmDialog;
