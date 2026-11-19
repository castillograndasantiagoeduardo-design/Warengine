import { assertEquals } from 'jsr:@std/assert';
import {
    ACCIONES_AUDITORIA,
    ActorAuditoria,
    AlcanceSucursal,
    CerrarTurnoAdministrativoUseCase,
    ENTIDADES_AUDITORIA,
    IAuditor,
    ITurnoCajaRepository,
    ResolverAlcanceSucursalUseCase,
    TurnoCaja,
} from '../../mod.ts';

class FakeAuditor implements IAuditor {
    public eventos: any[] = [];
    public registrar(evento: any): Promise<void> {
        this.eventos.push(evento);
        return Promise.resolve();
    }
}

class FakeResolverAlcanceSucursal {
    constructor(private readonly sedesPermitidas: number[] = [1]) { }
    public execute(_req: { usuarioId: string }): Promise<any> {
        return Promise.resolve({
            isFailure: false,
            value: AlcanceSucursal.limitado(this.sedesPermitidas),
        });
    }
}

const adminActor: ActorAuditoria = {
    usuarioId: 'usr-admin-1',
    ip: '127.0.0.1',
    permisos: ['caja:cierre-administrativo'],
};

function makeTurno(
    id = 'turno-1',
    usuarioId = 'usr-cajero-1',
    sucursalId = 1,
    fondoInicial = 50000,
    fechaCierre: Date | null = null,
): TurnoCaja {
    return new TurnoCaja(
        id,
        usuarioId,
        sucursalId,
        fondoInicial,
        new Date(),
        fechaCierre,
        null,
        null,
        'normal',
    );
}

function armar(
    turnoActual: TurnoCaja | null,
    sedesPermitidas = [1],
) {
    let turnoGuardado = turnoActual;
    const auditor = new FakeAuditor();
    const resolver = new FakeResolverAlcanceSucursal(sedesPermitidas) as unknown as ResolverAlcanceSucursalUseCase;

    const repo: ITurnoCajaRepository = {
        buscarAbiertoDeUsuario: () => Promise.resolve(null),
        abrir: () => Promise.resolve(makeTurno()),
        findById: (id: string) => Promise.resolve(turnoGuardado?.id === id ? turnoGuardado : null),
        cerrar: () => Promise.resolve(makeTurno()),
        cerrarAdministrativo: (datos) => {
            if (!turnoGuardado || turnoGuardado.id !== datos.turnoId) {
                return Promise.resolve(makeTurno());
            }
            const diferencia = datos.fondoFinal !== undefined ? datos.fondoFinal - turnoGuardado.fondoInicial : null;
            turnoGuardado = new TurnoCaja(
                turnoGuardado.id,
                turnoGuardado.usuarioId,
                turnoGuardado.sucursalId,
                turnoGuardado.fondoInicial,
                turnoGuardado.fechaApertura,
                new Date(),
                datos.fondoFinal ?? null,
                diferencia,
                'administrativo',
                datos.cerradoPor,
                datos.motivo,
            );
            return Promise.resolve(turnoGuardado);
        },
    };

    const useCase = new CerrarTurnoAdministrativoUseCase(repo, resolver, auditor);
    return { useCase, auditor, repo, getTurno: () => turnoGuardado };
}

Deno.test('CerrarTurnoAdministrativo: caso feliz con fondo contado y cálculo de diferencia', async () => {
    const { useCase, auditor, getTurno } = armar(makeTurno('turno-1', 'usr-cajero-1', 1, 50000));

    const result = await useCase.execute({
        turnoId: 'turno-1',
        motivo: 'Cajero abandonó el puesto sin realizar cierre normal',
        fondoFinal: 55000,
        actor: adminActor,
    });

    assertEquals(result.isSuccess, true);
    assertEquals(result.value.estaCerrado, true);
    assertEquals(result.value.tipoCierre, 'administrativo');
    assertEquals(result.value.cerradoPor, 'usr-admin-1');
    assertEquals(result.value.motivoCierre, 'Cajero abandonó el puesto sin realizar cierre normal');
    assertEquals(result.value.fondoFinal, 55000);
    assertEquals(result.value.diferencia, 5000);
    assertEquals(auditor.eventos.length, 1);
    assertEquals(auditor.eventos[0].accion, ACCIONES_AUDITORIA.EDITAR);
    assertEquals(auditor.eventos[0].entidad, ENTIDADES_AUDITORIA.TURNOS_CAJA);
    assertEquals(auditor.eventos[0].detalles.tipoCierre, 'administrativo');
});

Deno.test('CerrarTurnoAdministrativo: caso feliz sin fondo contado (arqueo diferido)', async () => {
    const { useCase, auditor } = armar(makeTurno('turno-2', 'usr-cajero-2', 1, 30000));

    const result = await useCase.execute({
        turnoId: 'turno-2',
        motivo: 'Cierre de emergencia por corte de energía',
        actor: adminActor,
    });

    assertEquals(result.isSuccess, true);
    assertEquals(result.value.estaCerrado, true);
    assertEquals(result.value.tipoCierre, 'administrativo');
    assertEquals(result.value.fondoFinal, null);
    assertEquals(result.value.diferencia, null);
    assertEquals(auditor.eventos.length, 1);
});

Deno.test('CerrarTurnoAdministrativo: rechaza si el motivo está ausente o es menor a 5 caracteres', async () => {
    const { useCase } = armar(makeTurno('turno-1'));

    const result1 = await useCase.execute({
        turnoId: 'turno-1',
        motivo: '',
        actor: adminActor,
    });
    assertEquals(result1.isFailure, true);
    assertEquals(result1.error.code, 'MOTIVO_CIERRE_INVALIDO');

    const result2 = await useCase.execute({
        turnoId: 'turno-1',
        motivo: 'fail',
        actor: adminActor,
    });
    assertEquals(result2.isFailure, true);
    assertEquals(result2.error.code, 'MOTIVO_CIERRE_INVALIDO');
});

Deno.test('CerrarTurnoAdministrativo: rechaza fondo final negativo', async () => {
    const { useCase } = armar(makeTurno('turno-1'));

    const result = await useCase.execute({
        turnoId: 'turno-1',
        motivo: 'Motivo válido de prueba',
        fondoFinal: -100,
        actor: adminActor,
    });
    assertEquals(result.isFailure, true);
    assertEquals(result.error.code, 'FONDO_FINAL_INVALIDO');
});

Deno.test('CerrarTurnoAdministrativo: rechaza si el turno no existe', async () => {
    const { useCase } = armar(null);

    const result = await useCase.execute({
        turnoId: 'turno-inexistente',
        motivo: 'Motivo de prueba válido',
        actor: adminActor,
    });
    assertEquals(result.isFailure, true);
    assertEquals(result.error.code, 'TURNO_NO_ENCONTRADO');
});

Deno.test('CerrarTurnoAdministrativo: rechaza si el turno ya fue cerrado', async () => {
    const turnoYaCerrado = makeTurno('turno-1', 'usr-cajero-1', 1, 50000, new Date());
    const { useCase } = armar(turnoYaCerrado);

    const result = await useCase.execute({
        turnoId: 'turno-1',
        motivo: 'Motivo de prueba válido',
        actor: adminActor,
    });
    assertEquals(result.isFailure, true);
    assertEquals(result.error.code, 'TURNO_YA_CERRADO');
});

Deno.test('CerrarTurnoAdministrativo: rechaza si el turno pertenece a una sucursal fuera de alcance', async () => {
    // Turno pertenece a la sede 2, pero el admin solo tiene alcance a la sede 1
    const turnoOtraSede = makeTurno('turno-1', 'usr-cajero-1', 2, 50000);
    const { useCase } = armar(turnoOtraSede, [1]);

    const result = await useCase.execute({
        turnoId: 'turno-1',
        motivo: 'Motivo de prueba válido',
        actor: adminActor,
    });
    assertEquals(result.isFailure, true);
    assertEquals(result.error.code, 'SUCURSAL_FUERA_DE_ALCANCE');
});
