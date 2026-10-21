import { assertEquals } from 'jsr:@std/assert@^1';
import { GeminiAsistenteService } from '../../mod.ts';

Deno.test('GeminiAsistenteService: responde con mensaje informativo si GEMINI_API_KEY no está configurada', async () => {
  const mockToolLister = () =>
    Promise.resolve([
      { name: 'consulta-stock', description: 'Consulta existencias' },
      { name: 'stock-bajo', description: 'Alertas de stock bajo' },
    ]);

  // Instancia sin API Key para validar modo de contingencia/informativo
  const service = new GeminiAsistenteService({ apiKey: '' }, mockToolLister);

  const res = await service.procesarMensaje({
    mensaje: 'Hola asistente',
    tokenJwt: 'mock-token',
    usuarioId: 'user-uuid-1',
  });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.respuesta.includes('Asistente IA de Warengine'), true);
  assertEquals(res.value.respuesta.includes('consulta-stock'), true);
  assertEquals(res.value.toolsEjecutadas.length, 0);
});

Deno.test('GeminiAsistenteService: lista las tools autorizadas desde el listador provisto', async () => {
  let listadorInvocado = false;
  const mockToolLister = (_token: string) => {
    listadorInvocado = true;
    return Promise.resolve([
      { name: 'ventas-periodo', description: 'Balance de ventas' },
    ]);
  };

  const service = new GeminiAsistenteService({ apiKey: '' }, mockToolLister);

  const res = await service.procesarMensaje({
    mensaje: 'Muéstrame las ventas',
    tokenJwt: 'mock-token',
    usuarioId: 'user-uuid-1',
  });

  assertEquals(res.isSuccess, true);
  assertEquals(listadorInvocado, true);
  assertEquals(res.value.respuesta.includes('ventas-periodo'), true);
});
