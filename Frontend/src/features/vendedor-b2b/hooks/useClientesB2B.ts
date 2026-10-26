'use client';

/**
 * useClientesB2B.ts — Custom hook para búsqueda y registro validado de clientes B2B.
 *
 * Utiliza crearClienteSchema de @warengine/contracts como única fuente de verdad
 * para validar NIT, razón social, teléfono y dirección obligatorios.
 */

import { useState, useCallback, useEffect } from 'react';
import { crearClienteSchema } from '@warengine/contracts';
import type { ClienteDto, CrearClienteInput } from '../types';
import { vendedorB2bService } from '../api';
import { ApiError } from '@/lib/api';

export function useClientesB2B() {
  const [clientes, setClientes] = useState<ClienteDto[]>([]);
  const [busqueda, setBusqueda] = useState<string>('');
  const [isLoadingClientes, setIsLoadingClientes] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isGuardando, setIsGuardando] = useState<boolean>(false);
  const [erroresForm, setErroresForm] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const [formNuevoCliente, setFormNuevoCliente] = useState<CrearClienteInput>({
    tipoDocumento: 'NIT',
    numeroDocumento: '',
    nombreRazonSocial: '',
    tipoCliente: 'B2B',
    email: '',
    telefono: '',
    direccion: '',
  });

  const cargarClientes = useCallback(async (query = '') => {
    setIsLoadingClientes(true);
    try {
      const data = await vendedorB2bService.buscarClientes(query);
      // Solo clientes corporativos: la API rechaza ventas B2B a clientes B2C
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
    setFormNuevoCliente({
      tipoDocumento: 'NIT',
      numeroDocumento: '',
      nombreRazonSocial: '',
      tipoCliente: 'B2B',
      email: '',
      telefono: '',
      direccion: '',
    });
    setErroresForm({});
    setErrorGeneral(null);
  }, []);

  const registrarCliente = useCallback(
    async (onSuccess?: (nuevo: ClienteDto) => void): Promise<boolean> => {
      setErrorGeneral(null);
      setErroresForm({});

      // Validación con Zod Contract
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
        const nuevo = await vendedorB2bService.crearCliente(resultado.data);
        setClientes((prev) => [nuevo, ...prev]);
        resetForm();
        setIsModalOpen(false);
        if (onSuccess) onSuccess(nuevo);
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
    buscar,
    setCampo,
    resetForm,
    registrarCliente,
    recargarClientes: cargarClientes,
  };
}
