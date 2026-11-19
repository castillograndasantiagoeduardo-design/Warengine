'use client';

import React, { Suspense, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Plus, Users, UserPlus } from 'lucide-react';
import { PageHeader, Pagination, LoadingState, EmptyState, ErrorState } from '@/features/admin-sucursal/components/shared';
import {
  ClientSummaryChips,
  ClientsFilterBar,
  ClientsTable,
  ClientDrawer,
  CreateClientModal,
  EditClientModal,
  ManageCreditModal,
} from '@/features/admin-sucursal/components/clients';
import { useBranchClients } from '@/features/admin-sucursal/hooks/useBranchClients';
import type {
  ClienteDto,
  FiltrosClientesState,
  CrearClienteInput,
  ActualizarClienteInput,
} from '@/features/admin-sucursal/types/branch-clients.types';

function ClientesView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Estados derivados de la URL
  const q = searchParams.get('q') || '';
  const tipoParam = searchParams.get('tipo');
  const tipoCliente = tipoParam === 'B2B' || tipoParam === 'B2C' ? (tipoParam as 'B2C' | 'B2B') : undefined;
  const creditoParam = searchParams.get('credito');
  const creditoHabilitado =
    creditoParam === 'true' ? true : creditoParam === 'false' ? false : undefined;
  const estadoParam = searchParams.get('estado');
  const estado =
    estadoParam === 'activo' || estadoParam === 'inactivo'
      ? (estadoParam as 'activo' | 'inactivo')
      : undefined;
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const limite = 20;

  // Modales y Drawer
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [clienteAEditar, setClienteAEditar] = useState<ClienteDto | null>(null);
  const [clienteCredito, setClienteCredito] = useState<ClienteDto | null>(null);
  const [clienteFicha, setClienteFicha] = useState<ClienteDto | null>(null);

  // Hook del módulo
  const filtros: FiltrosClientesState = useMemo(
    () => ({
      texto: q || undefined,
      tipoCliente,
      creditoHabilitado,
      estado,
      page,
      limite,
    }),
    [q, tipoCliente, creditoHabilitado, estado, page, limite],
  );

  const {
    datos,
    total,
    totalPaginas,
    resumen,
    cargando,
    error,
    recargar,
    crearCliente,
    actualizarCliente,
    gestionarCredito,
    obtenerUltimasFacturas,
  } = useBranchClients(filtros);

  // Sincronización con URL
  const actualizarUrl = (nuevosParams: Record<string, string | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(nuevosParams)) {
      if (val === undefined || val === null || val === '') {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleCambioBusqueda = (texto: string) => {
    actualizarUrl({ q: texto || null, page: '1' });
  };

  const handleCambioTipo = (tipo?: 'B2C' | 'B2B') => {
    actualizarUrl({ tipo: tipo || null, page: '1' });
  };

  const handleCambioCredito = (credito?: boolean) => {
    actualizarUrl({
      credito: credito !== undefined ? String(credito) : null,
      page: '1',
    });
  };

  const handleCambioEstado = (nuevoEstado?: 'activo' | 'inactivo') => {
    actualizarUrl({ estado: nuevoEstado || null, page: '1' });
  };

  const handleSelectChipFiltro = (cambios: {
    tipoCliente?: 'B2C' | 'B2B';
    creditoHabilitado?: boolean;
  }) => {
    actualizarUrl({
      tipo: cambios.tipoCliente || null,
      credito:
        cambios.creditoHabilitado !== undefined ? String(cambios.creditoHabilitado) : null,
      page: '1',
    });
  };

  const handleLimpiarFiltros = () => {
    actualizarUrl({
      q: null,
      tipo: null,
      credito: null,
      estado: null,
      page: '1',
    });
  };

  const hayFiltrosActivos = Boolean(q || tipoCliente || creditoHabilitado !== undefined || estado);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <PageHeader
        title="Clientes"
        description="Directorio de clientes B2C y corporativos B2B, estado crediticio e historial de compras."
        actions={
          <button
            type="button"
            onClick={() => setModalCrearAbierto(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-black bg-[#e3b341] hover:bg-[#d4a331] transition-colors shadow-lg shadow-[#e3b341]/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo cliente</span>
          </button>
        }
      />

      {/* Chips de resumen */}
      <ClientSummaryChips
        resumen={resumen}
        filtroTipo={tipoCliente}
        filtroCredito={creditoHabilitado}
        onSelectFiltro={handleSelectChipFiltro}
      />

      {/* Barra de filtros */}
      <ClientsFilterBar
        busqueda={q}
        onCambioBusqueda={handleCambioBusqueda}
        tipoCliente={tipoCliente}
        onCambioTipo={handleCambioTipo}
        creditoHabilitado={creditoHabilitado}
        onCambioCredito={handleCambioCredito}
        estado={estado}
        onCambioEstado={handleCambioEstado}
        onLimpiarFiltros={handleLimpiarFiltros}
        hayFiltrosActivos={hayFiltrosActivos}
      />

      {/* Estados / Tabla */}
      {cargando ? (
        <LoadingState rows={6} />
      ) : error ? (
        <ErrorState
          title="Error al cargar clientes"
          message={error}
          onRetry={recargar}
        />
      ) : datos.length === 0 ? (
        hayFiltrosActivos ? (
          <EmptyState
            title="No se encontraron clientes"
            description="No hay resultados que coincidan con los filtros y término de búsqueda aplicados."
            icon={<Users className="w-6 h-6 text-slate-400" />}
            action={
              <button
                type="button"
                onClick={handleLimpiarFiltros}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
              >
                Limpiar filtros
              </button>
            }
          />
        ) : (
          <EmptyState
            title="Sin clientes registrados"
            description="Comienza registrando a tus clientes para habilitar ventas a crédito e historial comercial."
            icon={<UserPlus className="w-6 h-6 text-[#e3b341]" />}
            action={
              <button
                type="button"
                onClick={() => setModalCrearAbierto(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-black bg-[#e3b341] hover:bg-[#d4a331] transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Crear primer cliente</span>
              </button>
            }
          />
        )
      ) : (
        <div className="space-y-4">
          <ClientsTable
            clientes={datos}
            onVerFicha={(c) => setClienteFicha(c)}
            onEditar={(c) => setClienteAEditar(c)}
            onGestionarCredito={(c) => setClienteCredito(c)}
          />

          {totalPaginas > 1 && (
            <div className="vidrio rounded-2xl border border-white/[0.08] overflow-hidden">
              <Pagination
                page={page}
                totalPages={totalPaginas}
                total={total}
                onPageChange={(nuevaPagina) =>
                  actualizarUrl({ page: String(nuevaPagina) })
                }
              />
            </div>
          )}
        </div>
      )}

      {/* Panel lateral / Drawer Ficha */}
      <ClientDrawer
        cliente={clienteFicha}
        onClose={() => setClienteFicha(null)}
        onEditar={(c) => {
          setClienteFicha(null);
          setClienteAEditar(c);
        }}
        onGestionarCredito={(c) => {
          setClienteFicha(null);
          setClienteCredito(c);
        }}
        cargarFacturas={obtenerUltimasFacturas}
      />

      {/* Modal de Crear */}
      <CreateClientModal
        isOpen={modalCrearAbierto}
        onClose={() => setModalCrearAbierto(false)}
        onClienteCreado={(nuevo) => {
          setClienteFicha(nuevo);
        }}
        onSubmit={crearCliente}
      />

      {/* Modal de Editar */}
      <EditClientModal
        cliente={clienteAEditar}
        isOpen={Boolean(clienteAEditar)}
        onClose={() => setClienteAEditar(null)}
        onClienteActualizado={(actualizado) => {
          if (clienteFicha?.id === actualizado.id) {
            setClienteFicha(actualizado);
          }
        }}
        onSubmit={actualizarCliente}
      />

      {/* Modal de Gestionar Crédito */}
      <ManageCreditModal
        cliente={clienteCredito}
        isOpen={Boolean(clienteCredito)}
        onClose={() => setClienteCredito(null)}
        onCreditoActualizado={(actualizado) => {
          if (clienteFicha?.id === actualizado.id) {
            setClienteFicha(actualizado);
          }
        }}
        onSubmit={gestionarCredito}
      />
    </div>
  );
}

export default function AdminSucursalClientesPage() {
  return (
    <Suspense fallback={<LoadingState rows={6} />}>
      <ClientesView />
    </Suspense>
  );
}
