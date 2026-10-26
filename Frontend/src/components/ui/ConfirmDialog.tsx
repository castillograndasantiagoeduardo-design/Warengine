'use client';

/**
 * ConfirmDialog.tsx — Confirmación explícita para acciones sensibles (inactivar, eliminar).
 */

import React from 'react';
import { Modal } from './Modal';
import { Button3D } from './Button3D';
import { Spinner } from './Spinner';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'gold' | 'success';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      locked={loading}
      footer={
        <>
          <Button3D size="panel" variant="navy" type="button" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button3D>
          <Button3D size="panel" variant={tone} type="button" onClick={onConfirm} disabled={loading}>
            {loading && <Spinner size={16} />}
            {confirmLabel}
          </Button3D>
        </>
      }
    >
      <div className="text-sm text-white/80 leading-relaxed">{message}</div>
    </Modal>
  );
}
