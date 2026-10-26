import { assertEquals } from 'jsr:@std/assert@^1';
import {
    EmitirAlertaFacturacionUseCase,
    AlertaAdmin,
    ACCIONES_AUDITORIA,
    ActorAuditoria,
    ENTIDADES_AUDITORIA,
    EventoAuditoria,
    IAuditor,
    ISucursalOperadorRepository,
    IAlertaAdminRepository,
    CrearAlertaAdminData,
    FiltrosAlertasAdmin,
    EstadoAlerta,
    OperadorSinSucursalError,
} from '../../mod.ts';
import { emitirAlertaFacturacionSchema } from '@warengine/contracts';

const actor: ActorAuditoria = { usuarioId: 'usr-cajero-1', ip: '192.168.1.100' };

class FakeAuditor implements IAuditor {
    public eventos: EventoAuditoria[] = [];
    public registrar(evento: EventoAuditoria): Promise<void> {
        this.eventos.push(evento);
        return Promise.resolve();
    }
}

function crearAlertaRepoFalso(): IAlertaAdminRepository & { items: AlertaAdmin[] } {
    const items: AlertaAdmin[] = [];
    return {
        items,
        listar: (_filtros?: FiltrosAlertasAdmin) => Promise.resolve([...items]),
        findById: (id: string) => Promise.resolve(items.find((a) => a.id === id) ?? null),
        crear: (data: CrearAlertaAdminData) => {
            const alerta = new AlertaAdmin(
                `alt-${items.length + 1}`,
                data.usuarioId,
                data.sucursalId,
                data.motivo,
                data.prioridad ?? 'normal',
                data.descripcion ?? null,
                'pendiente',
                new Date(),
                null,
            );
            items.push(alerta);
            return Promise.resolve(alerta);
        },
        actualizarEstado: (_id: string, _estado: EstadoAlerta, _fechaAtencion?: Date | null) =>
            Promise.resolve(items[0]),
    };
}

Deno.test('EmitirAlertaFacturacionUseCase: crea alerta con sucursal del cajero y audita', async () => {
    const repoAlertas = crearAlertaRepoFalso();
    const repoSucursal: ISucursalOperadorRepository = {
        obtenerSucursalId: () => Promise.resolve(10),
    };
    const auditor = new FakeAuditor();
    const useCase = new EmitirAlertaFacturacionUseCase(repoAlertas, repoSucursal, auditor);

    const res = await useCase.execute({
        actor,
        motivo: 'Solicitud de Autorización Especial',
        descripcion: 'Requiere clave para descuento',
        prioridad: 'urgente',
    });

    assertEquals(res.isSuccess, true);
    if (!res.isSuccess) return;

    assertEquals(res.value.motivo, 'Solicitud de Autorización Especial');
    assertEquals(res.value.sucursalId, 10);
    assertEquals(res.value.prioridad, 'urgente');
    assertEquals(res.value.descripcion, 'Requiere clave para descuento');
    assertEquals(repoAlertas.items.length, 1);

    assertEquals(auditor.eventos.length, 1);
    assertEquals(auditor.eventos[0].accion, ACCIONES_AUDITORIA.CREAR);
    assertEquals(auditor.eventos[0].entidad, ENTIDADES_AUDITORIA.ALERTAS_ADMIN);
});

Deno.test('EmitirAlertaFacturacionUseCase: usa request.sucursalId como fallback si no tiene sucursal en BD', async () => {
    const repoAlertas = crearAlertaRepoFalso();
    const repoSucursal: ISucursalOperadorRepository = {
        obtenerSucursalId: () => Promise.resolve(null),
    };
    const auditor = new FakeAuditor();
    const useCase = new EmitirAlertaFacturacionUseCase(repoAlertas, repoSucursal, auditor);

    const res = await useCase.execute({
        actor,
        sucursalId: 5,
        motivo: 'Falta de Cambio en Gaveta (Monedas / Billetes)',
        prioridad: 'normal',
    });

    assertEquals(res.isSuccess, true);
    if (!res.isSuccess) return;
    assertEquals(res.value.sucursalId, 5);
});

Deno.test('EmitirAlertaFacturacionUseCase: falla si el operador no tiene sucursal ni en BD ni en request', async () => {
    const repoAlertas = crearAlertaRepoFalso();
    const repoSucursal: ISucursalOperadorRepository = {
        obtenerSucursalId: () => Promise.resolve(null),
    };
    const auditor = new FakeAuditor();
    const useCase = new EmitirAlertaFacturacionUseCase(repoAlertas, repoSucursal, auditor);

    const res = await useCase.execute({
        actor,
        motivo: 'Falla Técnica',
    });

    assertEquals(res.isFailure, true);
    assertEquals(res.error instanceof OperadorSinSucursalError, true);
});

Deno.test('Contrato Zod emitirAlertaFacturacionSchema: parsea motivo y descripcion directos', () => {
    const parsed = emitirAlertaFacturacionSchema.safeParse({
        motivo: 'Solicitud de Autorización Especial',
        descripcion: 'Detalle de la alerta',
        prioridad: 'urgente',
        sucursalId: 1,
    });

    assertEquals(parsed.success, true);
    if (!parsed.success) return;
    assertEquals(parsed.data.motivo, 'Solicitud de Autorización Especial');
    assertEquals(parsed.data.descripcion, 'Detalle de la alerta');
    assertEquals(parsed.data.prioridad, 'urgente');
    assertEquals(parsed.data.sucursalId, 1);
});

Deno.test('Contrato Zod emitirAlertaFacturacionSchema: traduce retrocompatiblemente tipo y mensaje', () => {
    const parsed = emitirAlertaFacturacionSchema.safeParse({
        tipo: 'caja_autorizacion',
        mensaje: 'Se necesita autorización en caja 2',
        prioridad: 'urgente',
    });

    assertEquals(parsed.success, true);
    if (!parsed.success) return;
    assertEquals(parsed.data.motivo, 'Solicitud de Autorización Especial');
    assertEquals(parsed.data.descripcion, 'Se necesita autorización en caja 2');
    assertEquals(parsed.data.prioridad, 'urgente');
});

Deno.test('Contrato Zod emitirAlertaFacturacionSchema: rechaza si motivo y tipo están vacíos', () => {
    const parsed = emitirAlertaFacturacionSchema.safeParse({
        prioridad: 'normal',
        mensaje: 'Sin motivo',
    });

    assertEquals(parsed.success, false);
});
