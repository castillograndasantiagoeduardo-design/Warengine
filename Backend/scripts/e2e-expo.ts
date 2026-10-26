/**
 * e2e-expo.ts — Prueba de extremo a extremo del flujo de la demo, contra la API REAL.
 *
 * Flujo: super admin crea sede + admin-sucursal + cajero + vendedor-b2b → admin crea proveedor,
 * producto y entrada → cajero abre turno, crea cliente, factura, cierra turno cuadrado →
 * vendedor crea cliente B2B y factura → dashboards y auditoría cuadran con lo facturado.
 * Valida además el aislamiento por sucursal (el admin de la sede nueva no toca la Sede Principal).
 *
 * SEGURIDAD:
 *  - Login real del super admin con SEED_SUPERADMIN_PASSWORD (del .env, jamás se imprime).
 *  - Las contraseñas de los usuarios creados se generan aleatorias en memoria y no se muestran.
 *  - Ningún token se imprime.
 *
 * Uso (desde Backend/, con la API levantada y la BD recién sembrada con seed:expo):
 *   deno run -A --env-file=.env scripts/e2e-expo.ts
 *   E2E_API_URL=http://localhost:8017 deno run -A --env-file=.env scripts/e2e-expo.ts
 *
 * Deja datos de prueba en la BD: vuelve a correr `deno task seed:expo` antes de la demo.
 */

const API = Deno.env.get('E2E_API_URL') ?? 'http://localhost:8017';
const SA_EMAIL = 'superadmin@warengine.local';
const ROL = { ADMIN_SUCURSAL: 2, CAJERO: 3, VENDEDOR_B2B: 4 } as const;

const sufijo = Date.now().toString(36).slice(-5).toUpperCase();
let fallos = 0;
let pruebas = 0;

function check(condicion: boolean, descripcion: string, detalle?: unknown): void {
  pruebas++;
  if (condicion) {
    console.log(`  ✓ ${descripcion}`);
  } else {
    fallos++;
    console.log(`  ✗ ${descripcion}${detalle !== undefined ? ` → ${JSON.stringify(detalle)}` : ''}`);
  }
}

function seccion(titulo: string): void {
  console.log(`\n■ ${titulo}`);
}

function passwordAleatoria(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return `Wx9!${btoa(String.fromCharCode(...bytes)).replace(/[^A-Za-z0-9]/g, '')}`;
}

interface Respuesta<T = unknown> {
  status: number;
  body: T;
}

// deno-lint-ignore no-explicit-any
async function api<T = any>(
  metodo: string,
  ruta: string,
  token: string | null,
  cuerpo?: unknown,
): Promise<Respuesta<T>> {
  const res = await fetch(`${API}${ruta}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  const texto = await res.text();
  let body: unknown = texto;
  try {
    body = texto ? JSON.parse(texto) : null;
  } catch {
    // respuesta no JSON (CSV)
  }
  return { status: res.status, body: body as T };
}

/** Quita tokens antes de mostrar un cuerpo de error. */
function sinSecretos(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  const copia = { ...(body as Record<string, unknown>) };
  for (const k of ['accessToken', 'refreshToken', 'tempToken']) if (k in copia) copia[k] = '***';
  return copia;
}

// deno-lint-ignore no-explicit-any
async function login(email: string, password: string): Promise<{ token: string; usuario: any }> {
  const r = await api('POST', '/auth/login', null, { email, password });
  if (r.status !== 200) {
    throw new Error(`Login de ${email} falló (${r.status}): ${JSON.stringify(sinSecretos(r.body))}`);
  }
  return { token: r.body.accessToken, usuario: r.body.usuario };
}

function lista<T>(body: unknown): T[] {
  if (Array.isArray(body)) return body as T[];
  const items = (body as { items?: unknown })?.items;
  return Array.isArray(items) ? (items as T[]) : [];
}

function hoyLocal(): { desde: string; hasta: string } {
  const desde = new Date();
  desde.setHours(0, 0, 0, 0);
  return { desde: desde.toISOString(), hasta: new Date().toISOString() };
}

async function stockDe(token: string, sucursalId: number, productoId: string): Promise<number> {
  const r = await api('GET', `/inventario/stock?sucursalId=${sucursalId}`, token);
  const fila = lista<{ productoId: string; stockActual: number }>(r.body).find((s) => s.productoId === productoId);
  return fila ? Number(fila.stockActual) : 0;
}

async function main(): Promise<void> {
  const saPassword = Deno.env.get('SEED_SUPERADMIN_PASSWORD');
  if (!saPassword) throw new Error('Falta SEED_SUPERADMIN_PASSWORD en el entorno (usa --env-file=.env).');

  console.log(`E2E demo expo contra ${API} (sufijo ${sufijo})`);

  // ─── 1. Super admin ───────────────────────────────────────────────────────
  seccion('1. Super admin: sesión, sucursal y usuarios');
  const sa = await login(SA_EMAIL, saPassword);
  check(sa.usuario?.sucursalId === 1, 'login del super admin trae su sede (Sede Principal)', sa.usuario);

  const verif = await api('GET', '/auth/verificar', sa.token);
  check(
    verif.status === 200 && verif.body?.usuario?.email === SA_EMAIL && verif.body?.usuario?.sucursalId === 1,
    '/auth/verificar devuelve email y sucursal',
    sinSecretos(verif.body),
  );

  const nombreSede = `Sede Expo ${sufijo}`;
  const rSede = await api('POST', '/administracion/sucursales', sa.token, {
    nombre: nombreSede,
    direccion: 'Calle 10 # 20-30',
    contacto: '3001234567',
  });
  const sedeId = Number(rSede.body?.id ?? rSede.body?.idSucursal ?? rSede.body?.id_sucursal);
  check(rSede.status === 201 && sedeId > 1, `crear sucursal "${nombreSede}"`, rSede.body);

  const credenciales: Record<string, { email: string; password: string }> = {};
  const usuarios: Array<[string, number, string]> = [
    ['admin', ROL.ADMIN_SUCURSAL, 'Administrador de sede'],
    ['cajero', ROL.CAJERO, 'Cajero'],
    ['vendedor', ROL.VENDEDOR_B2B, 'Vendedor corporativo'],
  ];
  for (const [clave, rolId, cargo] of usuarios) {
    const email = `${clave}.${sufijo.toLowerCase()}@warengine.local`;
    const password = passwordAleatoria();
    const r = await api('POST', '/administracion/usuarios', sa.token, {
      nombre: `${cargo} ${sufijo}`,
      tipoDocumento: 'CC',
      numeroDocumento: `${rolId}${Date.now().toString().slice(-8)}`,
      email,
      password,
      rolId,
      sucursalId: sedeId,
      cargo,
    });
    check(r.status === 201, `crear usuario ${clave} (rol ${rolId}) en la sede nueva`, r.body);
    credenciales[clave] = { email, password };
  }

  // ─── 2. Admin de sucursal ─────────────────────────────────────────────────
  seccion('2. Admin de sucursal: sesión, proveedor, producto y entrada');
  const admin = await login(credenciales.admin.email, credenciales.admin.password);
  check(
    admin.usuario?.sucursalId === sedeId && admin.usuario?.sucursalNombre === nombreSede,
    'login del admin trae SU sede (no la Sede Principal)',
    admin.usuario,
  );

  const rProv = await api('POST', '/inventario/proveedores', admin.token, {
    nombre: `Distribuidora Expo ${sufijo}`,
    contacto: 'ventas@distribuidora.test',
  });
  const proveedorId = Number(rProv.body?.id);
  check(rProv.status === 201 && proveedorId > 0, 'crear proveedor', rProv.body);

  const PRECIO_VENTA = 25000;
  const PRECIO_CORP = 22000;
  const rProd = await api('POST', '/inventario/productos', admin.token, {
    sku: `EXP-${sufijo}`,
    nombre: `Taladro Expo ${sufijo}`,
    precioCompra: 15000,
    precioVenta: PRECIO_VENTA,
    precioCorporativo: PRECIO_CORP,
  });
  const productoId = String(rProd.body?.id ?? '');
  check(rProd.status === 201 && productoId.length === 36, 'crear producto sin categoría', rProd.body);

  const rMin = await api('PUT', '/inventario/stock-minimo', admin.token, { productoId, sucursalId: sedeId, stockMinimo: 5 });
  check(rMin.status === 200, 'configurar stock mínimo en la sede', rMin.body);

  const ENTRADA = 20;
  const stockInicial = await stockDe(admin.token, sedeId, productoId);
  const rEnt = await api('POST', '/inventario/entradas', admin.token, {
    productoId,
    sucursalId: sedeId,
    cantidad: ENTRADA,
    proveedorId,
    motivo: `Compra inicial demo ${sufijo}`,
  });
  check(rEnt.status === 201, `registrar entrada de ${ENTRADA} unidades`, rEnt.body);
  const stockTrasEntrada = await stockDe(admin.token, sedeId, productoId);
  check(stockTrasEntrada === stockInicial + ENTRADA, `stock tras entrada = ${stockInicial} + ${ENTRADA}`, stockTrasEntrada);

  const rKardex = await api('GET', `/inventario/kardex?productoId=${productoId}&sucursalId=${sedeId}`, admin.token);
  const movs = lista<{ tipo: string; cantidad: number }>(rKardex.body);
  check(
    rKardex.status === 200 && movs.some((m) => m.tipo === 'entrada' && Number(m.cantidad) === ENTRADA),
    'el kardex refleja la entrada',
    rKardex.body,
  );

  // ─── 3. Aislamiento por sucursal ──────────────────────────────────────────
  seccion('3. Aislamiento: el admin de la sede nueva no accede a la Sede Principal');
  const intentos: Array<[string, Promise<Respuesta>]> = [
    ['leer empleados de la sede 1', api('GET', '/administracion/empleados?sucursalId=1', admin.token)],
    ['leer stock de la sede 1', api('GET', '/inventario/stock?sucursalId=1', admin.token)],
    ['leer kardex de la sede 1', api('GET', '/inventario/kardex?sucursalId=1', admin.token)],
    ['leer métricas de la sede 1', api('GET', '/administracion/dashboard/metricas?sucursalId=1', admin.token)],
    ['leer turnos abiertos de la sede 1', api('GET', '/ventas/turnos/abiertos?sucursalId=1', admin.token)],
    [
      'registrar entrada en la sede 1',
      api('POST', '/inventario/entradas', admin.token, { productoId, sucursalId: 1, cantidad: 1 }),
    ],
    [
      'configurar stock mínimo en la sede 1',
      api('PUT', '/inventario/stock-minimo', admin.token, { productoId, sucursalId: 1, stockMinimo: 1 }),
    ],
    ['ver resumen global', api('GET', '/administracion/dashboard/resumen', admin.token)],
    ['ver rendimiento por sucursal', api('GET', '/administracion/dashboard/rendimiento', admin.token)],
  ];
  for (const [desc, p] of intentos) {
    const r = await p;
    check(r.status === 403, `rechazado: ${desc} (403)`, { status: r.status, body: r.body });
  }
  const rEmpPropios = await api('GET', '/administracion/empleados', admin.token);
  const empleados = lista<{ sucursalId: number }>(rEmpPropios.body);
  check(
    empleados.length >= 3 && empleados.every((e) => Number(e.sucursalId) === sedeId),
    'sin filtro, el admin solo ve empleados de su sede',
    empleados.map((e) => e.sucursalId),
  );

  // ─── 4. Cajero ────────────────────────────────────────────────────────────
  seccion('4. Cajero: turno, cliente, factura y cierre');
  const cajero = await login(credenciales.cajero.email, credenciales.cajero.password);
  check(cajero.usuario?.sucursalId === sedeId, 'login del cajero trae su sede', cajero.usuario);
  check(
    (await stockDe(cajero.token, sedeId, productoId)) === stockTrasEntrada,
    'el cajero ve el stock real de su sede',
  );

  const sinTurno = await api('POST', '/ventas/facturas', cajero.token, {
    clienteId: crypto.randomUUID(),
    items: [{ productoId, cantidad: 1, precioUnitario: PRECIO_VENTA }],
    pagos: [{ medioPago: 'efectivo', monto: PRECIO_VENTA }],
  });
  check(sinTurno.status === 400, 'facturar sin turno abierto se rechaza', sinTurno.body);

  const FONDO = 50000;
  const rTurno = await api('POST', '/ventas/turnos', cajero.token, { fondoInicial: FONDO });
  const turnoId = String(rTurno.body?.id ?? '');
  check(rTurno.status === 201 && turnoId.length > 0, 'abrir turno de caja', rTurno.body);

  const rCli = await api('POST', '/ventas/clientes', cajero.token, {
    tipoDocumento: 'CC',
    numeroDocumento: `10${Date.now().toString().slice(-8)}`,
    nombreRazonSocial: `Cliente Mostrador ${sufijo}`,
    tipoCliente: 'B2C',
  });
  const clienteId = String(rCli.body?.cliente?.id ?? '');
  check(rCli.status === 201 && clienteId.length === 36, 'crear cliente de mostrador', rCli.body);

  const VENTA = 3;
  const totalVenta = VENTA * PRECIO_VENTA;
  const rFac = await api('POST', '/ventas/facturas', cajero.token, {
    clienteId,
    items: [{ productoId, cantidad: VENTA, precioUnitario: PRECIO_VENTA }],
    pagos: [{ medioPago: 'efectivo', monto: totalVenta }],
  });
  check(
    rFac.status === 201 && Number(rFac.body?.total) === totalVenta && Number(rFac.body?.sucursalId) === sedeId,
    `facturar ${VENTA} uds en efectivo (${totalVenta})`,
    rFac.body,
  );
  const fechaFactura = new Date(String(rFac.body?.fecha));
  check(
    Math.abs(fechaFactura.getTime() - Date.now()) < 5 * 60 * 1000,
    'la fecha de la factura coincide con la hora actual (zona horaria correcta)',
    rFac.body?.fecha,
  );
  const stockTrasVenta = await stockDe(cajero.token, sedeId, productoId);
  check(stockTrasVenta === stockTrasEntrada - VENTA, `stock tras venta = ${stockTrasEntrada} - ${VENTA}`, stockTrasVenta);

  const rFacId = await api('GET', `/ventas/facturas/${rFac.body?.id}`, cajero.token);
  check(rFacId.status === 200 && rFacId.body?.items?.length === 1, 'consultar la factura (ticket)', rFacId.body);
  const fechaLeida = new Date(String(rFacId.body?.fecha));
  check(
    Math.abs(fechaLeida.getTime() - Date.now()) < 5 * 60 * 1000,
    'la fecha leída de la BD también coincide con la hora actual',
    rFacId.body?.fecha,
  );

  const rAbiertos = await api('GET', `/ventas/turnos/abiertos?sucursalId=${sedeId}`, admin.token);
  const abiertos = lista<{ id: string; cantidadVentas: number; totalVentas: number }>(rAbiertos.body);
  const miTurno = abiertos.find((t) => t.id === turnoId);
  check(
    rAbiertos.status === 200 && miTurno?.cantidadVentas === 1 && miTurno?.totalVentas === totalVenta,
    'el admin ve al cajero en turno con su venta',
    rAbiertos.body,
  );

  const rCierre = await api('POST', `/ventas/turnos/${turnoId}/cerrar`, cajero.token, { fondoFinal: FONDO + totalVenta });
  check(
    rCierre.status === 200 && Number(rCierre.body?.diferencia) === 0,
    `cerrar turno contando ${FONDO + totalVenta}: diferencia 0 (cuadrado)`,
    rCierre.body,
  );

  // ─── 5. Vendedor B2B ──────────────────────────────────────────────────────
  seccion('5. Vendedor B2B: cliente corporativo y venta');
  const vendedor = await login(credenciales.vendedor.email, credenciales.vendedor.password);
  check(vendedor.usuario?.sucursalId === sedeId, 'login del vendedor trae su sede', vendedor.usuario);

  const sinDatos = await api('POST', '/ventas/clientes', vendedor.token, {
    tipoDocumento: 'NIT',
    numeroDocumento: `900${Date.now().toString().slice(-6)}`,
    nombreRazonSocial: 'Empresa Incompleta SAS',
    tipoCliente: 'B2B',
  });
  check(sinDatos.status === 400, 'cliente B2B sin dirección/teléfono se rechaza', sinDatos.body);

  const rB2B = await api('POST', '/ventas/clientes', vendedor.token, {
    tipoDocumento: 'NIT',
    numeroDocumento: `901${Date.now().toString().slice(-6)}`,
    nombreRazonSocial: `Constructora Expo ${sufijo} SAS`,
    tipoCliente: 'B2B',
    telefono: '6017654321',
    direccion: 'Av. Industrial 45-10',
    email: 'compras@constructora.test',
  });
  const clienteB2BId = String(rB2B.body?.cliente?.id ?? '');
  check(rB2B.status === 201 && clienteB2BId.length === 36, 'crear cliente B2B', rB2B.body);

  const B2B = 4;
  const totalB2B = B2B * PRECIO_CORP;
  const itemsB2B = [{ productoId, cantidad: B2B, precioUnitario: PRECIO_CORP }];

  const rCredito = await api('POST', '/ventas/facturas/b2b', vendedor.token, {
    clienteId: clienteB2BId,
    items: itemsB2B,
    pagos: [{ medioPago: 'credito_corporativo', monto: totalB2B }],
  });
  check(rCredito.status === 422, 'crédito corporativo sin habilitar se rechaza (CREDITO_NO_HABILITADO)', rCredito.body);

  const rB2BCli = await api('POST', '/ventas/facturas/b2b', vendedor.token, {
    clienteId,
    items: itemsB2B,
    pagos: [{ medioPago: 'transferencia', monto: totalB2B }],
  });
  check(rB2BCli.status === 422, 'venta B2B a un cliente B2C se rechaza', rB2BCli.body);

  const rFacB2B = await api('POST', '/ventas/facturas/b2b', vendedor.token, {
    clienteId: clienteB2BId,
    items: itemsB2B,
    pagos: [{ medioPago: 'transferencia', monto: totalB2B, referenciaTransaccion: `TRX-${sufijo}` }],
  });
  check(
    rFacB2B.status === 201 && Number(rFacB2B.body?.total) === totalB2B && rFacB2B.body?.turnoCajaId === null,
    `factura B2B por transferencia sin turno (${totalB2B}, precio corporativo)`,
    rFacB2B.body,
  );
  const stockFinal = await stockDe(vendedor.token, sedeId, productoId);
  check(stockFinal === stockTrasVenta - B2B, `stock tras B2B = ${stockTrasVenta} - ${B2B}`, stockFinal);

  // ─── 6. Dashboards ────────────────────────────────────────────────────────
  seccion('6. Dashboards coherentes con lo facturado hoy');
  const totalHoy = totalVenta + totalB2B;
  const { desde, hasta } = hoyLocal();
  const q = `desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`;

  const mAdmin = await api('GET', `/administracion/dashboard/metricas?sucursalId=${sedeId}&${q}`, admin.token);
  check(
    mAdmin.status === 200 &&
      Number(mAdmin.body?.ingresosTotales) === totalHoy &&
      Number(mAdmin.body?.totalFacturas) === 2 &&
      Number(mAdmin.body?.ticketPromedio) === totalHoy / 2,
    `admin: ventas de hoy ${totalHoy}, 2 facturas, ticket ${totalHoy / 2}`,
    mAdmin.body,
  );

  const facHoy = await api('GET', `/ventas/facturas?fechaInicio=${encodeURIComponent(desde)}&limite=100`, admin.token);
  check(
    lista<{ sucursalId: number }>(facHoy.body).length === 2 &&
      lista<{ sucursalId: number }>(facHoy.body).every((f) => Number(f.sucursalId) === sedeId),
    'admin: las facturas de hoy son las 2 de su sede',
    facHoy.body,
  );

  const invAdmin = await api('GET', `/administracion/dashboard/inventario?sucursalIds=${sedeId}`, admin.token);
  const filaInv = lista<{ productoId: string; existenciasPorSucursal: Array<{ sucursalId: number; stockActual: number }> }>(
    invAdmin.body,
  ).find((i) => i.productoId === productoId);
  check(
    filaInv?.existenciasPorSucursal.find((e) => Number(e.sucursalId) === sedeId)?.stockActual === stockFinal,
    `admin: inventario del dashboard = ${stockFinal}`,
    invAdmin.body,
  );

  const rankAdmin = await api('GET', `/administracion/dashboard/ranking?sucursalId=${sedeId}&${q}`, admin.token);
  const topAdmin = lista<{ productoId: string; cantidadVendida?: number }>(rankAdmin.body)[0];
  check(rankAdmin.status === 200 && topAdmin?.productoId === productoId, 'admin: ranking con el producto vendido', rankAdmin.body);

  const resumen = await api('GET', `/administracion/dashboard/resumen?${q}`, sa.token);
  check(
    resumen.status === 200 && Number(resumen.body?.ventasConsolidadas) === totalHoy && Number(resumen.body?.totalFacturas) === 2,
    `super admin: ventas consolidadas ${totalHoy} y 2 facturas`,
    resumen.body,
  );

  const rend = await api('GET', `/administracion/dashboard/rendimiento?${q}`, sa.token);
  const filaSede = lista<{ sucursalId: number; totalVentas: number; totalFacturas: number }>(rend.body).find(
    (s) => Number(s.sucursalId) === sedeId,
  );
  check(
    Number(filaSede?.totalVentas) === totalHoy && Number(filaSede?.totalFacturas) === 2,
    'super admin: rendimiento por sucursal cuadra para la sede nueva',
    rend.body,
  );

  const mSa = await api('GET', `/administracion/dashboard/metricas?${q}`, sa.token);
  check(Number(mSa.body?.ingresosTotales) === totalHoy, 'super admin: métricas globales de hoy', mSa.body);

  // ─── 7. Auditoría ─────────────────────────────────────────────────────────
  seccion('7. Auditoría con los eventos del flujo');
  const audit = await api('GET', `/administracion/auditoria?${q}&limite=200`, sa.token);
  const eventos = lista<{ entidad: string; accion: string }>(audit.body);
  const entidades = new Set(eventos.map((e) => `${e.entidad}:${e.accion}`));
  for (const esperado of ['sucursales', 'usuarios', 'proveedores', 'productos', 'facturas', 'turnos_caja', 'clientes']) {
    check([...entidades].some((e) => e.startsWith(`${esperado}:`)), `auditoría registra eventos de ${esperado}`, [...entidades]);
  }
  const auditTexto = JSON.stringify(audit.body);
  check(
    !Object.values(credenciales).some((c) => auditTexto.includes(c.password)) && !auditTexto.includes(saPassword),
    'la auditoría no contiene contraseñas',
  );

  console.log(`\nResultado: ${pruebas - fallos}/${pruebas} comprobaciones OK${fallos ? ` · ${fallos} FALLOS` : ''}`);
  console.log('Recuerda: corre `deno task seed:expo` antes de la demo para dejar la base limpia.');
  if (fallos > 0) Deno.exit(1);
}

if (import.meta.main) {
  main().catch((e) => {
    console.error(`\n❌ ${e instanceof Error ? e.message : e}`);
    Deno.exit(1);
  });
}
