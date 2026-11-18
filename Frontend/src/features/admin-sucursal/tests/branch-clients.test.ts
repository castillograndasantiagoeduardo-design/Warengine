import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  esClienteGenerico,
  obtenerNivelCredito,
} from '../types/branch-clients.types.ts';
import {
  crearClienteSchema,
  actualizarClienteSchema,
} from '../../../../../Shared/contracts/src/facturacion/cliente.schema.ts';

describe('branch-clients — Funciones puras y reglas de clientes', () => {
  describe('esClienteGenerico', () => {
    it('identifica como genérico si el documento es 222222222222', () => {
      assert.equal(
        esClienteGenerico({ numeroDocumento: '222222222222', nombreRazonSocial: 'Cliente Ocasional' }),
        true,
      );
    });

    it('identifica como genérico si el nombre es "Consumidor Final" sin importar mayúsculas', () => {
      assert.equal(
        esClienteGenerico({ numeroDocumento: '12345678', nombreRazonSocial: 'consumidor final' }),
        true,
      );
      assert.equal(
        esClienteGenerico({ numeroDocumento: '12345678', nombreRazonSocial: '  Consumidor Final  ' }),
        true,
      );
    });

    it('retorna false para un cliente real', () => {
      assert.equal(
        esClienteGenerico({ numeroDocumento: '900123456-1', nombreRazonSocial: 'Empresa SAS' }),
        false,
      );
      assert.equal(
        esClienteGenerico({ numeroDocumento: '1012345678', nombreRazonSocial: 'Juan Pérez' }),
        false,
      );
    });
  });

  describe('obtenerNivelCredito', () => {
    it('retorna gris si no tiene crédito corporativo habilitado', () => {
      const res = obtenerNivelCredito(false, 0);
      assert.equal(res.color, 'gris');
      assert.equal(res.etiqueta, 'Sin crédito');
    });

    it('retorna verde si tiene crédito y saldo <= 0', () => {
      const res = obtenerNivelCredito(true, 0);
      assert.equal(res.color, 'verde');
      assert.equal(res.etiqueta, 'Al día');
    });

    it('retorna ámbar si tiene saldo moderado', () => {
      const res = obtenerNivelCredito(true, 1500000);
      assert.equal(res.color, 'ambar');
      assert.equal(res.etiqueta, 'Con saldo');
    });

    it('retorna rojo si el saldo es alto (> 5M)', () => {
      const res = obtenerNivelCredito(true, 6000000);
      assert.equal(res.color, 'rojo');
      assert.equal(res.etiqueta, 'Saldo alto');
    });
  });

  describe('validaciones de contrato crearClienteSchema', () => {
    it('acepta un cliente B2C sin teléfono ni dirección', () => {
      const input = {
        tipoDocumento: 'CC',
        numeroDocumento: '1012345678',
        nombreRazonSocial: 'Carlos Andrés Gómez',
        tipoCliente: 'B2C',
      };
      const result = crearClienteSchema.safeParse(input);
      assert.equal(result.success, true);
    });

    it('rechaza un cliente B2B si falta teléfono o dirección', () => {
      const inputSinDireccion = {
        tipoDocumento: 'NIT',
        numeroDocumento: '900987654-1',
        nombreRazonSocial: 'Tecnología Andina SAS',
        tipoCliente: 'B2B',
        telefono: '3109876543',
      };
      const resSinDir = crearClienteSchema.safeParse(inputSinDireccion);
      assert.equal(resSinDir.success, false);
      if (!resSinDir.success) {
        assert.ok(resSinDir.error.issues.some((i) => i.path.includes('direccion')));
      }

      const inputSinTel = {
        tipoDocumento: 'NIT',
        numeroDocumento: '900987654-1',
        nombreRazonSocial: 'Tecnología Andina SAS',
        tipoCliente: 'B2B',
        direccion: 'Av El Dorado # 68C-61',
      };
      const resSinTel = crearClienteSchema.safeParse(inputSinTel);
      assert.equal(resSinTel.success, false);
      if (!resSinTel.success) {
        assert.ok(resSinTel.error.issues.some((i) => i.path.includes('telefono')));
      }
    });

    it('acepta un cliente B2B completo', () => {
      const input = {
        tipoDocumento: 'NIT',
        numeroDocumento: '900987654-1',
        nombreRazonSocial: 'Tecnología Andina SAS',
        tipoCliente: 'B2B',
        telefono: '3109876543',
        direccion: 'Av El Dorado # 68C-61',
        email: 'contacto@tecnologia.com',
      };
      const result = crearClienteSchema.safeParse(input);
      assert.equal(result.success, true);
    });

    it('rechaza documentos demasiado cortos o con caracteres no permitidos', () => {
      const inputCorto = {
        tipoDocumento: 'CC',
        numeroDocumento: '123',
        nombreRazonSocial: 'Ana María',
        tipoCliente: 'B2C',
      };
      assert.equal(crearClienteSchema.safeParse(inputCorto).success, false);
    });
  });

  describe('validaciones de contrato actualizarClienteSchema', () => {
    it('permite actualizar solo creditoHabilitado', () => {
      const result = actualizarClienteSchema.safeParse({ creditoHabilitado: true });
      assert.equal(result.success, true);
    });

    it('permite actualizar datos de contacto parciales', () => {
      const result = actualizarClienteSchema.safeParse({
        telefono: '3009998877',
        direccion: 'Carrera 7 # 72-11',
      });
      assert.equal(result.success, true);
    });
  });
});
