import { Hono } from 'hono';
import { AppContainer } from '@warengine/composition';
import { PERMISSIONS } from '@warengine/contracts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { registrarDevolucionController } from '../controllers/facturacion/devolucion-venta.controller.ts';
import {
    actualizarClienteController,
    buscarClientesController,
    obtenerClientePorIdController,
    registrarClienteController,
} from '../controllers/facturacion/cliente.controller.ts';

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

    // Directorio de clientes (RF-FMC-D1..D4)
    api.get('/clientes', authMiddleware(container, PERMISSIONS.FACTURACION_CONSULTAR), buscarClientesController(container));
    api.get('/clientes/:id', authMiddleware(container, PERMISSIONS.FACTURACION_CONSULTAR), obtenerClientePorIdController(container));
    // Registro y actualización de clientes (RF-FMC-B4, B5, B7, D10)
    api.post('/clientes', authMiddleware(container, PERMISSIONS.FACTURACION_GESTIONAR_CLIENTES), registrarClienteController(container));
    api.put('/clientes/:id', authMiddleware(container, PERMISSIONS.FACTURACION_GESTIONAR_CLIENTES), actualizarClienteController(container));
    
    // Turnos de caja (RF-FMC-A1..A4)
    api.post('/turnos', authMiddleware(container, PERMISSIONS.FACTURACION_ABRIR_TURNO), abrirTurnoCajaController(container));
    api.post('/turnos/:id/cerrar', authMiddleware(container, PERMISSIONS.FACTURACION_ABRIR_TURNO), cerrarTurnoCajaController(container));
    api.get('/turnos/actual', authMiddleware(container, PERMISSIONS.FACTURACION_FACTURAR), obtenerTurnoActualController(container));
    // Cajeros en turno de la sede (tablero del admin de sucursal); acotado por alcance
    api.get('/turnos/abiertos', authMiddleware(container, PERMISSIONS.FACTURACION_CONSULTAR), listarTurnosAbiertosController(container));

    // Facturación mostrador y B2B
    api.post('/facturas', authMiddleware(container, PERMISSIONS.FACTURACION_FACTURAR), crearFacturaController(container, false));
    api.post('/facturas/b2b', authMiddleware(container, PERMISSIONS.FACTURACION_VENDER_B2B), crearFacturaController(container, true));
    api.get('/facturas', authMiddleware(container, PERMISSIONS.FACTURACION_CONSULTAR), listarFacturasController(container));
    api.get('/facturas/:id', authMiddleware(container, PERMISSIONS.FACTURACION_CONSULTAR), obtenerFacturaPorIdController(container));
    api.post('/facturas/:id/devoluciones', authMiddleware(container, PERMISSIONS.FACTURACION_DEVOLUCION), registrarDevolucionController(container));
    // Anulación administrativa con reversión de stock (RF-FMC-E10)
    api.post('/facturas/:id/anular', authMiddleware(container, PERMISSIONS.FACTURACION_ANULAR), anularFacturaController(container));

    // Alertas operativas al administrador
    api.post('/alertas', authMiddleware(container, PERMISSIONS.FACTURACION_ALERTAR_ADMIN), emitirAlertaFacturacionController(container));

    return api;
}
