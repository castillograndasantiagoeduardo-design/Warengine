import { Hono } from 'hono';
import { AppContainer } from '@warengine/composition';
import { PERMISSIONS } from '@warengine/contracts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import {
    actualizarClienteController,
    buscarClientesController,
    obtenerClientePorIdController,
    registrarClienteController,
} from '../controllers/facturacion/cliente.controller.ts';

import {
    abrirTurnoCajaController,
    cerrarTurnoCajaController,
    obtenerTurnoActualController,
} from '../controllers/facturacion/turno-caja.controller.ts';

export function createFacturacionRoutes(container: AppContainer): Hono {
    const api = new Hono();

    // Directorio de clientes (RF-FMC-D1..D4)
    api.get('/clientes', authMiddleware(container, PERMISSIONS.FACTURACION_CONSULTAR), buscarClientesController(container));
    api.get('/clientes/:id', authMiddleware(container, PERMISSIONS.FACTURACION_CONSULTAR), obtenerClientePorIdController(container));
    // Registro y actualización de clientes (RF-FMC-B4, B5, B7, D10)
    api.post('/clientes', authMiddleware(container, PERMISSIONS.FACTURACION_GESTIONAR_CLIENTES), registrarClienteController(container));
    api.put('/clientes/:id', authMiddleware(container, PERMISSIONS.FACTURACION_GESTIONAR_CLIENTES), actualizarClienteController(container));
    api.post('/turnos', authMiddleware(container, PERMISSIONS.FACTURACION_ABRIR_TURNO), abrirTurnoCajaController(container));
    api.post('/turnos/:id/cerrar', authMiddleware(container, PERMISSIONS.FACTURACION_ABRIR_TURNO), cerrarTurnoCajaController(container));
    api.get('/turnos/actual', authMiddleware(container, PERMISSIONS.FACTURACION_FACTURAR), obtenerTurnoActualController(container));

    return api;
}