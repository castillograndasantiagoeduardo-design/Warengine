import { assertEquals } from 'jsr:@std/assert@^1';
import { Result } from '@warengine/shared-kernel';
import { Cliente } from '../../src/modules/facturacion/domain/entities/Cliente.ts';
import { CotizacionB2B } from '../../src/modules/facturacion/domain/entities/CotizacionB2B.ts';
import { Factura } from '../../src/modules/facturacion/domain/entities/Factura.ts';
import {
  DatosActualizarCliente,
  DatosCliente,
  DatosDecisionCreditoCliente,
  FiltrosClientes,
  IClienteRepository,
} from '../../src/modules/facturacion/domain/repositories/IClienteRepository.ts';
import {
  CrearCotizacionB2BDatos,
  FiltrosCotizacionesB2B,
  ICotizacionB2BRepository,
} from '../../src/modules/facturacion/domain/repositories/ICotizacionB2BRepository.ts';
import { RegistrarClienteUseCase } from '../../src/modules/facturacion/application/use-cases/RegistrarClienteUseCase.ts';
import { DecidirCreditoClienteB2BUseCase } from '../../src/modules/facturacion/application/use-cases/DecidirCreditoClienteB2BUseCase.ts';
import { CrearCotizacionB2BUseCase } from '../../src/modules/facturacion/application/use-cases/CrearCotizacionB2BUseCase.ts';
import { AvalarCotizacionB2BUseCase } from '../../src/modules/facturacion/application/use-cases/AvalarCotizacionB2BUseCase.ts';
import { FacturarCotizacionB2BUseCase } from '../../src/modules/facturacion/application/use-cases/FacturarCotizacionB2BUseCase.ts';
import { ActualizarEstadoPedidoB2BUseCase } from '../../src/modules/facturacion/application/use-cases/ActualizarEstadoPedidoB2BUseCase.ts';
import { CrearFacturaUseCase } from '../../src/modules/facturacion/application/use-cases/CrearFacturaUseCase.ts';
import {
  AlertaAdmin,
} from '../../src/modules/administracion/domain/entities/AlertaAdmin.ts';
import {
  CrearAlertaAdminData,
  IAlertaAdminRepository,
} from '../../src/modules/administracion/domain/repositories/IAlertaAdminRepository.ts';
import { AlcanceSucursal } from '../../src/modules/autenticacion/domain/value-objects/AlcanceSucursal.ts';
import type { ResolverAlcanceSucursalUseCase } from '../../src/modules/autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import type { CrearFacturaDatos, IFacturaRepository } from '../../src/modules/facturacion/domain/repositories/IFacturaRepository.ts';
import type { ITurnoCajaRepository } from '../../src/modules/facturacion/domain/repositories/ITurnoCajaRepository.ts';
import type { EventoAuditoria, IAuditor } from '../../src/modules/auditoria/domain/repositories/IAuditoriaRepository.ts';
import type { EstadoPedidoB2B } from '@warengine/contracts';

class MockAuditor implements IAuditor {
  public registros: EventoAuditoria[] = [];
  registrar(evento: EventoAuditoria): Promise<void> {
    this.registros.push(evento);
    return Promise.resolve();
  }
}

class MockAlertaRepo implements IAlertaAdminRepository {
  public alertas: CrearAlertaAdminData[] = [];
  listar() { return Promise.resolve([]); }
  findById() { return Promise.resolve(null); }
  crear(data: CrearAlertaAdminData): Promise<AlertaAdmin> {
    this.alertas.push(data);
    return Promise.resolve(
      new AlertaAdmin(
        'alerta-' + this.alertas.length,
        data.usuarioId,
        data.sucursalId,
        data.motivo,
        data.prioridad ?? 'normal',
        data.descripcion ?? null,
        'pendiente',
        new Date(),
        null,
        'Sede Principal',
        'vendedor@warengine.local',
        data.destinatarioRol ?? null,
      ),
    );
  }
  actualizarEstado() { return Promise.reject(new Error('no implementado')); }
}

class InMemoryClienteRepo implements IClienteRepository {
  public clientes: Cliente[] = [];
  buscar(_f: FiltrosClientes) { return Promise.resolve(this.clientes); }
  findByDocumento(tipo: string, numero: string) {
    return Promise.resolve(
      this.clientes.find((c) => c.tipoDocumento === tipo && c.numeroDocumento === numero) ?? null,
    );
  }
  findById(id: string) {
    return Promise.resolve(this.clientes.find((c) => c.id === id) ?? null);
  }
  crear(datos: DatosCliente): Promise<Cliente> {
    const cli = new Cliente(
      'cli-' + (this.clientes.length + 1),
      datos.tipoDocumento,
      datos.numeroDocumento,
      datos.nombreRazonSocial,
      datos.tipoCliente,
      datos.email,
      datos.telefono,
      datos.direccion,
      false,
      datos.gananciaNetaMensual ?? null,
      datos.antiguedadEmpresaMeses ?? null,
      datos.plazoCreditoDias ?? 30,
      datos.cupoCreditoSugerido ?? 0,
      0,
      0,
      datos.nivelRiesgoCredito ?? null,
      datos.estadoCredito ?? 'sin_solicitud',
      null,
      null,
      null,
      datos.observacionFinanciera ?? null,
    );
    this.clientes.push(cli);
    return Promise.resolve(cli);
  }
  actualizar(_id: string, _datos: DatosActualizarCliente) {
    return Promise.reject(new Error('no usado'));
  }
  decidirCredito(id: string, datos: DatosDecisionCreditoCliente): Promise<Cliente> {
    const idx = this.clientes.findIndex((c) => c.id === id);
    const prev = this.clientes[idx];
    const next = new Cliente(
      prev.id,
      prev.tipoDocumento,
      prev.numeroDocumento,
      prev.nombreRazonSocial,
      prev.tipoCliente,
      prev.email,
      prev.telefono,
      prev.direccion,
      datos.creditoHabilitado,
      prev.gananciaNetaMensual,
      prev.antiguedadEmpresaMeses,
      datos.plazoCreditoDias ?? prev.plazoCreditoDias,
      prev.cupoCreditoSugerido,
      datos.cupoCreditoAprobado,
      prev.cupoCreditoUtilizado,
      prev.nivelRiesgoCredito,
      datos.estadoCredito,
      datos.creditoAprobadoPor,
      datos.creditoAprobadoEn,
      datos.motivoDecisionCredito,
      prev.observacionFinanciera,
    );
    this.clientes[idx] = next;
    return Promise.resolve(next);
  }
  listarCreditosPendientes() {
    return Promise.resolve(this.clientes.filter((c) => c.estadoCredito === 'pendiente_aprobacion'));
  }
  registrarConsumoCredito(id: string, monto: number): Promise<void> {
    const idx = this.clientes.findIndex((c) => c.id === id);
    const prev = this.clientes[idx];
    this.clientes[idx] = new Cliente(
      prev.id,
      prev.tipoDocumento,
      prev.numeroDocumento,
      prev.nombreRazonSocial,
      prev.tipoCliente,
      prev.email,
      prev.telefono,
      prev.direccion,
      prev.creditoHabilitado,
      prev.gananciaNetaMensual,
      prev.antiguedadEmpresaMeses,
      prev.plazoCreditoDias,
      prev.cupoCreditoSugerido,
      prev.cupoCreditoAprobado,
      prev.cupoCreditoUtilizado + monto,
      prev.nivelRiesgoCredito,
      prev.estadoCredito,
      prev.creditoAprobadoPor,
      prev.creditoAprobadoEn,
      prev.motivoDecisionCredito,
      prev.observacionFinanciera,
    );
    return Promise.resolve();
  }
}

class InMemoryCotizacionRepo implements ICotizacionB2BRepository {
  public cotizaciones: CotizacionB2B[] = [];
  crear(datos: CrearCotizacionB2BDatos): Promise<CotizacionB2B> {
    const c = datos.cotizacion;
    const guardada = new CotizacionB2B(
      c.id,
      this.cotizaciones.length + 1,
      c.clienteId,
      c.vendedorId,
      c.sucursalId,
      c.subtotal,
      c.iva,
      c.total,
      c.medioPagoSugerido,
      c.referenciaPago,
      c.estado,
      c.estadoPedido,
      c.validaHasta,
      c.observaciones,
      c.aprobadoPor,
      c.fechaAval,
      c.motivoRechazo,
      c.facturaId,
      c.createdAt,
      c.updatedAt,
      datos.items,
    );
    this.cotizaciones.push(guardada);
    return Promise.resolve(guardada);
  }
  findById(id: string) {
    return Promise.resolve(this.cotizaciones.find((c) => c.id === id) ?? null);
  }
  listar(_f: FiltrosCotizacionesB2B) {
    return Promise.resolve(this.cotizaciones);
  }
  otorgarAval(id: string, aprobadoPor: string, fechaAval: Date): Promise<CotizacionB2B | null> {
    const idx = this.cotizaciones.findIndex((c) => c.id === id && c.estado === 'pendiente_aval');
    if (idx === -1) return Promise.resolve(null);
    const prev = this.cotizaciones[idx];
    const next = new CotizacionB2B(
      prev.id, prev.consecutivo, prev.clienteId, prev.vendedorId, prev.sucursalId,
      prev.subtotal, prev.iva, prev.total, prev.medioPagoSugerido, prev.referenciaPago,
      'aprobada', null, prev.validaHasta, prev.observaciones,
      aprobadoPor, fechaAval, null, null, prev.createdAt, fechaAval, prev.items,
    );
    this.cotizaciones[idx] = next;
    return Promise.resolve(next);
  }
  rechazar(id: string, rechazadoPor: string, fechaAval: Date, motivoRechazo: string): Promise<CotizacionB2B | null> {
    const idx = this.cotizaciones.findIndex((c) => c.id === id && c.estado === 'pendiente_aval');
    if (idx === -1) return Promise.resolve(null);
    const prev = this.cotizaciones[idx];
    const next = new CotizacionB2B(
      prev.id, prev.consecutivo, prev.clienteId, prev.vendedorId, prev.sucursalId,
      prev.subtotal, prev.iva, prev.total, prev.medioPagoSugerido, prev.referenciaPago,
      'rechazada', null, prev.validaHasta, prev.observaciones,
      rechazadoPor, fechaAval, motivoRechazo, null, prev.createdAt, fechaAval, prev.items,
    );
    this.cotizaciones[idx] = next;
    return Promise.resolve(next);
  }
  marcarFacturadaYEnProceso(id: string, facturaId: string): Promise<CotizacionB2B | null> {
    const idx = this.cotizaciones.findIndex((c) => c.id === id && c.estado === 'aprobada');
    if (idx === -1) return Promise.resolve(null);
    const prev = this.cotizaciones[idx];
    const next = new CotizacionB2B(
      prev.id, prev.consecutivo, prev.clienteId, prev.vendedorId, prev.sucursalId,
      prev.subtotal, prev.iva, prev.total, prev.medioPagoSugerido, prev.referenciaPago,
      'facturada', 'en_proceso', prev.validaHasta, prev.observaciones,
      prev.aprobadoPor, prev.fechaAval, null, facturaId, prev.createdAt, new Date(), prev.items,
    );
    this.cotizaciones[idx] = next;
    return Promise.resolve(next);
  }
  actualizarEstadoPedido(id: string, estadoPedido: EstadoPedidoB2B): Promise<CotizacionB2B | null> {
    const idx = this.cotizaciones.findIndex((c) => c.id === id && c.estado === 'facturada');
    if (idx === -1) return Promise.resolve(null);
    const prev = this.cotizaciones[idx];
    const next = new CotizacionB2B(
      prev.id, prev.consecutivo, prev.clienteId, prev.vendedorId, prev.sucursalId,
      prev.subtotal, prev.iva, prev.total, prev.medioPagoSugerido, prev.referenciaPago,
      'facturada', estadoPedido, prev.validaHasta, prev.observaciones,
      prev.aprobadoPor, prev.fechaAval, null, prev.facturaId, prev.createdAt, new Date(), prev.items,
    );
    this.cotizaciones[idx] = next;
    return Promise.resolve(next);
  }
}

const mockAlcanceGlobal = {
  execute: () => Promise.resolve(Result.ok(AlcanceSucursal.global())),
} as unknown as ResolverAlcanceSucursalUseCase;

const mockSucursalOp = { obtenerSucursalId: () => Promise.resolve(1) };

Deno.test('Credito B2B: crear cliente con ganancia neta deja credito bloqueado y alerta urgente al Super Admin', async () => {
  const clienteRepo = new InMemoryClienteRepo();
  const alertaRepo = new MockAlertaRepo();
  const auditor = new MockAuditor();

  const uc = new RegistrarClienteUseCase(clienteRepo, auditor, alertaRepo, mockSucursalOp);
  const res = await uc.execute({
    tipoDocumento: 'NIT',
    numeroDocumento: '900888777-1',
    nombreRazonSocial: 'Distribuidora Andina S.A.S.',
    tipoCliente: 'B2B',
    telefono: '3101234567',
    direccion: 'Calle 100 # 15-20',
    solicitarCredito: true,
    gananciaNetaMensual: 20_000_000,
    antiguedadEmpresaMeses: 24,
    plazoCreditoDias: 30,
    actor: { usuarioId: 'usr-vendedor', ip: '127.0.0.1' },
  });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.cliente.creditoHabilitado, false);
  assertEquals(res.value.cliente.estadoCredito, 'pendiente_aprobacion');
  // 20M * 0.25 * 0.95 = 4.75M -> 4.7M
  assertEquals(res.value.cliente.cupoCreditoSugerido, 4_700_000);
  assertEquals(res.value.alertaSuperAdminEnviada, true);
  assertEquals(alertaRepo.alertas.length, 1);
  assertEquals(alertaRepo.alertas[0].destinatarioRol, 'super-admin');
  assertEquals(alertaRepo.alertas[0].prioridad, 'urgente');
  assertEquals(alertaRepo.alertas[0].motivo, 'SOLICITUD_CREDITO_B2B');

  // Super Admin aprueba el cupo
  const decidirUc = new DecidirCreditoClienteB2BUseCase(clienteRepo, auditor);
  const resAprobar = await decidirUc.execute({
    clienteId: res.value.cliente.id,
    decision: 'aprobar',
    cupoAprobado: 4_500_000,
    motivo: 'Aprobado tras revisar estados financieros',
    actor: { usuarioId: 'usr-superadmin', ip: '127.0.0.1' },
  });

  assertEquals(resAprobar.isSuccess, true);
  assertEquals(resAprobar.value.creditoHabilitado, true);
  assertEquals(resAprobar.value.estadoCredito, 'aprobado');
  assertEquals(resAprobar.value.cupoCreditoAprobado, 4_500_000);
  assertEquals(resAprobar.value.cupoCreditoDisponible, 4_500_000);
});

Deno.test('Modo A Cotizacion B2B: vendedor no puede facturar sin aval; tras aval factura y pasa a pedido en_proceso', async () => {
  const clienteRepo = new InMemoryClienteRepo();
  const cotRepo = new InMemoryCotizacionRepo();
  const alertaRepo = new MockAlertaRepo();
  const auditor = new MockAuditor();

  const cliente = await clienteRepo.crear({
    tipoDocumento: 'NIT',
    numeroDocumento: '901222333-4',
    nombreRazonSocial: 'Comercializadora Norte S.A.S.',
    tipoCliente: 'B2B',
    email: 'compras@norte.co',
    telefono: '3001112233',
    direccion: 'Av 1 # 2-3',
  });
  await clienteRepo.decidirCredito(cliente.id, {
    creditoHabilitado: true,
    estadoCredito: 'aprobado',
    cupoCreditoAprobado: 2_000_000,
    plazoCreditoDias: 30,
    creditoAprobadoPor: 'usr-super',
    creditoAprobadoEn: new Date(),
    motivoDecisionCredito: 'OK',
  });

  // 1. Vendedor crea cotización (NO factura)
  const crearCotUc = new CrearCotizacionB2BUseCase(
    cotRepo, clienteRepo, mockSucursalOp, auditor, alertaRepo,
  );
  const resCot = await crearCotUc.execute({
    clienteId: cliente.id,
    medioPagoSugerido: 'credito_corporativo',
    items: [{ productoId: 'prod-1', cantidad: 10, precioUnitario: 100_000, descuento: 0 }],
    actor: { usuarioId: 'usr-vendedor', ip: '127.0.0.1' },
  });
  assertEquals(resCot.isSuccess, true);
  assertEquals(resCot.value.estado, 'pendiente_aval');
  assertEquals(alertaRepo.alertas[0].destinatarioRol, 'admin-sucursal');

  // 2. Facturar sin aval debe fallar con COTIZACION_SIN_AVAL
  const crearFacturaUc = new CrearFacturaUseCase(
    {
      crear: (d: CrearFacturaDatos) => Promise.resolve(new Factura(
        d.factura.id, 1, d.factura.clienteId, d.factura.usuarioId, d.factura.sucursalId,
        null, d.factura.subtotal, d.factura.iva, d.factura.total, 'emitida', null, new Date(), d.items, d.pagos,
      )),
    } as unknown as IFacturaRepository,
    { buscarAbiertoDeUsuario: () => Promise.resolve(null) } as unknown as ITurnoCajaRepository,
    clienteRepo,
    mockSucursalOp,
    auditor,
  );
  const facturarCotUc = new FacturarCotizacionB2BUseCase(
    cotRepo, crearFacturaUc, mockAlcanceGlobal, auditor,
  );

  const sinAval = await facturarCotUc.execute({
    cotizacionId: resCot.value.id,
    actor: { usuarioId: 'usr-vendedor', ip: '127.0.0.1' },
  });
  assertEquals(sinAval.isFailure, true);
  assertEquals(sinAval.error.code, 'COTIZACION_SIN_AVAL');

  // 3. Admin de Sucursal da el AVAL
  const avalarUc = new AvalarCotizacionB2BUseCase(cotRepo, mockAlcanceGlobal, auditor);
  const resAval = await avalarUc.execute({
    cotizacionId: resCot.value.id,
    accion: 'avalar',
    actor: { usuarioId: 'usr-admin-sucursal', ip: '127.0.0.1' },
  });
  assertEquals(resAval.isSuccess, true);
  assertEquals(resAval.value.estado, 'aprobada');

  // 4. Ahora sí se factura y pasa a pedido en_proceso + descuenta cupo de crédito ($1.000.000)
  const resFact = await facturarCotUc.execute({
    cotizacionId: resCot.value.id,
    actor: { usuarioId: 'usr-vendedor', ip: '127.0.0.1' },
  });
  assertEquals(resFact.isSuccess, true);
  assertEquals(resFact.value.cotizacion.estado, 'facturada');
  assertEquals(resFact.value.cotizacion.estadoPedido, 'en_proceso');
  assertEquals(resFact.value.factura.total, 1_000_000);

  const clienteActualizado = await clienteRepo.findById(cliente.id);
  assertEquals(clienteActualizado?.cupoCreditoUtilizado, 1_000_000);
  assertEquals(clienteActualizado?.cupoCreditoDisponible, 1_000_000);

  // 5. Admin de Sucursal avanza el pedido: en_proceso -> despachado -> entregado
  const pedidoUc = new ActualizarEstadoPedidoB2BUseCase(cotRepo, mockAlcanceGlobal, auditor);
  const resDesp = await pedidoUc.execute({
    cotizacionId: resCot.value.id,
    estadoPedido: 'despachado',
    actor: { usuarioId: 'usr-admin-sucursal', ip: '127.0.0.1' },
  });
  assertEquals(resDesp.isSuccess, true);
  assertEquals(resDesp.value.estadoPedido, 'despachado');

  const resEnt = await pedidoUc.execute({
    cotizacionId: resCot.value.id,
    estadoPedido: 'entregado',
    actor: { usuarioId: 'usr-admin-sucursal', ip: '127.0.0.1' },
  });
  assertEquals(resEnt.isSuccess, true);
  assertEquals(resEnt.value.estadoPedido, 'entregado');
});

Deno.test('Credito B2B: bloquea factura a credito si supera el cupo disponible (CUPO_CREDITO_INSUFICIENTE)', async () => {
  const clienteRepo = new InMemoryClienteRepo();
  const auditor = new MockAuditor();
  const cli = await clienteRepo.crear({
    tipoDocumento: 'NIT',
    numeroDocumento: '909090909-1',
    nombreRazonSocial: 'Empresa Tope S.A.S.',
    tipoCliente: 'B2B',
    email: null,
    telefono: '3110000000',
    direccion: 'Cra 1 # 1-1',
  });
  await clienteRepo.decidirCredito(cli.id, {
    creditoHabilitado: true,
    estadoCredito: 'aprobado',
    cupoCreditoAprobado: 500_000,
    plazoCreditoDias: 30,
    creditoAprobadoPor: 'usr-super',
    creditoAprobadoEn: new Date(),
    motivoDecisionCredito: 'Cupo inicial',
  });

  const crearFacturaUc = new CrearFacturaUseCase(
    {} as unknown as IFacturaRepository,
    { buscarAbiertoDeUsuario: () => Promise.resolve(null) } as unknown as ITurnoCajaRepository,
    clienteRepo,
    mockSucursalOp,
    auditor,
  );
  const res = await crearFacturaUc.execute({
    clienteId: cli.id,
    esB2B: true,
    items: [{ productoId: 'prod-1', cantidad: 10, precioUnitario: 100_000 }],
    pagos: [{ medioPago: 'credito_corporativo', monto: 1_000_000 }],
    actor: { usuarioId: 'usr-admin', ip: '127.0.0.1' },
  });
  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'CUPO_CREDITO_INSUFICIENTE');
});

Deno.test('Credito B2B: preserva marcador [clienteId] en alerta y libera cupo de inmediato para cotizar a credito', async () => {
  const clienteRepo = new InMemoryClienteRepo();
  const cotRepo = new InMemoryCotizacionRepo();
  const alertaRepo = new MockAlertaRepo();
  const auditor = new MockAuditor();

  const nombreLargo =
    'Corporacion Internacional de Logistica Industrial, Distribucion Mayorista y Abastecimiento Estrategico de Colombia S.A.S. Zona Franca';
  const registrarUc = new RegistrarClienteUseCase(clienteRepo, auditor, alertaRepo, mockSucursalOp);
  const reg = await registrarUc.execute({
    tipoDocumento: 'NIT',
    numeroDocumento: '901555666-7',
    nombreRazonSocial: nombreLargo,
    tipoCliente: 'B2B',
    email: 'finanzas@corp-larga.co',
    telefono: '3205556677',
    direccion: 'Zona Franca Bodega 18',
    solicitarCredito: true,
    gananciaNetaMensual: 15_000_000,
    antiguedadEmpresaMeses: 18,
    plazoCreditoDias: 30,
    actor: { usuarioId: 'usr-vendedor', ip: '127.0.0.1' },
  });

  assertEquals(reg.isSuccess, true);
  const clienteId = reg.value.cliente.id;
  const descripcionAlerta = alertaRepo.alertas[0]?.descripcion ?? '';
  assertEquals(descripcionAlerta.includes(`[clienteId:${clienteId}]`), true);

  // Antes de la aprobación del Super Admin, NO se puede cotizar a crédito corporativo
  const crearCotUc = new CrearCotizacionB2BUseCase(
    cotRepo, clienteRepo, mockSucursalOp, auditor, alertaRepo,
  );
  const cotBloqueada = await crearCotUc.execute({
    clienteId,
    medioPagoSugerido: 'credito_corporativo',
    items: [{ productoId: 'prod-1', cantidad: 5, precioUnitario: 200_000, descuento: 0 }],
    actor: { usuarioId: 'usr-vendedor', ip: '127.0.0.1' },
  });
  assertEquals(cotBloqueada.isFailure, true);
  assertEquals(cotBloqueada.error.code, 'CREDITO_NO_HABILITADO');

  // Super Admin aprueba el crédito de una vez (sin necesidad de reescribir cupo -> usa cupo sugerido)
  const decidirUc = new DecidirCreditoClienteB2BUseCase(clienteRepo, auditor);
  const aprobacion = await decidirUc.execute({
    clienteId,
    decision: 'aprobar',
    actor: { usuarioId: 'usr-superadmin', ip: '127.0.0.1' },
  });
  assertEquals(aprobacion.isSuccess, true);
  assertEquals(aprobacion.value.creditoHabilitado, true);
  assertEquals(aprobacion.value.estadoCredito, 'aprobado');
  assertEquals(aprobacion.value.cupoCreditoAprobado, reg.value.cliente.cupoCreditoSugerido);

  // Inmediatamente después, el Vendedor B2B ya puede cotizar a crédito corporativo
  const cotLiberada = await crearCotUc.execute({
    clienteId,
    medioPagoSugerido: 'credito_corporativo',
    items: [{ productoId: 'prod-1', cantidad: 5, precioUnitario: 200_000, descuento: 0 }],
    actor: { usuarioId: 'usr-vendedor', ip: '127.0.0.1' },
  });
  assertEquals(cotLiberada.isSuccess, true);
  assertEquals(cotLiberada.value.estado, 'pendiente_aval');
  assertEquals(cotLiberada.value.medioPagoSugerido, 'credito_corporativo');
});
