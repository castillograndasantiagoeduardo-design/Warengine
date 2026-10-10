import { assertEquals } from 'jsr:@std/assert@^1';
import {
    AbrirTurnoCajaUseCase,
    ACCIONES_AUDITORIA,
    ActorAuditoria,
    DatosAperturaTurno,
    ENTIDADES_AUDITORIA,
    EventoAuditoria,
    IAuditor,
    ISucursalOperadorRepository,
    ITurnoCajaRepository,
    TurnoCaja,
} from '../../mod.ts';

const actor: ActorAuditoria = { usuarioId: 'usr-cajero-1', ip: '192.168.1.100' };

class FakeAuditor implements IAuditor {
    public eventos: EventoAuditoria[] = [];
    public registrar(evento: EventoAuditoria): Promise<void> {
        this.eventos.push(evento);
        return Promise.resolve();
    }
}

function turno(): TurnoCaja {
    return new TurnoCaja('turno-1', actor.usuarioId, 1, 50000, new Date(), null);
}

function armar(opciones: {
    abierto?: TurnoCaja | null;
    sucursalId?: number | null;
    abrirDevuelve?: TurnoCaja | null;
}) {
    const aperturas: DatosAperturaTurno[] = [];
    const turnos: ITurnoCajaRepository = {
        buscarAbiertoDeUsuario: () => Promise.resolve(opciones.abierto ?? null),
        abrir: (datos) => {
            aperturas.push(datos);
            return Promise.resolve(opciones.abrirDevuelve === undefined ? turno() : opciones.abrirDevuelve);
        },
    };
    const sucursales: ISucursalOperadorRepository = {
        obtenerSucursalId: () =>
            Promise.resolve(opciones.sucursalId === undefined ? 1 : opciones.sucursalId),
    };
    const auditor = new FakeAuditor();
    return { useCase: new AbrirTurnoCajaUseCase(turnos, sucursales, auditor), auditor, aperturas };
}

Deno.test('abre el turno, redondea el fondo y audita', async () => {
    const { useCase, auditor, aperturas } = armar({});
    const r = await useCase.execute({ fondoInicial: 50000.456, actor });
    assertEquals(r.isSuccess, true);
    assertEquals(aperturas[0].fondoInicial, 50000.46);
    assertEquals(aperturas[0].sucursalId, 1);
    assertEquals(auditor.eventos[0].accion, ACCIONES_AUDITORIA.CREAR);
    assertEquals(auditor.eventos[0].entidad, ENTIDADES_AUDITORIA.TURNOS_CAJA);
});

Deno.test('rechaza un fondo negativo', async () => {
    const { useCase, aperturas } = armar({});
    const r = await useCase.execute({ fondoInicial: -1, actor });
    assertEquals(r.isFailure, true);
    assertEquals(r.error.code, 'FONDO_INICIAL_INVALIDO');
    assertEquals(aperturas.length, 0);
});

Deno.test('rechaza si el usuario ya tiene un turno abierto', async () => {
    const { useCase, aperturas } = armar({ abierto: turno() });
    const r = await useCase.execute({ fondoInicial: 1000, actor });
    assertEquals(r.error.code, 'TURNO_YA_ABIERTO');
    assertEquals(aperturas.length, 0);
});

Deno.test('rechaza si la BD detecta otro turno abierto (carrera)', async () => {
    const { useCase, auditor } = armar({ abrirDevuelve: null });
    const r = await useCase.execute({ fondoInicial: 1000, actor });
    assertEquals(r.error.code, 'TURNO_YA_ABIERTO');
    assertEquals(auditor.eventos.length, 0);
});

Deno.test('rechaza si no se encuentra la sucursal del operador', async () => {
    const { useCase } = armar({ sucursalId: null });
    const r = await useCase.execute({ fondoInicial: 1000, actor });
    assertEquals(r.error.code, 'OPERADOR_SIN_SUCURSAL');
});