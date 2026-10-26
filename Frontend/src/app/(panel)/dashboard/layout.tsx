/**
 * Layout del panel administrativo: envuelve /dashboard y todas sus subrutas
 * (sucursales, empleados, … y las vistas del admin de sucursal) con el shell común.
 */

import { PanelShell } from '@/components/panel/PanelShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <PanelShell>{children}</PanelShell>;
}
