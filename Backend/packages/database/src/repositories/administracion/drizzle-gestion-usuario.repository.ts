import { and, count, eq, exists, or, type SQL } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { empleados, sucursales } from '../../schema/administracion.schema.ts';
import { refresh_tokens, roles, usuario_sucursales, usuarios } from '../../schema/autenticacion.schema.ts';
import {
  FiltrosUsuarios,
  IGestionUsuarioRepository,
  NuevoUsuarioData,
  UsuarioGestionado,
} from '@warengine/core';
import { usuarioGestionadoFromRow } from '../../mappers/administracion/usuario-gestionado.mapper.ts';

const SELECCION = {
  id: usuarios.id_usuario,
  nombre: empleados.nombre,
  email: usuarios.email,
  rolId: usuarios.rol_id,
  rolNombre: roles.nombre,
  sucursalId: empleados.sucursal_id,
  sucursalNombre: sucursales.nombre,
  isActive: usuarios.is_active,
};

export class DrizzleGestionUsuarioRepository implements IGestionUsuarioRepository {
  constructor(private readonly db: Database) {}

  private consulta() {
    return this.db
      .select(SELECCION)
      .from(usuarios)
      .innerJoin(empleados, eq(usuarios.empleado_id, empleados.id_empleado))
      .innerJoin(roles, eq(usuarios.rol_id, roles.id_rol))
      .innerJoin(sucursales, eq(empleados.sucursal_id, sucursales.id_sucursal));
  }

  public async listar(filtros: FiltrosUsuarios): Promise<UsuarioGestionado[]> {
    const condiciones: SQL[] = [];
    if (filtros.rolId) condiciones.push(eq(usuarios.rol_id, filtros.rolId));
    if (filtros.sucursalId) {
      // Pertenece a la sucursal si es su principal O si la tiene entre las adicionales (RF-ADM-C10).
      const enAdicionales = exists(
        this.db
          .select({ uno: usuario_sucursales.sucursal_id })
          .from(usuario_sucursales)
          .where(and(
            eq(usuario_sucursales.usuario_id, usuarios.id_usuario),
            eq(usuario_sucursales.sucursal_id, filtros.sucursalId),
          )),
      );
      const pertenece = or(eq(empleados.sucursal_id, filtros.sucursalId), enAdicionales);
      if (pertenece) condiciones.push(pertenece);
    }

    const rows = await this.consulta()
      .where(condiciones.length > 0 ? and(...condiciones) : undefined)
      .orderBy(empleados.nombre);
    return rows.map(usuarioGestionadoFromRow);
  }

  public async findById(id: string): Promise<UsuarioGestionado | null> {
    const [row] = await this.consulta().where(eq(usuarios.id_usuario, id)).limit(1);
    return row ? usuarioGestionadoFromRow(row) : null;
  }

  public async existeEmail(email: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: usuarios.id_usuario })
      .from(usuarios)
      .where(eq(usuarios.email, email))
      .limit(1);
    return rows.length > 0;
  }

  public async existeDocumento(tipo: string, numero: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: empleados.id_empleado })
      .from(empleados)
      .where(and(eq(empleados.tipo_documento, tipo), eq(empleados.numero_documento, numero)))
      .limit(1);
    return rows.length > 0;
  }

  public async rolExiste(rolId: number): Promise<boolean> {
    const rows = await this.db
      .select({ id: roles.id_rol })
      .from(roles)
      .where(eq(roles.id_rol, rolId))
      .limit(1);
    return rows.length > 0;
  }

  public async contarSuperAdminsActivos(): Promise<number> {
    const [fila] = await this.db
      .select({ total: count() })
      .from(usuarios)
      .innerJoin(roles, eq(usuarios.rol_id, roles.id_rol))
      .where(and(eq(roles.nombre, 'super-admin'), eq(usuarios.is_active, 1)));
    return Number(fila?.total ?? 0);
  }

  public async crear(data: NuevoUsuarioData): Promise<UsuarioGestionado> {
    const idEmpleado = crypto.randomUUID();
    const idUsuario = crypto.randomUUID();

    await this.db.transaction(async (tx) => {
      await tx.insert(empleados).values({
        id_empleado: idEmpleado,
        tipo_documento: data.tipoDocumento,
        numero_documento: data.numeroDocumento,
        nombre: data.nombre,
        cargo: data.cargo,
        sucursal_id: data.sucursalId,
      });
      await tx.insert(usuarios).values({
        id_usuario: idUsuario,
        empleado_id: idEmpleado,
        email: data.email,
        password_hash: data.passwordHash,
        rol_id: data.rolId,
      });
    });

    return (await this.findById(idUsuario)) as UsuarioGestionado;
  }

  public async actualizarRol(id: string, rolId: number, invalidarTokensEn: Date): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .update(usuarios)
        .set({ rol_id: rolId, tokens_invalidados_en: invalidarTokensEn })
        .where(eq(usuarios.id_usuario, id));
      await tx.update(refresh_tokens).set({ revocado: 1 }).where(eq(refresh_tokens.usuario_id, id));
    });
  }

  public async actualizarEstado(
    id: string,
    isActive: boolean,
    invalidarTokensEn: Date,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .update(usuarios)
        .set({ is_active: isActive ? 1 : 0, tokens_invalidados_en: invalidarTokensEn })
        .where(eq(usuarios.id_usuario, id));
      await tx.update(refresh_tokens).set({ revocado: 1 }).where(eq(refresh_tokens.usuario_id, id));
    });
  }

  
  public async actualizarPassword(
    id: string,
    passwordHash: string,
    invalidarTokensEn: Date,
  ): Promise<void> {
    // El trigger de invalidación solo reacciona a cambios de rol o estado, no de contraseña:
    // por eso aquí se marca tokens_invalidados_en y se revocan los refresh tokens a mano.
    await this.db.transaction(async (tx) => {
      await tx
        .update(usuarios)
        .set({ password_hash: passwordHash, tokens_invalidados_en: invalidarTokensEn })
        .where(eq(usuarios.id_usuario, id));
      await tx.update(refresh_tokens).set({ revocado: 1 }).where(eq(refresh_tokens.usuario_id, id));
    });
  }
}