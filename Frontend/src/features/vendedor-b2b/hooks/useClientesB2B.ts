'use client';

/**
 * useClientesB2B.ts — Custom hook para búsqueda, registro y evaluación preliminar
 * de crédito B2B según ganancia neta declarada.
 */

import { useState, useCallback, useEffect } from 'react';
import { crearClienteSchema } from '@warengine/contracts';
import type { ClienteDto, CrearClienteInput, EvaluacionCreditoB2BDto } from '../types';
import { vendedorB2bService } from '../api';
import { ApiError } from '@/lib/api';

const ESTADO_INICIAL_FORM: CrearClienteInput = {
  tipoDocumento: 'NIT',
  numeroDocumento: '',
  nombreRazonSocial: '',
  tipoCliente: 'B2B',
  email: '',
  telefono: '',
  direccion: '',
  solicitarCredito: false,
  gananciaNetaMensual: undefined,
  antiguedadEmpresaMeses: undefined,
  plazoCreditoDias: 30,
  observacionFinanciera: '',
};

export function useClientesB2B() {
  const [clientes, setClientes] = useState<ClienteDto[]>([]);
  const [busqueda, setBusqueda] = useState<string>('');
  const [isLoadingClientes, setIsLoadingClientes] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isGuardando, setIsGuardando] = useState<boolean>(false);
  const [erroresForm, setErroresForm] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [evaluacionCredito, setEvaluacionCredito] = useState<EvaluacionCreditoB2BDto | null>(null);
  const [isSimulandoCredito, setIsSimulandoCredito] = useState<boolean>(false);
  const [alertaSuperAdminMsg, setAlertaSuperAdminMsg] = useState<string | null>(null);

  const [formNuevoCliente, setFormNuevoCliente] = useState<CrearClienteInput>(ESTADO_INICIAL_FORM);

  const cargarClientes = useCallback(async (query = '') => {
    setIsLoadingClientes(true);
    try {
      const data = await vendedorB2bService.buscarClientes(query);
      setClientes(data.filter((c) => c.tipoCliente === 'B2B'));
    } catch {
      setClientes([]);
    } finally {
      setIsLoadingClientes(false);
    }
  }, []);

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  // Simulación en vivo contra el motor oficial del backend cuando el usuario ingresa ganancia neta
  useEffect(() => {
    if (
      !formNuevoCliente.solicitarCredito ||
      !formNuevoCliente.gananciaNetaMensual ||
      formNuevoCliente.gananciaNetaMensual <= 0
    ) {
      setEvaluacionCredito(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSimulandoCredito(true);
      try {
        const res = await vendedorB2bService.simularCreditoB2B({
          gananciaNetaMensual: formNuevoCliente.gananciaNetaMensual!,
          antiguedadEmpresaMeses: formNuevoCliente.antiguedadEmpresaMeses,
          plazoCreditoDias: formNuevoCliente.plazoCreditoDias ?? 30,
        });
        setEvaluacionCredito(res);
      } catch {
        setEvaluacionCredito(null);
      } finally {
        setIsSimulandoCredito(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [
    formNuevoCliente.solicitarCredito,
    formNuevoCliente.gananciaNetaMensual,
    formNuevoCliente.antiguedadEmpresaMeses,
    formNuevoCliente.plazoCreditoDias,
  ]);

  const buscar = useCallback(
    (texto: string) => {
      setBusqueda(texto);
      cargarClientes(texto);
    },
    [cargarClientes],
  );

  const setCampo = useCallback(<K extends keyof CrearClienteInput>(campo: K, valor: CrearClienteInput[K]) => {
    setFormNuevoCliente((prev: CrearClienteInput) => ({ ...prev, [campo]: valor }));
    setErroresForm((prev: Record<string, string>) => ({ ...prev, [campo]: '' }));
    setErrorGeneral(null);
  }, []);

  const resetForm = useCallback(() => {
    setFormNuevoCliente(ESTADO_INICIAL_FORM);
    setErroresForm({});
    setErrorGeneral(null);
    setEvaluacionCredito(null);
  }, []);

  const registrarCliente = useCallback(
    async (onSuccess?: (nuevo: ClienteDto) => void): Promise<boolean> => {
      setErrorGeneral(null);
      setErroresForm({});

      const resultado = crearClienteSchema.safeParse(formNuevoCliente);
      if (!resultado.success) {
        const nuevosErrores: Record<string, string> = {};
        resultado.error.errors.forEach((err: { path: (string | number)[]; message: string }) => {
          const campo = String(err.path[0] || '');
          if (campo && !nuevosErrores[campo]) {
            nuevosErrores[campo] = err.message;
          }
        });
        setErroresForm(nuevosErrores);
        return false;
      }

      setIsGuardando(true);
      try {
        const resp = await vendedorB2bService.crearCliente(resultado.data);
        setClientes((prev) => [resp.cliente, ...prev.filter((c) => c.id !== resp.cliente.id)]);
        if (resp.alertaSuperAdminEnviada) {
          const cupoTxt = (resp.evaluacionCredito?.cupoSugerido ?? 0).toLocaleString('es-CO');
          setAlertaSuperAdminMsg(
            `Cliente ${resp.cliente.nombreRazonSocial} creado. Se envió advertencia urgente al Super Admin con cupo sugerido de $${cupoTxt} COP para su aprobación.`,
          );
        }
        resetForm();
        setIsModalOpen(false);
        if (onSuccess) onSuccess(resp.cliente);
        return true;
      } catch (err) {
        if (err instanceof ApiError) {
          setErrorGeneral(err.message || 'Error al registrar cliente corporativo.');
        } else {
          setErrorGeneral('Error inesperado de red al registrar cliente.');
        }
        return false;
      } finally {
        setIsGuardando(false);
      }
    },
    [formNuevoCliente, resetForm],
  );

  return {
    clientes,
    busqueda,
    isLoadingClientes,
    isModalOpen,
    setIsModalOpen,
    isGuardando,
    formNuevoCliente,
    erroresForm,
    errorGeneral,
    evaluacionCredito,
    isSimulandoCredito,
    alertaSuperAdminMsg,
    setAlertaSuperAdminMsg,
    buscar,
    setCampo,
    resetForm,
    registrarCliente,
    recargarClientes: cargarClientes,
  };
}
