import { assertEquals, assertThrows } from 'jsr:@std/assert@^1';
import { parseEnteroPositivo } from '../src/env-parsers.ts';

Deno.test('parseEnteroPositivo: retorna el valor por defecto si es undefined o vacío', () => {
  assertEquals(parseEnteroPositivo(undefined, 'TEST_VAR', 5), 5);
  assertEquals(parseEnteroPositivo('', 'TEST_VAR', 10), 10);
  assertEquals(parseEnteroPositivo('   ', 'TEST_VAR', 20), 20);
});

Deno.test('parseEnteroPositivo: parsea enteros positivos correctamente', () => {
  assertEquals(parseEnteroPositivo('5', 'TEST_VAR', 1), 5);
  assertEquals(parseEnteroPositivo('100', 'TEST_VAR', 1), 100);
});

Deno.test('parseEnteroPositivo: rechaza valores negativos o cero', () => {
  assertThrows(
    () => parseEnteroPositivo('0', 'LOGIN_MAX_INTENTOS_CUENTA', 5),
    Error,
    'debe ser un entero positivo',
  );
  assertThrows(
    () => parseEnteroPositivo('-5', 'LOGIN_VENTANA_CUENTA_MIN', 5),
    Error,
    'debe ser un entero positivo',
  );
});

Deno.test('parseEnteroPositivo: rechaza valores no numéricos o decimales', () => {
  assertThrows(
    () => parseEnteroPositivo('abc', 'LOGIN_MAX_INTENTOS_IP', 20),
    Error,
    'debe ser un entero positivo',
  );
  assertThrows(
    () => parseEnteroPositivo('3.14', 'LOGIN_VENTANA_IP_MIN', 15),
    Error,
    'debe ser un entero positivo',
  );
});
