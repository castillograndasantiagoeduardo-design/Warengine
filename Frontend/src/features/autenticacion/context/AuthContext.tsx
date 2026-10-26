'use client';

/**
 * AuthContext.tsx — Contexto global de autenticación y sesión de WarEngine.
 *
 * Principios SOLID y Seguridad:
 * - Single Responsibility: Administra exclusivamente el estado de la sesión en memoria
 *   del cliente (usuario, permisos, 2FA y rate-limit).
 * - Seguridad OWASP: NUNCA almacena tokens JWT en localStorage/sessionStorage. Los tokens
 *   residen en cookies HttpOnly; en React solo existe la identidad del usuario y permisos.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { authService, IAuthService } from '../api';
import type {
  UsuarioSesion,
  LoginInput,
  LoginResult,
  RateLimitState,
} from '../types/auth.types';
import { ApiError } from '@/lib/api';

export interface Paso2FAState {
  tempToken: string;
  message: string;
  recordarme: boolean;
}

export interface AuthContextValue {
  usuario: UsuarioSesion | null;
  permisos: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  paso2FA: Paso2FAState | null;
  rateLimit: RateLimitState;
  login: (input: LoginInput) => Promise<LoginResult>;
  completar2FA: (codigoTotp: string) => Promise<void>;
  cancelar2FA: () => void;
  logout: () => Promise<void>;
  tienePermiso: (permiso: string) => boolean;
  tieneRol: (rol: string) => boolean;
  limpiarRateLimit: () => void;
  establecerRateLimit: (segundos: number, mensaje?: string) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export interface AuthProviderProps {
  children: React.ReactNode;
  service?: IAuthService;
}

export function AuthProvider({
  children,
  service = authService,
}: AuthProviderProps) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [permisos, setPermisos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [paso2FA, setPaso2FA] = useState<Paso2FAState | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitState>({
    bloqueado: false,
    mensaje: undefined,
    tiempoRestanteSegundos: 0,
  });

  // Rehidratación inicial de la sesión consultando la cookie HttpOnly al montar
  useEffect(() => {
    let montado = true;

    async function hidratarSesion() {
      try {
        const sesion = await service.verificarSesion();
        if (montado && sesion) {
          setUsuario(sesion.usuario);
          setPermisos(sesion.permisos);
        }
      } catch {
        if (montado) {
          setUsuario(null);
          setPermisos([]);
        }
      } finally {
        if (montado) {
          setIsLoading(false);
        }
      }
    }

    hidratarSesion();

    return () => {
      montado = false;
    };
  }, [service]);

  // Manejo del temporizador regresivo de Rate Limit / Bloqueo por Fuerza Bruta (429)
  useEffect(() => {
    if (!rateLimit.bloqueado || !rateLimit.tiempoRestanteSegundos) return;

    const timer = setInterval(() => {
      setRateLimit((prev) => {
        const restantes = (prev.tiempoRestanteSegundos ?? 1) - 1;
        if (restantes <= 0) {
          return { bloqueado: false, mensaje: undefined, tiempoRestanteSegundos: 0 };
        }
        return { ...prev, tiempoRestanteSegundos: restantes };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [rateLimit.bloqueado, rateLimit.tiempoRestanteSegundos]);

  const establecerRateLimit = useCallback((segundos: number, mensaje?: string) => {
    setRateLimit({
      bloqueado: true,
      mensaje:
        mensaje ||
        'Demasiados intentos fallidos. Por tu seguridad, el acceso ha sido pausado temporalmente.',
      tiempoRestanteSegundos: segundos,
    });
  }, []);

  const limpiarRateLimit = useCallback(() => {
    setRateLimit({
      bloqueado: false,
      mensaje: undefined,
      tiempoRestanteSegundos: 0,
    });
  }, []);

  const login = useCallback(
    async (credentials: LoginInput): Promise<LoginResult> => {
      try {
        const resultado = await service.login(credentials);

        if (resultado.tipo === 'EXITO') {
          setUsuario(resultado.data.usuario);
          setPermisos(resultado.data.permisos);
          setPaso2FA(null);
          limpiarRateLimit();
          return resultado;
        }

        // Caso REQUIERE_2FA (428)
        setPaso2FA({
          tempToken: resultado.tempToken,
          message: resultado.message,
          recordarme: Boolean(credentials.recordarme),
        });

        return resultado;
      } catch (error) {
        if (error instanceof ApiError && error.isLoginBloqueado()) {
          // 5 minutos de bloqueo según la política por defecto del backend
          establecerRateLimit(300, error.message);
        }
        throw error;
      }
    },
    [service, limpiarRateLimit, establecerRateLimit],
  );

  const completar2FA = useCallback(
    async (codigoTotp: string): Promise<void> => {
      if (!paso2FA) {
        throw new Error('No existe una verificación de dos factores pendiente.');
      }

      try {
        const respuesta = await service.verificar2FA({
          tempToken: paso2FA.tempToken,
          codigoTotp,
          recordarme: paso2FA.recordarme,
        });

        setUsuario(respuesta.usuario);
        setPermisos(respuesta.permisos);
        setPaso2FA(null);
        limpiarRateLimit();
      } catch (error) {
        if (error instanceof ApiError && error.isLoginBloqueado()) {
          establecerRateLimit(300, error.message);
        }
        throw error;
      }
    },
    [service, paso2FA, limpiarRateLimit, establecerRateLimit],
  );

  const cancelar2FA = useCallback(() => {
    setPaso2FA(null);
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await service.logout();
    } finally {
      setUsuario(null);
      setPermisos([]);
      setPaso2FA(null);
    }
  }, [service]);

  const tienePermiso = useCallback(
    (permiso: string): boolean => {
      if (!usuario) return false;
      // Autorización por permisos reales de la sesión para todos los roles (RF-SA-E4):
      // el super-admin recibe del backend la lista completa, no hay atajo por rol.
      return permisos.includes(permiso);
    },
    [usuario, permisos],
  );

  const tieneRol = useCallback(
    (rol: string): boolean => {
      if (!usuario) return false;
      return usuario.rolNombre.toLowerCase() === rol.toLowerCase();
    },
    [usuario],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      usuario,
      permisos,
      isAuthenticated: usuario !== null,
      isLoading,
      paso2FA,
      rateLimit,
      login,
      completar2FA,
      cancelar2FA,
      logout,
      tienePermiso,
      tieneRol,
      limpiarRateLimit,
      establecerRateLimit,
    }),
    [
      usuario,
      permisos,
      isLoading,
      paso2FA,
      rateLimit,
      login,
      completar2FA,
      cancelar2FA,
      logout,
      tienePermiso,
      tieneRol,
      limpiarRateLimit,
      establecerRateLimit,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext debe ser utilizado dentro de un <AuthProvider>');
  }
  return context;
}
