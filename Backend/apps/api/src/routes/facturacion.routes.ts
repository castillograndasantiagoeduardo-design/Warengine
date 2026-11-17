import { Hono } from 'hono';
import { AppContainer } from '@warengine/composition';
import { PERMISSIONS } from '@warengine/contracts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { registrarDevolucionController } from '../controllers/facturacion/devolucion-venta.controller.ts';
import {
    actualizarClienteController,
    buscarClientesController,
    decidirCreditoClienteB2BController,
    listarCreditosPendientesController,
    obtenerClientePorIdController,
    registrarClienteController,
    simularCreditoB2BController,
} from '../controllers/facturacion/cliente.controller.ts';
import {
    actualizarEstadoPedidoB2BController,
    avalarCotizacionB2BController,
    crearCotizacionB2BController,
    facturarCotizacionB2BController,
    listarCotizacionesB2BController,
    obtenerCotizacionB2BController,
    rechazarCotizacionB2BController,
} from '../controllers/facturacion/cotizacion-b2b.controller.ts';

import {
    abrirTurnoCajaController,
    cerrarTurnoCajaController,
    listarTurnosAbiertosController,
    obtenerTurnoActualController,
} from '../controllers/facturacion/turno-caja.controller.ts';

import {
    anularFacturaController,
    crearFacturaController,
    listarFacturasController,
    obtenerFacturaPorIdController,
} from '../controllers/facturacion/factura.controller.ts';

import { emitirAlertaFacturacionController } from '../controllers/facturacion/alerta-facturacion.controller.ts';

export function createFacturacionRoutes(container: AppContainer): Hono {
    const api = new Hono();

    // Directorio de clientes y evaluación crediticia B2B (RF-FMC-D1..D4)
    api.get('/clientes', authMiddleware(container, PERMISSIONS.FACTURACION_CONSULTAR), buscarClientesController(container));
    api.post('/clientes/simular-credito', authMiddleware(container, PERMISSIONS.FACTURACION_GESTIONAR_CLIENTES), simularCreditoB2BController(container));
    api.get('/clientes/creditos-pendientes', authMiddleware(container, PERMISSIONS.FACTURACION_APROBAR_CREDITO_B2B), listarCreditosPendientesController(container));
    api.get('/clientes/:id', authMiddleware(container, PERMISSIONS.FACTURACION_CONSULTAR), obtenerClientePorIdController(container));
    // Registro y actualización de clientes (RF-FMC-B4, B5, B7, D10)
    api.post('/clientes', authMiddleware(container, PERMISSIONS.FACTURACION_GESTIONAR_CLIENTES), registrarClienteController(container));
    api.put('/clientes/:id', authMiddleware(container, PERMISSIONS.FACTURACION_GESTIONAR_CLIENTES), actualizarClienteController(container));
    // Decisión de cupo de crédito B2B (exclusivo Super Admin)
    api.put('/clientes/:id/credito', authMiddleware(container, PERMISSIONS.FACTURACION_APROBAR_CREDITO_B2B), decidirCreditoClienteB2BController(container));

    // Cotizaciones B2B con aval del Admin de Sucursal (Modo A: Cotizar -> Aval -> Facturar y Pedido en Proceso)
    api.post('/cotizaciones-b2b', authMiddleware(container, PERMISSIONS.FACTURACION_COTIZAR_B2B), crearCotizacionB2BController(container));
    api.get('/cotizaciones-b2b', authMiddleware(container, PERMISSIONS.FACTURACION_CONSULTAR), listarCotizacionesB2BController(container));
    api.get('/cotizaciones-b2b/:id', authMiddleware(container, PERMISSIONS.FACTURACION_CONSULTAR), obtenerCotizacionB2BController(container));
    api.put('/cotizaciones-b2b/:id/avalar', authMiddleware(container, PERMISSIONS.FACTURACION_AVALAR_COTIZACION_B2B), avalarCotizacionB2BController(container));
    api.put('/cotizaciones-b2b/:id/rechazar', authMiddleware(container, PERMISSIONS.FACTURACION_AVALAR_COTIZACION_B2B), rechazarCotizacionB2BController(container));
    api.post('/cotizaciones-b2b/:id/facturar', authMiddleware(container, PERMISSIONS.FACTURACION_VENDER_B2B), facturarCotizacionB2BController(container));
    api.put('/cotizaciones-b2b/:id/estado-pedido', authMiddleware(container, PERMISSIONS.FACTURACION_AVALAR_COTIZACION_B2B), actualizarEstadoPedidoB2BController(container));
    
    // Turnos de caja (RF-FMC-A1..A4)
    api.post('/turnos', authMiddleware(container, PERMISSIONS.FACTURACION_ABRIR_TURNO), abrirTurnoCajaController(container));
    api.post('/turnos/:id/cerrar', authMiddleware(container, PERMISSIONS.FACTURACION_ABRIR_TURNO), cerrarTurnoCajaController(container));
    api.get('/turnos/actual', authMiddleware(container, PERMISSIONS.FACTURACION_FACTURAR), obtenerTurnoActualController(container));
    // Cajeros en turno de la sede (tablero del admin de sucursal); acotado por alcance
    api.get('/turnos/abiertos', authMiddleware(container, PERMISSIONS.FACTURACION_CONSULTAR), listarTurnosAbiertosController(container));

    // Facturación mostrador y B2B directa (restringida a roles con `facturacion:facturar`; el vendedor B2B factura vía cotización avalada)
    api.post('/facturas', authMiddleware(container, PERMISSIONS.FACTURACION_FACTURAR), crearFacturaController(container, false));
    api.post('/facturas/b2b', authMiddleware(container, PERMISSIONS.FACTURACION_FACTURAR), crearFacturaController(container, true));
    api.get('/facturas', authMiddleware(container, PERMISSIONS.FACTURACION_CONSULTAR), listarFacturasController(container));
    api.get('/facturas/:id', authMiddleware(container, PERMISSIONS.FACTURACION_CONSULTAR), obtenerFacturaPorIdController(container));
    api.post('/facturas/:id/devoluciones', authMiddleware(container, PERMISSIONS.FACTURACION_DEVOLUCION), registrarDevolucionController(container));
    // Anulación administrativa con reversión de stock (RF-FMC-E10)
    api.post('/facturas/:id/anular', authMiddleware(container, PERMISSIONS.FACTURACION_ANULAR), anularFacturaController(container));

    // Alertas operativas al administrador
    api.post('/alertas', authMiddleware(container, PERMISSIONS.FACTURACION_ALERTAR_ADMIN), emitirAlertaFacturacionController(container));

    return api;
}
