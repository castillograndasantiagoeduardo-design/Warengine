/**
 * Forbidden.tsx — Estado 403 cuando el rol no tiene permiso para la vista.
 */

import { Button3D } from '@/components/ui/Button3D';
import { EmptyState } from '@/components/ui/EmptyState';

interface ForbiddenProps {
  message?: string;
}

export function Forbidden({ message = 'Tu rol no tiene permisos para ver esta sección. Si crees que es un error, contacta al Super Admin.' }: ForbiddenProps) {
  return (
    <div className="panel-card">
      <EmptyState
        icon="⛔"
        title="403 · Acceso restringido"
        description={message}
        action={
          <Button3D size="panel" href="/dashboard">
            Volver al inicio
          </Button3D>
        }
      />
    </div>
  );
}
