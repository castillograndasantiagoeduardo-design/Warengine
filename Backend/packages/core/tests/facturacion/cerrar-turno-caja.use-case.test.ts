import { assertEquals } from '@std/assert';
import {
    ACCIONES_AUDITORIA,
    ActorAuditoria,
    CerrarTurnoCajaUseCase,
    ENTIDADES_AUDITORIA,
    IAuditor,
    ITurnoCajaRepository,
    TurnoCaja,
} from '../../mod.ts';

class FakeAuditor implements IAuditor {
    public eventos: any[] = [];
    public registrar(evento: any): Promise<void> {
        this.eventos.push(evento);
        return Promise.resolve();
    }
}

const actor: ActorAuditoria = {
    usuarioId: 'usr-cajero-1',
    ip: '127.0.0.1',
    permisos: ['facturacion:abrir-turno'],
};

function makeTurno(
    id = 'turno-1',
    usuarioId = 'usr-cajero-1',
    fondoInicial = 50000,
    fechaCierre: Date | null = null,
): TurnoCaja {
    return new TurnoCaja(
        id,
        usuarioId,
        1,
        fondoInicial,
        new Date(),
        fechaCierre,
        null,
        null,
    );
}

function armar(turnoActual: TurnoCaja | null) {
    let turnoGuardado = turnoActual;
    const auditor = new FakeAuditor();
    const repo: ITurnoCajaRepository = {
        buscarAbiertoDeUsuario: () => Promise.resolve(null),
        abrir: () => Promise.resolve(makeTurno()),
        findById: (id: string) => Promise.resolve(turnoGuardado?.id === id ? turnoGuardado : null),
        cerrar: (id: string, fondoFinal: number) => {
            if (!turnoGuardado || turnoGuardado.id !== id) {
                return Promise.resolve(makeTurno());
            }
            turnoGuardado = new TurnoCaja(
                turnoGuardado.id,
                turnoGuardado.usuarioId,
                turnoGuardado.sucursalId,
                turnoGuardado.fondoInicial,
                turnoGuardado.fechaApertura,
                new Date(),
                fondoFinal,
                fondoFinal - turnoGuardado.fondoInicial,
            );
            return Promise.resolve(turnoGuardado);
        },
    };
    const useCase = new CerrarTurnoCajaUseCase(repo, auditor);
    return { useCase, auditor, repo, getTurno: () => turnoGuardado };
}

Deno.test('CerrarTurno: cierra turno con cálculo de diferencia y audita', async () => {
    const { useCase, auditor, getTurno } = armar(makeTurno('turno-1', 'usr-cajero-1', 50000));

    const result = await useCase.execute({
        turnoId: 'turno-1',
        fondoFinal: 55000,
        actor,
    });

    assertEquals(result.isSuccess, true);
    assertEquals(result.value.estaCerrado, true);
    assertEquals(result.value.fondoFinal, 55000);
    assertEquals(result.value.diferencia, 5000); // 55000 - 50000
    assertEquals(auditor.eventos.length, 1);
    assertEquals(auditor.eventos[0].accion, ACCIONES_AUDITORIA.EDITAR);
    assertEquals(auditor.eventos[0].entidad, ENTIDADES_AUDITORIA.TURNOS_CAJA);
    assertEquals(getTurno()?.estaCerrado, true);
});

Deno.test('CerrarTurno: rechaza si el turno no existe', async () => {
    const { useCase, auditor } = armar(null);

    const result = await useCase.execute({
        turnoId: 'inexistente',
        fondoFinal: 50000,
        actor,
    });

    assertEquals(result.isFailure, true);
    assertEquals(result.error.code, 'TURNO_NO_ENCONTRADO');
    assertEquals(auditor.eventos.length, 0);
});

Deno.test('CerrarTurno: rechaza si el turno ya fue cerrado', async () => {
    const yaCerrado = makeTurno('turno-1', 'usr-cajero-1', 50000, new Date());
    const { useCase, auditor } = armar(yaCerrado);

    const result = await useCase.execute({
        turnoId: 'turno-1',
        fondoFinal: 50000,
        actor,
    });

    assertEquals(result.isFailure, true);
    assertEquals(result.error.code, 'TURNO_YA_CERRADO');
    assertEquals(auditor.eventos.length, 0);
});

Deno.test('CerrarTurno: rechaza si el operador no es el dueño del turno', async () => {
    const turnoDeOtro = makeTurno('turno-1', 'usr-otro-cajero', 50000);
    const { useCase, auditor } = armar(turnoDeOtro);

    const result = await useCase.execute({
        turnoId: 'turno-1',
        fondoFinal: 50000,
        actor, // usr-cajero-1
    });

    assertEquals(result.isFailure, true);
    assertEquals(result.error.code, 'PERMISO_DENEGADO');
    assertEquals(auditor.eventos.length, 0);
});

Deno.test('CerrarTurno: rechaza fondo final negativo', async () => {
    const { useCase, auditor } = armar(makeTurno('turno-1', 'usr-cajero-1', 50000));

    const result = await useCase.execute({
        turnoId: 'turno-1',
        fondoFinal: -100,
        actor,
    });

    assertEquals(result.isFailure, true);
    assertEquals(result.error.code, 'FONDO_FINAL_INVALIDO');
    assertEquals(auditor.eventos.length, 0);
});
