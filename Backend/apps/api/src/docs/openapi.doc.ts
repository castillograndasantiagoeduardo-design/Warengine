/**
 * openapi.doc.ts — Especificación OpenAPI 3.0.3 completa para Warengine API.
 * Cubre todos los módulos: Autenticación, Administración, Inventario y Facturación.
 */

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Warengine API — ERP & POS Multi-Sucursal',
    version: '1.0.0',
    description: `
API REST de **Warengine**, sistema integral de Punto de Venta (POS) y ERP multi-sucursal con arquitectura limpia (Clean Architecture), inventario multi-almacén, kardex append-only, auditoría inmutable y control de acceso basado en roles (RBAC).

### Autenticación
Los endpoints protegidos requieren autenticación mediante **Bearer Token (JWT)** en la cabecera \`Authorization\` o mediante la cookie de sesión HTTP-only \`jwt_access_token\`.
Para autorizar peticiones interactivas en esta consola:
1. Haz login en el endpoint \`POST /auth/login\`.
2. Copia el valor de \`accessToken\`.
3. Haz clic en el botón verde **Authorize** arriba a la derecha e introduce: \`Bearer <tu_token>\` o simplemente \`<tu_token>\`.
    `,
    contact: {
      name: 'Soporte Técnico Warengine',
    },
  },
  servers: [
    {
      url: 'http://localhost:8017',
      description: 'Servidor Local de Desarrollo',
    },
  ],
  tags: [
    { name: 'Autenticación', description: 'Inicio de sesión, renovación de tokens, 2FA y recuperación de contraseñas' },
    { name: 'Administración - Sucursales', description: 'Gestión de sucursales y sedes' },
    { name: 'Administración - Áreas', description: 'Áreas organizacionales por sucursal' },
    { name: 'Administración - Empleados', description: 'Personal, cargos y asignaciones' },
    { name: 'Administración - Salarios', description: 'Historial salarial y aumentos' },
    { name: 'Administración - Usuarios', description: 'Cuentas de usuario, roles y permisos' },
    { name: 'Administración - Auditoría', description: 'Trazabilidad y consulta de logs de auditoría' },
    { name: 'Administración - Alertas', description: 'Alertas administrativas y stock crítico' },
    { name: 'Administración - Dashboard', description: 'Métricas gerenciales, tendencias y comparativos' },
    { name: 'Inventario - Categorías', description: 'Clasificación de productos' },
    { name: 'Inventario - Proveedores', description: 'Directorio de proveedores comerciales' },
    { name: 'Inventario - Productos', description: 'Catálogo de productos, precios e importación CSV' },
    { name: 'Inventario - Movimientos & Kardex', description: 'Entradas, salidas, ajustes, transferencias y Kardex' },
    { name: 'Inventario - Stock Mínimo', description: 'Configuración de umbrales de stock por sucursal' },
    { name: 'Facturación - Clientes', description: 'Gestión de clientes mostrador B2C y corporativos B2B' },
    { name: 'Facturación - Turnos de Caja', description: 'Apertura y cierre de turnos de caja' },
    { name: 'Facturación - Ventas', description: 'Emisión de facturas B2C y B2B' },
    { name: 'Facturación - Alertas', description: 'Notificaciones operativas de facturación al administrador' },
    { name: 'Asistente IA', description: 'Consultas conversacionales con Gemini y herramientas MCP (RF-SA-i1)' },
    { name: 'Sistema', description: 'Healthcheck y estado del servicio' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Introduce tu token JWT obtenido en /auth/login',
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'jwt_access_token',
        description: 'Cookie de sesión HTTP-only generada al hacer login',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'VALIDATION_ERROR' },
          message: { type: 'string', example: 'Los datos proporcionados no son válidos' },
          issues: { type: 'array', items: { type: 'object' } },
        },
      },
      ChatMensajeRequest: {
        type: 'object',
        required: ['mensaje'],
        properties: {
          mensaje: { type: 'string', example: '¿Cuál es el stock actual de laptops en mi sucursal?' },
          historial: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                rol: { type: 'string', enum: ['user', 'model', 'assistant'] },
                texto: { type: 'string' },
              },
            },
          },
        },
      },
      ChatRespuestaResponse: {
        type: 'object',
        properties: {
          respuesta: { type: 'string', example: 'Actualmente dispones de 15 unidades de Laptop Pro 15 en la Sede Principal.' },
          toolsEjecutadas: { type: 'array', items: { type: 'string' }, example: ['consulta-stock'] },
          fecha: { type: 'string', format: 'date-time' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'superadmin@warengine.local' },
          password: { type: 'string', example: 'Warengine.Admin.2026!' },
          recordarme: { type: 'boolean', example: false },
        },
      },
      RenovarTokenRequest: {
        type: 'object',
        properties: {
          refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...' },
        },
      },
      Activar2faRequest: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', example: '123456' },
        },
      },
      Verificar2faLoginRequest: {
        type: 'object',
        required: ['tempToken', 'token'],
        properties: {
          tempToken: { type: 'string' },
          token: { type: 'string', example: '123456' },
        },
      },
      Desactivar2faRequest: {
        type: 'object',
        required: ['password', 'token'],
        properties: {
          password: { type: 'string' },
          token: { type: 'string', example: '123456' },
        },
      },
      SolicitarRecuperacionRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', example: 'usuario@warengine.local' },
        },
      },
      RestablecerPasswordRequest: {
        type: 'object',
        required: ['token', 'nuevoPassword'],
        properties: {
          token: { type: 'string' },
          nuevoPassword: { type: 'string', example: 'NuevoPassSeguro.2026!' },
        },
      },
      CrearSucursalRequest: {
        type: 'object',
        required: ['nombre', 'codigo', 'direccion', 'ciudad', 'telefono'],
        properties: {
          nombre: { type: 'string', example: 'Sucursal Norte' },
          codigo: { type: 'string', example: 'SUC-NORTE' },
          direccion: { type: 'string', example: 'Av. Principal #123' },
          ciudad: { type: 'string', example: 'Quito' },
          telefono: { type: 'string', example: '0991234567' },
          esSedePrincipal: { type: 'boolean', example: false },
        },
      },
      EditarSucursalRequest: {
        type: 'object',
        properties: {
          nombre: { type: 'string', example: 'Sucursal Norte Actualizada' },
          direccion: { type: 'string', example: 'Av. Amazonas #456' },
          ciudad: { type: 'string', example: 'Quito' },
          telefono: { type: 'string', example: '0997654321' },
        },
      },
      CambiarEstadoRequest: {
        type: 'object',
        required: ['activo'],
        properties: {
          activo: { type: 'boolean', example: true },
        },
      },
      CrearAreaRequest: {
        type: 'object',
        required: ['nombre'],
        properties: {
          nombre: { type: 'string', example: 'Ventas y Atención al Cliente' },
          descripcion: { type: 'string', example: 'Área encargada de facturación mostrador' },
        },
      },
      EditarAreaRequest: {
        type: 'object',
        properties: {
          nombre: { type: 'string', example: 'Ventas Corporativas' },
          descripcion: { type: 'string', example: 'Atención a clientes B2B' },
        },
      },
      EditarEmpleadoRequest: {
        type: 'object',
        properties: {
          nombre: { type: 'string', example: 'Juan' },
          apellido: { type: 'string', example: 'Pérez' },
          cargo: { type: 'string', example: 'Cajero Principal' },
          sucursalId: { type: 'integer', example: 1 },
          areaId: { type: 'integer', example: 1 },
          salarioBase: { type: 'number', example: 650.00 },
        },
      },
      RegistrarAumentoSalarioRequest: {
        type: 'object',
        required: ['nuevoSalario', 'motivo'],
        properties: {
          nuevoSalario: { type: 'number', example: 750.00 },
          motivo: { type: 'string', example: 'Aumento anual por desempeño destacado' },
          fechaEfectiva: { type: 'string', format: 'date', example: '2026-11-01' },
        },
      },
      CrearUsuarioRequest: {
        type: 'object',
        required: ['empleadoId', 'email', 'password', 'rolId'],
        properties: {
          empleadoId: { type: 'integer', example: 1 },
          email: { type: 'string', format: 'email', example: 'cajero@warengine.local' },
          password: { type: 'string', example: 'CajeroPass.2026!' },
          rolId: { type: 'integer', example: 3 },
          sucursalIds: { type: 'array', items: { type: 'integer' }, example: [1] },
        },
      },
      CambiarRolUsuarioRequest: {
        type: 'object',
        required: ['rolId'],
        properties: {
          rolId: { type: 'integer', example: 2 },
        },
      },
      RestablecerPasswordUsuarioRequest: {
        type: 'object',
        required: ['password'],
        properties: {
          password: { type: 'string', example: 'NuevaClaveTemporal.2026!' },
        },
      },
      AsignarSucursalesUsuarioRequest: {
        type: 'object',
        required: ['sucursalIds'],
        properties: {
          sucursalIds: { type: 'array', items: { type: 'integer' }, example: [1, 2] },
        },
      },
      CrearAlertaAdminRequest: {
        type: 'object',
        required: ['tipo', 'mensaje'],
        properties: {
          tipo: { type: 'string', example: 'STOCK_CRITICO' },
          mensaje: { type: 'string', example: 'El producto SKU-001 ha superado el mínimo' },
          severidad: { type: 'string', enum: ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'], example: 'ALTA' },
          sucursalId: { type: 'integer', example: 1 },
        },
      },
      CambiarEstadoAlertaRequest: {
        type: 'object',
        required: ['leida'],
        properties: {
          leida: { type: 'boolean', example: true },
        },
      },
      CrearCategoriaRequest: {
        type: 'object',
        required: ['nombre', 'codigo'],
        properties: {
          nombre: { type: 'string', example: 'Bebidas' },
          codigo: { type: 'string', example: 'CAT-BEB' },
          descripcion: { type: 'string', example: 'Bebidas frías y calientes' },
        },
      },
      EditarCategoriaRequest: {
        type: 'object',
        properties: {
          nombre: { type: 'string', example: 'Bebidas y Licores' },
          codigo: { type: 'string', example: 'CAT-BEB-LIC' },
          descripcion: { type: 'string', example: 'Categoría ampliada' },
        },
      },
      CrearProveedorRequest: {
        type: 'object',
        required: ['razonSocial', 'ruc'],
        properties: {
          razonSocial: { type: 'string', example: 'Distribuidora Central S.A.' },
          ruc: { type: 'string', example: '1790012345001' },
          contacto: { type: 'string', example: 'Carlos Mendoza' },
          telefono: { type: 'string', example: '022345678' },
          email: { type: 'string', format: 'email', example: 'ventas@distribuidora.com' },
          direccion: { type: 'string', example: 'Parque Industrial Lote 5' },
        },
      },
      EditarProveedorRequest: {
        type: 'object',
        properties: {
          razonSocial: { type: 'string', example: 'Distribuidora Central S.A.' },
          ruc: { type: 'string', example: '1790012345001' },
          contacto: { type: 'string', example: 'Carlos Mendoza' },
          telefono: { type: 'string', example: '022999999' },
          email: { type: 'string', format: 'email', example: 'contacto@distribuidora.com' },
          direccion: { type: 'string', example: 'Nueva Dirección #789' },
        },
      },
      CrearProductoRequest: {
        type: 'object',
        required: ['sku', 'nombre', 'categoriaId', 'proveedorId', 'precioCosto', 'precioVenta'],
        properties: {
          codigoBarras: { type: 'string', example: '7861234567890' },
          sku: { type: 'string', example: 'PRD-001' },
          nombre: { type: 'string', example: 'Aceite de Girasol 1L' },
          descripcion: { type: 'string', example: 'Aceite vegetal refinado' },
          categoriaId: { type: 'integer', example: 1 },
          proveedorId: { type: 'integer', example: 1 },
          precioCosto: { type: 'number', example: 1.80 },
          precioVenta: { type: 'number', example: 2.50 },
          stockMinimoGlobal: { type: 'integer', example: 10 },
          manejaLotes: { type: 'boolean', example: false },
        },
      },
      EditarProductoRequest: {
        type: 'object',
        properties: {
          codigoBarras: { type: 'string', example: '7861234567890' },
          sku: { type: 'string', example: 'PRD-001' },
          nombre: { type: 'string', example: 'Aceite de Girasol 1L Premium' },
          descripcion: { type: 'string', example: 'Nueva descripción' },
          categoriaId: { type: 'integer', example: 1 },
          proveedorId: { type: 'integer', example: 1 },
          precioCosto: { type: 'number', example: 1.90 },
          precioVenta: { type: 'number', example: 2.75 },
          stockMinimoGlobal: { type: 'integer', example: 15 },
          manejaLotes: { type: 'boolean', example: false },
        },
      },
      RegistrarEntradaRequest: {
        type: 'object',
        required: ['sucursalId', 'proveedorId', 'numeroComprobante', 'items'],
        properties: {
          sucursalId: { type: 'integer', example: 1 },
          proveedorId: { type: 'integer', example: 1 },
          numeroComprobante: { type: 'string', example: 'FAC-001-002-0000456' },
          observacion: { type: 'string', example: 'Recepción mercadería mensual' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['productoId', 'cantidad', 'costoUnitario'],
              properties: {
                productoId: { type: 'integer', example: 1 },
                cantidad: { type: 'number', example: 50 },
                costoUnitario: { type: 'number', example: 1.80 },
                lote: { type: 'string', example: 'L-2026-A' },
                fechaVencimiento: { type: 'string', format: 'date', example: '2027-12-31' },
              },
            },
          },
        },
      },
      AnularEntradaRequest: {
        type: 'object',
        required: ['motivo'],
        properties: {
          motivo: { type: 'string', example: 'Factura anulada por proveedor por error en ítems' },
        },
      },
      RegistrarSalidaRequest: {
        type: 'object',
        required: ['sucursalId', 'tipoMotivo', 'items'],
        properties: {
          sucursalId: { type: 'integer', example: 1 },
          tipoMotivo: { type: 'string', enum: ['MERMA', 'VENCIMIENTO', 'USO_INTERNO', 'OTRO'], example: 'MERMA' },
          observacion: { type: 'string', example: 'Producto dañado durante manipulación' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['productoId', 'cantidad'],
              properties: {
                productoId: { type: 'integer', example: 1 },
                cantidad: { type: 'number', example: 2 },
              },
            },
          },
        },
      },
      AjustarInventarioRequest: {
        type: 'object',
        required: ['sucursalId', 'tipoAjuste', 'motivo', 'items'],
        properties: {
          sucursalId: { type: 'integer', example: 1 },
          tipoAjuste: { type: 'string', enum: ['ENTRADA', 'SALIDA'], example: 'ENTRADA' },
          motivo: { type: 'string', example: 'Regularización por conteo físico anual' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['productoId', 'cantidad'],
              properties: {
                productoId: { type: 'integer', example: 1 },
                cantidad: { type: 'number', example: 5 },
                costoUnitario: { type: 'number', example: 1.80 },
              },
            },
          },
        },
      },
      TransferirMercanciaRequest: {
        type: 'object',
        required: ['sucursalOrigenId', 'sucursalDestinoId', 'items'],
        properties: {
          sucursalOrigenId: { type: 'integer', example: 1 },
          sucursalDestinoId: { type: 'integer', example: 2 },
          observacion: { type: 'string', example: 'Transferencia para cubrir demanda en sucursal' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['productoId', 'cantidad'],
              properties: {
                productoId: { type: 'integer', example: 1 },
                cantidad: { type: 'number', example: 10 },
              },
            },
          },
        },
      },
      ConfigurarStockMinimoRequest: {
        type: 'object',
        required: ['sucursalId', 'productoId', 'stockMinimo'],
        properties: {
          sucursalId: { type: 'integer', example: 1 },
          productoId: { type: 'integer', example: 1 },
          stockMinimo: { type: 'integer', example: 20 },
        },
      },
      RegistrarClienteRequest: {
        type: 'object',
        required: ['tipoCliente', 'documentoIdentidad', 'nombre'],
        properties: {
          tipoCliente: { type: 'string', enum: ['B2C', 'B2B'], example: 'B2C' },
          documentoIdentidad: { type: 'string', example: '1712345678' },
          nombre: { type: 'string', example: 'María' },
          apellido: { type: 'string', example: 'González' },
          razonSocial: { type: 'string', example: 'Comercial MG Cía. Ltda.' },
          direccion: { type: 'string', example: 'Calle Los Álamos #321' },
          telefono: { type: 'string', example: '0981234567' },
          email: { type: 'string', format: 'email', example: 'maria@example.com' },
          limiteCredito: { type: 'number', example: 1500.00 },
          diasCredito: { type: 'integer', example: 30 },
        },
      },
      ActualizarClienteRequest: {
        type: 'object',
        properties: {
          documentoIdentidad: { type: 'string', example: '1712345678' },
          nombre: { type: 'string', example: 'María Elena' },
          apellido: { type: 'string', example: 'González' },
          razonSocial: { type: 'string' },
          direccion: { type: 'string', example: 'Nueva Dirección #987' },
          telefono: { type: 'string', example: '0987654321' },
          email: { type: 'string', format: 'email', example: 'maria.gonzalez@example.com' },
          limiteCredito: { type: 'number', example: 2000.00 },
          diasCredito: { type: 'integer', example: 45 },
          activo: { type: 'boolean', example: true },
        },
      },
      AbrirTurnoCajaRequest: {
        type: 'object',
        required: ['sucursalId', 'montoApertura'],
        properties: {
          sucursalId: { type: 'integer', example: 1 },
          montoApertura: { type: 'number', example: 100.00 },
        },
      },
      CerrarTurnoCajaRequest: {
        type: 'object',
        required: ['montoCierreReal'],
        properties: {
          montoCierreReal: { type: 'number', example: 450.50 },
          observaciones: { type: 'string', example: 'Cierre normal de jornada' },
        },
      },
      CrearFacturaRequest: {
        type: 'object',
        required: ['sucursalId', 'metodoPago', 'items'],
        properties: {
          clienteId: { type: 'integer', example: 1, description: 'Opcional para consumidor final' },
          sucursalId: { type: 'integer', example: 1 },
          metodoPago: { type: 'string', enum: ['EFECTIVO', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'TRANSFERENCIA'], example: 'EFECTIVO' },
          pagaCon: { type: 'number', example: 20.00 },
          observaciones: { type: 'string', example: 'Venta mostrador' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['productoId', 'cantidad', 'precioUnitario'],
              properties: {
                productoId: { type: 'integer', example: 1 },
                cantidad: { type: 'number', example: 2 },
                precioUnitario: { type: 'number', example: 2.50 },
                descuento: { type: 'number', example: 0.00 },
              },
            },
          },
        },
      },
      CrearFacturaB2BRequest: {
        type: 'object',
        required: ['clienteId', 'sucursalId', 'metodoPago', 'items'],
        properties: {
          clienteId: { type: 'integer', example: 1 },
          sucursalId: { type: 'integer', example: 1 },
          metodoPago: { type: 'string', enum: ['CREDITO', 'TRANSFERENCIA', 'CHEQUE'], example: 'CREDITO' },
          plazoDiasCredito: { type: 'integer', example: 30 },
          observaciones: { type: 'string', example: 'Orden de compra B2B-045' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['productoId', 'cantidad', 'precioUnitario'],
              properties: {
                productoId: { type: 'integer', example: 1 },
                cantidad: { type: 'number', example: 20 },
                precioUnitario: { type: 'number', example: 2.20 },
                descuento: { type: 'number', example: 0.00 },
              },
            },
          },
        },
      },
      EmitirAlertaFacturacionRequest: {
        type: 'object',
        required: ['tipo', 'mensaje'],
        properties: {
          tipo: { type: 'string', example: 'ERROR_SISTEMA_FACTURACION' },
          mensaje: { type: 'string', example: 'Error al emitir comprobante' },
          severidad: { type: 'string', enum: ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'], example: 'MEDIA' },
        },
      },
    },
    responses: {
      '400': {
        description: 'Datos de petición incorrectos o error de validación',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
    },
  },
  paths: {
    // ─── Healthcheck ──────────────────────────────────────────────────────────
    '/health': {
      get: {
        tags: ['Sistema'],
        summary: 'Verificar estado del servicio API',
        responses: {
          200: {
            description: 'Servicio operativo',
            content: { 'text/plain': { schema: { type: 'string', example: 'Warengine API - OK' } } },
          },
        },
      },
    },

    // ─── Autenticación ────────────────────────────────────────────────────────
    '/auth/login': {
      post: {
        tags: ['Autenticación'],
        summary: 'Iniciar sesión (JWT + Cookie HTTP-Only)',
        description: 'Autentica credenciales y genera tokens de acceso y refresco.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          200: { description: 'Login exitoso con tokens y cookies' },
          400: { $ref: '#/components/responses/400' },
          401: { description: 'Credenciales inválidas o cuenta bloqueada' },
        },
      },
    },
    '/auth/renovar-token': {
      post: {
        tags: ['Autenticación'],
        summary: 'Renovar Access Token mediante Refresh Token',
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RenovarTokenRequest' } } },
        },
        responses: {
          200: { description: 'Token renovado exitosamente' },
          401: { description: 'Refresh token inválido o expirado' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Autenticación'],
        summary: 'Cerrar sesión',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: 'Sesión finalizada y cookies revocadas' },
        },
      },
    },
    '/auth/verificar': {
      get: {
        tags: ['Autenticación'],
        summary: 'Verificar estado e identidad de la sesión activa',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: 'Sesión válida con roles y permisos' },
          401: { description: 'No autenticado o token vencido' },
        },
      },
    },
    '/auth/2fa/configurar': {
      post: {
        tags: ['Autenticación'],
        summary: 'Generar secreto TOTP y código QR para 2FA',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: 'Secreto generado con código QR y códigos de respaldo' },
        },
      },
    },
    '/auth/2fa/activar': {
      post: {
        tags: ['Autenticación'],
        summary: 'Confirmar y activar 2FA con código TOTP',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Activar2faRequest' } } },
        },
        responses: {
          200: { description: '2FA activado con éxito' },
        },
      },
    },
    '/auth/2fa/verificar': {
      post: {
        tags: ['Autenticación'],
        summary: 'Validar segundo factor durante el login',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Verificar2faLoginRequest' } } },
        },
        responses: {
          200: { description: 'Autenticación 2FA completada' },
        },
      },
    },
    '/auth/2fa/desactivar': {
      post: {
        tags: ['Autenticación'],
        summary: 'Desactivar 2FA del usuario actual',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Desactivar2faRequest' } } },
        },
        responses: {
          200: { description: '2FA desactivado' },
        },
      },
    },
    '/auth/recuperar-password/solicitar': {
      post: {
        tags: ['Autenticación'],
        summary: 'Solicitar enlace de recuperación de contraseña',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SolicitarRecuperacionRequest' } } },
        },
        responses: {
          200: { description: 'Correo de recuperación enviado si el email existe' },
        },
      },
    },
    '/auth/recuperar-password/validar': {
      get: {
        tags: ['Autenticación'],
        summary: 'Validar token de recuperación de contraseña',
        parameters: [
          { name: 'token', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Token de recuperación válido' },
          400: { description: 'Token inválido o expirado' },
        },
      },
    },
    '/auth/recuperar-password/restablecer': {
      post: {
        tags: ['Autenticación'],
        summary: 'Restablecer contraseña con token de recuperación',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RestablecerPasswordRequest' } } },
        },
        responses: {
          200: { description: 'Contraseña restablecida exitosamente' },
        },
      },
    },

    // ─── Administración - Sucursales ──────────────────────────────────────────
    '/administracion/sucursales': {
      get: {
        tags: ['Administración - Sucursales'],
        summary: 'Listar sucursales con paginación y filtros',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: 'pagina', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limite', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'busqueda', in: 'query', schema: { type: 'string' } },
          { name: 'activo', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: { 200: { description: 'Listado de sucursales' } },
      },
      post: {
        tags: ['Administración - Sucursales'],
        summary: 'Crear una nueva sucursal',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CrearSucursalRequest' } } },
        },
        responses: { 201: { description: 'Sucursal creada exitosamente' } },
      },
    },
    '/administracion/sucursales/{id}/detalle': {
      get: {
        tags: ['Administración - Sucursales'],
        summary: 'Obtener información detallada de una sucursal',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Detalle de la sucursal' }, 404: { description: 'Sucursal no encontrada' } },
      },
    },
    '/administracion/sucursales/{id}': {
      put: {
        tags: ['Administración - Sucursales'],
        summary: 'Editar datos de una sucursal',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/EditarSucursalRequest' } } },
        },
        responses: { 200: { description: 'Sucursal actualizada' } },
      },
    },
    '/administracion/sucursales/{id}/estado': {
      put: {
        tags: ['Administración - Sucursales'],
        summary: 'Activar o inactivar una sucursal',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CambiarEstadoRequest' } } },
        },
        responses: { 200: { description: 'Estado modificado' } },
      },
    },

    // ─── Administración - Áreas ───────────────────────────────────────────────
    '/administracion/sucursales/{id}/areas': {
      get: {
        tags: ['Administración - Áreas'],
        summary: 'Listar áreas de una sucursal',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Lista de áreas' } },
      },
      post: {
        tags: ['Administración - Áreas'],
        summary: 'Crear un área para la sucursal',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CrearAreaRequest' } } },
        },
        responses: { 201: { description: 'Área creada' } },
      },
    },
    '/administracion/areas/{id}': {
      put: {
        tags: ['Administración - Áreas'],
        summary: 'Editar un área existente',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/EditarAreaRequest' } } },
        },
        responses: { 200: { description: 'Área editada' } },
      },
      delete: {
        tags: ['Administración - Áreas'],
        summary: 'Eliminar un área',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Área eliminada' } },
      },
    },

    // ─── Administración - Empleados & Salarios ────────────────────────────────
    '/administracion/empleados': {
      get: {
        tags: ['Administración - Empleados'],
        summary: 'Listar empleados de la empresa',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: 'pagina', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limite', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'busqueda', in: 'query', schema: { type: 'string' } },
          { name: 'sucursalId', in: 'query', schema: { type: 'integer' } },
          { name: 'areaId', in: 'query', schema: { type: 'integer' } },
          { name: 'activo', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: { 200: { description: 'Listado de empleados' } },
      },
    },
    '/administracion/empleados/{id}': {
      get: {
        tags: ['Administración - Empleados'],
        summary: 'Obtener un empleado por ID',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Datos del empleado' } },
      },
      put: {
        tags: ['Administración - Empleados'],
        summary: 'Editar información del empleado',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/EditarEmpleadoRequest' } } },
        },
        responses: { 200: { description: 'Empleado actualizado' } },
      },
    },
    '/administracion/empleados/{id}/salarios': {
      get: {
        tags: ['Administración - Salarios'],
        summary: 'Consultar historial salarial de un empleado',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Historial de incrementos' } },
      },
      post: {
        tags: ['Administración - Salarios'],
        summary: 'Registrar aumento salarial para un empleado',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegistrarAumentoSalarioRequest' } } },
        },
        responses: { 200: { description: 'Aumento salarial registrado' } },
      },
    },

    // ─── Administración - Usuarios ────────────────────────────────────────────
    '/administracion/usuarios': {
      get: {
        tags: ['Administración - Usuarios'],
        summary: 'Listar usuarios del sistema',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: 'pagina', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limite', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'busqueda', in: 'query', schema: { type: 'string' } },
          { name: 'rolId', in: 'query', schema: { type: 'integer' } },
          { name: 'sucursalId', in: 'query', schema: { type: 'integer' } },
          { name: 'activo', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: { 200: { description: 'Listado de usuarios' } },
      },
      post: {
        tags: ['Administración - Usuarios'],
        summary: 'Crear un nuevo usuario con credenciales y sucursales',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CrearUsuarioRequest' } } },
        },
        responses: { 201: { description: 'Usuario creado' } },
      },
    },
    '/administracion/roles': {
      get: {
        tags: ['Administración - Usuarios'],
        summary: 'Catálogo de roles (id, nombre, descripción) para el selector de cambio de rol',
        description: 'Requiere el permiso `autenticacion:asignar-roles`.',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: {
            description: 'Listado de roles ordenado por id',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer', example: 2 },
                      nombre: { type: 'string', example: 'admin-sucursal' },
                      descripcion: { type: 'string', nullable: true },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Sin sesión' },
          403: { description: 'Sin permiso autenticacion:asignar-roles' },
        },
      },
    },
    '/administracion/usuarios/{id}/rol': {
      put: {
        tags: ['Administración - Usuarios'],
        summary: 'Cambiar el rol de un usuario',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CambiarRolUsuarioRequest' } } },
        },
        responses: { 200: { description: 'Rol modificado' } },
      },
    },
    '/administracion/usuarios/{id}/estado': {
      put: {
        tags: ['Administración - Usuarios'],
        summary: 'Activar o suspender un usuario',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CambiarEstadoRequest' } } },
        },
        responses: { 200: { description: 'Estado de usuario modificado' } },
      },
    },
    '/administracion/usuarios/{id}/password': {
      put: {
        tags: ['Administración - Usuarios'],
        summary: 'Restablecer contraseña de usuario (Administrador)',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RestablecerPasswordUsuarioRequest' } } },
        },
        responses: { 200: { description: 'Contraseña actualizada' } },
      },
    },
    '/administracion/usuarios/{id}/sucursales': {
      get: {
        tags: ['Administración - Usuarios'],
        summary: 'Obtener sucursales asignadas al usuario',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Sucursales asignadas' } },
      },
      put: {
        tags: ['Administración - Usuarios'],
        summary: 'Asignar o reasignar sucursales a un usuario',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AsignarSucursalesUsuarioRequest' } } },
        },
        responses: { 200: { description: 'Sucursales asignadas' } },
      },
    },

    // ─── Administración - Auditoría & Alertas ─────────────────────────────────
    '/administracion/auditoria': {
      get: {
        tags: ['Administración - Auditoría'],
        summary: 'Consultar registro de auditoría append-only',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: 'pagina', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limite', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'modulo', in: 'query', schema: { type: 'string' } },
          { name: 'accion', in: 'query', schema: { type: 'string' } },
          { name: 'usuarioId', in: 'query', schema: { type: 'integer' } },
          { name: 'desde', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'hasta', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: { 200: { description: 'Registros de auditoría' } },
      },
    },
    '/administracion/auditoria/exportar': {
      get: {
        tags: ['Administración - Auditoría'],
        summary: 'Exportar logs de auditoría en formato CSV',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: 'Archivo CSV descargable', content: { 'text/csv': {} } },
        },
      },
    },
    '/administracion/alertas-stock': {
      get: {
        tags: ['Administración - Alertas'],
        summary: 'Consultar alertas de stock crítico',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: 'sucursalId', in: 'query', schema: { type: 'integer' } },
          { name: 'soloCriticos', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: { 200: { description: 'Alertas de stock' } },
      },
    },
    '/administracion/alertas': {
      get: {
        tags: ['Administración - Alertas'],
        summary: 'Listar alertas administrativas del sistema',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: 'pagina', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limite', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'leida', in: 'query', schema: { type: 'boolean' } },
          { name: 'severidad', in: 'query', schema: { type: 'string', enum: ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'] } },
        ],
        responses: { 200: { description: 'Lista de alertas' } },
      },
      post: {
        tags: ['Administración - Alertas'],
        summary: 'Crear una alerta administrativa manual',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CrearAlertaAdminRequest' } } },
        },
        responses: { 201: { description: 'Alerta creada' } },
      },
    },
    '/administracion/alertas/{id}/estado': {
      put: {
        tags: ['Administración - Alertas'],
        summary: 'Marcar alerta como leída o no leída',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CambiarEstadoAlertaRequest' } } },
        },
        responses: { 200: { description: 'Estado de alerta actualizado' } },
      },
    },

    // ─── Administración - Dashboard ───────────────────────────────────────────
    '/administracion/dashboard/metricas': {
      get: {
        tags: ['Administración - Dashboard'],
        summary: 'Consultar métricas generales de ingresos, ventas y márgenes',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: 'sucursalId', in: 'query', schema: { type: 'integer' } },
          { name: 'desde', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'hasta', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: { 200: { description: 'Métricas calculadas' } },
      },
    },
    '/administracion/dashboard/tendencias': {
      get: {
        tags: ['Administración - Dashboard'],
        summary: 'Tendencias cronológicas de ventas',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: 'sucursalId', in: 'query', schema: { type: 'integer' } },
          { name: 'periodo', in: 'query', schema: { type: 'string', enum: ['DIARIO', 'SEMANAL', 'MENSUAL'] } },
        ],
        responses: { 200: { description: 'Serie temporal de ventas' } },
      },
    },
    '/administracion/dashboard/rendimiento': {
      get: {
        tags: ['Administración - Dashboard'],
        summary: 'Rendimiento comparativo entre sucursales',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { 200: { description: 'Ranking y comparativo de sucursales' } },
      },
    },
    '/administracion/dashboard/ranking': {
      get: {
        tags: ['Administración - Dashboard'],
        summary: 'Ranking de productos más y menos vendidos',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: 'sucursalId', in: 'query', schema: { type: 'integer' } },
          { name: 'limite', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'criterio', in: 'query', schema: { type: 'string', enum: ['CANTIDAD', 'MONTO'] } },
        ],
        responses: { 200: { description: 'Ranking de productos' } },
      },
    },
    '/administracion/dashboard/inventario': {
      get: {
        tags: ['Administración - Dashboard'],
        summary: 'Valorización y estado comparativo del inventario',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'sucursalId', in: 'query', schema: { type: 'integer' } }],
        responses: { 200: { description: 'Resumen de inventario' } },
      },
    },

    // ─── Inventario - Categorías ──────────────────────────────────────────────
    '/inventario/categorias': {
      get: {
        tags: ['Inventario - Categorías'],
        summary: 'Listar categorías de producto',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: 'pagina', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limite', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'busqueda', in: 'query', schema: { type: 'string' } },
          { name: 'activo', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: { 200: { description: 'Lista de categorías' } },
      },
      post: {
        tags: ['Inventario - Categorías'],
        summary: 'Crear una nueva categoría',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CrearCategoriaRequest' } } },
        },
        responses: { 201: { description: 'Categoría creada' } },
      },
    },
    '/inventario/categorias/{id}': {
      get: {
        tags: ['Inventario - Categorías'],
        summary: 'Obtener categoría por ID',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Detalle de la categoría' } },
      },
      put: {
        tags: ['Inventario - Categorías'],
        summary: 'Editar categoría',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/EditarCategoriaRequest' } } },
        },
        responses: { 200: { description: 'Categoría modificada' } },
      },
    },
    '/inventario/categorias/{id}/estado': {
      put: {
        tags: ['Inventario - Categorías'],
        summary: 'Activar o desactivar categoría',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CambiarEstadoRequest' } } },
        },
        responses: { 200: { description: 'Estado actualizado' } },
      },
    },

    // ─── Inventario - Proveedores ─────────────────────────────────────────────
    '/inventario/proveedores': {
      get: {
        tags: ['Inventario - Proveedores'],
        summary: 'Listar proveedores comerciales',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: 'pagina', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limite', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'busqueda', in: 'query', schema: { type: 'string' } },
          { name: 'activo', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: { 200: { description: 'Lista de proveedores' } },
      },
      post: {
        tags: ['Inventario - Proveedores'],
        summary: 'Crear proveedor comercial',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CrearProveedorRequest' } } },
        },
        responses: { 201: { description: 'Proveedor creado' } },
      },
    },
    '/inventario/proveedores/{id}': {
      get: {
        tags: ['Inventario - Proveedores'],
        summary: 'Obtener proveedor por ID',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Datos del proveedor' } },
      },
      put: {
        tags: ['Inventario - Proveedores'],
        summary: 'Editar información del proveedor',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/EditarProveedorRequest' } } },
        },
        responses: { 200: { description: 'Proveedor actualizado' } },
      },
    },
    '/inventario/proveedores/{id}/estado': {
      put: {
        tags: ['Inventario - Proveedores'],
        summary: 'Activar o desactivar proveedor',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CambiarEstadoRequest' } } },
        },
        responses: { 200: { description: 'Estado actualizado' } },
      },
    },

    // ─── Inventario - Productos ───────────────────────────────────────────────
    '/inventario/productos': {
      get: {
        tags: ['Inventario - Productos'],
        summary: 'Listar catálogo de productos con filtros',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: 'pagina', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limite', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'busqueda', in: 'query', schema: { type: 'string' } },
          { name: 'categoriaId', in: 'query', schema: { type: 'integer' } },
          { name: 'proveedorId', in: 'query', schema: { type: 'integer' } },
          { name: 'activo', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: { 200: { description: 'Catálogo de productos' } },
      },
      post: {
        tags: ['Inventario - Productos'],
        summary: 'Crear nuevo producto en catálogo',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CrearProductoRequest' } } },
        },
        responses: { 201: { description: 'Producto registrado' } },
      },
    },
    '/inventario/productos/importar-csv': {
      post: {
        tags: ['Inventario - Productos'],
        summary: 'Importación masiva de productos vía CSV',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  archivo: { type: 'string', format: 'binary', description: 'Archivo CSV' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Resumen del procesamiento masivo' } },
      },
    },
    '/inventario/productos/exportar-csv': {
      get: {
        tags: ['Inventario - Productos'],
        summary: 'Exportar catálogo de productos a CSV',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: 'Archivo CSV descargable', content: { 'text/csv': {} } },
        },
      },
    },
    '/inventario/productos/{id}': {
      get: {
        tags: ['Inventario - Productos'],
        summary: 'Obtener producto por ID',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Detalle del producto' } },
      },
      put: {
        tags: ['Inventario - Productos'],
        summary: 'Editar información del producto',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/EditarProductoRequest' } } },
        },
        responses: { 200: { description: 'Producto actualizado' } },
      },
    },
    '/inventario/productos/{id}/historial-precios': {
      get: {
        tags: ['Inventario - Productos'],
        summary: 'Consultar histórico de variaciones de precio',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Historial de precios' } },
      },
    },
    '/inventario/productos/{id}/estado': {
      put: {
        tags: ['Inventario - Productos'],
        summary: 'Activar o inactivar producto',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CambiarEstadoRequest' } } },
        },
        responses: { 200: { description: 'Estado actualizado' } },
      },
    },

    // ─── Inventario - Movimientos & Kardex ────────────────────────────────────
    '/inventario/entradas': {
      get: {
        tags: ['Inventario - Movimientos & Kardex'],
        summary: 'Listar recepciones / compras de mercadería',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: 'pagina', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limite', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'desde', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'hasta', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'sucursalId', in: 'query', schema: { type: 'integer' } },
          { name: 'proveedorId', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Lista de entradas' } },
      },
      post: {
        tags: ['Inventario - Movimientos & Kardex'],
        summary: 'Registrar entrada de inventario por compra a proveedor',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegistrarEntradaRequest' } } },
        },
        responses: { 201: { description: 'Entrada registrada y Kardex impactado' } },
      },
    },
    '/inventario/entradas/{id}': {
      get: {
        tags: ['Inventario - Movimientos & Kardex'],
        summary: 'Obtener detalle de entrada por ID',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Detalle de la entrada con ítems' } },
      },
    },
    '/inventario/entradas/{id}/anular': {
      post: {
        tags: ['Inventario - Movimientos & Kardex'],
        summary: 'Anular entrada de mercadería con reversión en Kardex',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AnularEntradaRequest' } } },
        },
        responses: { 200: { description: 'Entrada anulada y reversión registrada' } },
      },
    },
    '/inventario/salidas': {
      post: {
        tags: ['Inventario - Movimientos & Kardex'],
        summary: 'Registrar salida por merma, caducidad o uso interno',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegistrarSalidaRequest' } } },
        },
        responses: { 201: { description: 'Salida registrada en Kardex' } },
      },
    },
    '/inventario/ajustes': {
      post: {
        tags: ['Inventario - Movimientos & Kardex'],
        summary: 'Ajuste de inventario manual (entrada o salida)',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AjustarInventarioRequest' } } },
        },
        responses: { 201: { description: 'Ajuste de stock aplicado' } },
      },
    },
    '/inventario/transferencias': {
      post: {
        tags: ['Inventario - Movimientos & Kardex'],
        summary: 'Transferir mercadería entre sucursales',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/TransferirMercanciaRequest' } } },
        },
        responses: { 201: { description: 'Transferencia registrada (salida en origen y entrada en destino)' } },
      },
    },
    '/inventario/kardex': {
      get: {
        tags: ['Inventario - Movimientos & Kardex'],
        summary: 'Consultar Kardex físico / valorizado append-only',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: 'productoId', in: 'query', schema: { type: 'integer' } },
          { name: 'sucursalId', in: 'query', schema: { type: 'integer' } },
          { name: 'desde', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'hasta', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'pagina', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limite', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Movimientos de Kardex' } },
      },
    },
    '/inventario/kardex/exportar-csv': {
      get: {
        tags: ['Inventario - Movimientos & Kardex'],
        summary: 'Exportar movimientos de Kardex a formato CSV',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: 'productoId', in: 'query', schema: { type: 'integer' } },
          { name: 'sucursalId', in: 'query', schema: { type: 'integer' } },
          { name: 'desde', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'hasta', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          200: { description: 'Archivo CSV descargable', content: { 'text/csv': {} } },
        },
      },
    },

    // ─── Inventario - Stock Mínimo ────────────────────────────────────────────
    '/inventario/stock-minimo': {
      put: {
        tags: ['Inventario - Stock Mínimo'],
        summary: 'Configurar stock mínimo por sucursal y producto',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ConfigurarStockMinimoRequest' } } },
        },
        responses: { 200: { description: 'Stock mínimo configurado' } },
      },
    },
    '/inventario/stock-minimo/{sucursalId}/{productoId}': {
      get: {
        tags: ['Inventario - Stock Mínimo'],
        summary: 'Consultar stock actual y mínimo por sucursal y producto',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: 'sucursalId', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'productoId', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Datos de stock' } },
      },
    },

    // ─── Facturación - Clientes ───────────────────────────────────────────────
    '/ventas/clientes': {
      get: {
        tags: ['Facturación - Clientes'],
        summary: 'Buscar y listar clientes con filtros',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: 'busqueda', in: 'query', schema: { type: 'string' } },
          { name: 'tipoCliente', in: 'query', schema: { type: 'string', enum: ['B2C', 'B2B'] } },
          { name: 'activo', in: 'query', schema: { type: 'boolean' } },
          { name: 'pagina', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limite', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Listado de clientes' } },
      },
      post: {
        tags: ['Facturación - Clientes'],
        summary: 'Registrar un nuevo cliente',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegistrarClienteRequest' } } },
        },
        responses: { 201: { description: 'Cliente registrado' } },
      },
    },
    '/ventas/clientes/{id}': {
      get: {
        tags: ['Facturación - Clientes'],
        summary: 'Obtener cliente por ID',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Detalle del cliente' } },
      },
      put: {
        tags: ['Facturación - Clientes'],
        summary: 'Actualizar información del cliente',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ActualizarClienteRequest' } } },
        },
        responses: { 200: { description: 'Cliente actualizado' } },
      },
    },

    // ─── Facturación - Turnos de Caja ─────────────────────────────────────────
    '/ventas/turnos': {
      post: {
        tags: ['Facturación - Turnos de Caja'],
        summary: 'Abrir turno de caja para el usuario actual',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AbrirTurnoCajaRequest' } } },
        },
        responses: { 201: { description: 'Turno de caja abierto' }, 409: { description: 'Ya existe un turno abierto' } },
      },
    },
    '/ventas/turnos/{id}/cerrar': {
      post: {
        tags: ['Facturación - Turnos de Caja'],
        summary: 'Cerrar turno de caja con arqueo y balance',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CerrarTurnoCajaRequest' } } },
        },
        responses: { 200: { description: 'Turno cerrado con cálculo de descuadre' } },
      },
    },
    '/ventas/turnos/actual': {
      get: {
        tags: ['Facturación - Turnos de Caja'],
        summary: 'Consultar turno activo del usuario autenticado',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { 200: { description: 'Turno en curso' }, 404: { description: 'No hay turno abierto' } },
      },
    },

    // ─── Facturación - Facturas Mostrador y B2B ───────────────────────────────
    '/ventas/facturas': {
      get: {
        tags: ['Facturación - Ventas'],
        summary: 'Listar comprobantes y facturas emitidas',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: 'pagina', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limite', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'sucursalId', in: 'query', schema: { type: 'integer' } },
          { name: 'clienteId', in: 'query', schema: { type: 'integer' } },
          { name: 'desde', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'hasta', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'estado', in: 'query', schema: { type: 'string', enum: ['EMITIDA', 'ANULADA', 'PAGADA'] } },
        ],
        responses: { 200: { description: 'Historial de facturas' } },
      },
      post: {
        tags: ['Facturación - Ventas'],
        summary: 'Emitir factura mostrador (B2C al contado)',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CrearFacturaRequest' } } },
        },
        responses: { 201: { description: 'Factura generada y stock descontado' } },
      },
    },
    '/ventas/facturas/b2b': {
      post: {
        tags: ['Facturación - Ventas'],
        summary: 'Emitir factura corporativa B2B (crédito o contado)',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CrearFacturaB2BRequest' } } },
        },
        responses: { 201: { description: 'Venta B2B registrada con validación de límite de crédito' } },
      },
    },
    '/ventas/facturas/{id}': {
      get: {
        tags: ['Facturación - Ventas'],
        summary: 'Obtener detalle de factura por ID con sus líneas',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Comprobante y líneas de detalle' } },
      },
    },
    '/ventas/facturas/{id}/anular': {
      post: {
        tags: ['Facturación - Ventas'],
        summary: 'Anular factura emitida y reingresar el stock al inventario (RF-FMC-E10)',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['motivo'],
                properties: { motivo: { type: 'string', minLength: 5, maxLength: 255, example: 'Cliente canceló la compra' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Factura anulada; el trigger reingresó el stock al kardex' },
          400: { description: 'Motivo ausente o menor a 5 caracteres' },
          403: { description: 'Sin permiso facturacion:anular' },
          404: { description: 'Factura inexistente o fuera de la sede del usuario' },
          409: { description: 'La factura ya estaba anulada' },
        },
      },
    },

    // ─── Facturación - Alertas ────────────────────────────────────────────────
    '/ventas/alertas': {
      post: {
        tags: ['Facturación - Alertas'],
        summary: 'Emitir alerta operativa desde caja hacia el administrador',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/EmitirAlertaFacturacionRequest' } } },
        },
        responses: { 201: { description: 'Alerta enviada' } },
      },
    },

    // ─── Asistente IA ─────────────────────────────────────────────────────────
    '/asistente/chat': {
      post: {
        tags: ['Asistente IA'],
        summary: 'Enviar consulta en lenguaje natural al Asistente IA (Gemini + MCP Tools)',
        description: 'Permite chatear con el asistente conversacional. El modelo Gemini ejecuta de forma autónoma las herramientas autorizadas del servidor MCP (RF-SA-i1 / RF-SA-i2). Requiere permiso mcp:consultar.',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ChatMensajeRequest' } } },
        },
        responses: {
          200: {
            description: 'Respuesta generada por el Asistente IA con detalle de herramientas ejecutadas',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ChatRespuestaResponse' } } },
          },
          401: { description: 'Token de autorización ausente o inválido' },
          403: { description: 'Permisos insuficientes (requiere mcp:consultar)' },
        },
      },
    },
  },
};

