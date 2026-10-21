import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import { Result } from '@warengine/shared-kernel';
import {
  ConversarConAsistenteUseCase,
  type IAsistenteService,
  type PeticionAsistenteInput,
  type RespuestaAsistenteOutput,
  MensajeAsistenteVacioError,
} from '../../mod.ts';

class MockAsistenteService implements IAsistenteService {
  public llamadas: PeticionAsistenteInput[] = [];
  public respuestaSimulada: RespuestaAsistenteOutput = {
    respuesta: 'El stock disponible de laptops es de 15 unidades en la Sede Principal.',
    toolsEjecutadas: ['consulta-stock'],
  };

  public procesarMensaje(input: PeticionAsistenteInput) {
    this.llamadas.push(input);
    return Promise.resolve(Result.ok(this.respuestaSimulada));
  }
}

Deno.test('ConversarConAsistenteUseCase: rechaza mensajes vacíos o con solo espacios', async () => {
  const service = new MockAsistenteService();
  const useCase = new ConversarConAsistenteUseCase(service);

  const res = await useCase.execute({
    mensaje: '    ',
    tokenJwt: 'mock-jwt-token',
    usuarioId: 'user-uuid-1',
  });

  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'MENSAJE_ASISTENTE_VACIO');
  assertEquals(service.llamadas.length, 0);
});

Deno.test('ConversarConAsistenteUseCase: procesa mensaje válido y retorna respuesta del asistente', async () => {
  const service = new MockAsistenteService();
  const useCase = new ConversarConAsistenteUseCase(service);

  const res = await useCase.execute({
    mensaje: '¿Cuánto stock de laptops tenemos?',
    tokenJwt: 'mock-jwt-token',
    usuarioId: 'user-uuid-1',
    historial: [{ rol: 'user', texto: 'Hola' }],
  });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.respuesta.includes('15 unidades'), true);
  assertEquals(res.value.toolsEjecutadas, ['consulta-stock']);
  assertEquals(service.llamadas.length, 1);
  assertEquals(service.llamadas[0].mensaje, '¿Cuánto stock de laptops tenemos?');
});
