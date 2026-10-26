/**
 * test-multisucursal-flujo.ts
 *
 * Prueba integral de flujos multi-sucursal:
 * - Admin Norte (Sede 2) y Admin Sur (Sede 3)
 * - Cajero Norte y Cajera Sur
 * - Creación y aislamiento de categorías y productos
 * - Entradas de inventario por sede
 * - Apertura de turno, facturación POS y cierre de turno en cada sede
 * - Verificación de aislamiento de existencias y facturas
 */

const BASE_URL = 'http://localhost:8017';

async function post(url: string, body: any, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${url}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function get(url: string, token?: string, params?: Record<string, any>) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await fetch(`${BASE_URL}${url}${query}`, {
    method: 'GET',
    headers,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function login(email: string, password = '12345678') {
  const res = await post('/auth/login', { email, password });
  if (!res.ok) {
    throw new Error(`Fallo login de ${email}: ${JSON.stringify(res.data)}`);
  }
  return res.data.accessToken as string;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  INICIANDO PRUEBA INTEGRAL MULTI-SUCURSAL (NORTE Y SUR)');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // ─── 1. Autenticación de Actores ───────────────────────────────────────────
  console.log('1. Autenticando usuarios de Sede Norte y Sede Sur...');
  const tokenAdminNorte = await login('trujillo@gmail.com');
  const tokenCajeroNorte = await login('amaya@gmail.com');
  const tokenAdminSur = await login('julian@gmail.com');
  const tokenCajeraSur = await login('maria@gmail.com');
  console.log('   ✔ Admin Norte (trujillo@gmail.com) autenticado');
  console.log('   ✔ Cajero Norte (amaya@gmail.com) autenticado');
  console.log('   ✔ Admin Sur (julian@gmail.com) autenticado');
  console.log('   ✔ Cajera Sur (maria@gmail.com) autenticada\n');

  // ─── 2. Creación de Categorías Globales ─────────────────────────────────────
  console.log('2. Gestión de Categorías Globales...');
  const sufijo = Date.now().toString().slice(-4);
  const catNombreNorte = `Ferretería Industrial ${sufijo}`;
  const catNombreSur = `Bebidas Artesanales ${sufijo}`;

  // Admin Norte crea categoría
  const resCat1 = await post('/inventario/categorias', { nombre: catNombreNorte }, tokenAdminNorte);
  if (!resCat1.ok) throw new Error(`Error creando categoría Norte: ${JSON.stringify(resCat1.data)}`);
  const cat1Id = Number(resCat1.data.id || resCat1.data.id_categoria);
  console.log(`   ✔ Admin Norte creó categoría "${catNombreNorte}" (ID: ${cat1Id})`);

  // Admin Sur crea categoría
  const resCat2 = await post('/inventario/categorias', { nombre: catNombreSur }, tokenAdminSur);
  if (!resCat2.ok) throw new Error(`Error creando categoría Sur: ${JSON.stringify(resCat2.data)}`);
  const cat2Id = Number(resCat2.data.id || resCat2.data.id_categoria);
  console.log(`   ✔ Admin Sur creó categoría "${catNombreSur}" (ID: ${cat2Id})`);

  // Ambos consultan el catálogo global de categorías
  const resListCats = await get('/inventario/categorias', tokenCajeroNorte);
  const cats = Array.isArray(resListCats.data) ? resListCats.data : (resListCats.data.items || []);
  const tieneCat1 = cats.some((c: any) => c.nombre === catNombreNorte);
  const tieneCat2 = cats.some((c: any) => c.nombre === catNombreSur);
  if (!tieneCat1 || !tieneCat2) throw new Error('Fallo en replicación global de categorías.');
  console.log(`   ✔ Catálogo global verificado: ${cats.length} categorías disponibles en el sistema\n`);

  // ─── 3. Creación de Productos con Categoría y Producto Suelto ──────────────
  console.log('3. Creación de Productos y Asignación de Categorías...');
  // Producto con Categoría en Norte
  const skuNorte = `NOR-FER-${sufijo}`;
  const resProdNorte = await post('/inventario/productos', {
    sku: skuNorte,
    nombre: `Taladro Percutor Industrial ${sufijo}`,
    categoriaId: cat1Id,
    precioCompra: 120000,
    precioVenta: 185000,
  }, tokenAdminNorte);
  if (!resProdNorte.ok) throw new Error(`Error creando producto Norte: ${JSON.stringify(resProdNorte.data)}`);
  const prodNorteId = resProdNorte.data.id;
  console.log(`   ✔ Producto asignado a Categoría Norte: [${skuNorte}] (ID: ${prodNorteId})`);

  // Producto con Categoría en Sur
  const skuSur = `SUR-BEB-${sufijo}`;
  const resProdSur = await post('/inventario/productos', {
    sku: skuSur,
    nombre: `Cerveza IPA Especial ${sufijo}`,
    categoriaId: cat2Id,
    precioCompra: 5000,
    precioVenta: 10000,
  }, tokenAdminSur);
  if (!resProdSur.ok) throw new Error(`Error creando producto Sur: ${JSON.stringify(resProdSur.data)}`);
  const prodSurId = resProdSur.data.id;
  console.log(`   ✔ Producto asignado a Categoría Sur: [${skuSur}] (ID: ${prodSurId})`);

  // Producto Suelto (Sin categoría)
  const skuSuelto = `SUE-${sufijo}`;
  const resProdSuelto = await post('/inventario/productos', {
    sku: skuSuelto,
    nombre: `Cinta Aislante Multiuso ${sufijo}`,
    categoriaId: null,
    precioCompra: 1500,
    precioVenta: 3500,
  }, tokenAdminNorte);
  if (!resProdSuelto.ok) throw new Error(`Error creando producto suelto: ${JSON.stringify(resProdSuelto.data)}`);
  const prodSueltoId = resProdSuelto.data.id;
  console.log(`   ✔ Producto Suelto (Sin Categoría): [${skuSuelto}] (ID: ${prodSueltoId})\n`);

  // ─── 4. Entradas de Mercancía e Independencia de Stock por Sede ─────────────
  console.log('4. Asentando Entradas de Mercancía e inventario por Sede...');
  // Entrada en Sede Norte (Sucursal 2): 20 taladros y 50 cintas
  const resEntradaNorte1 = await post('/inventario/entradas', {
    sucursalId: 2,
    productoId: prodNorteId,
    cantidad: 20,
    motivo: 'Compra inicial de herramientas sede Norte',
  }, tokenAdminNorte);
  if (!resEntradaNorte1.ok) throw new Error(`Error entrada Norte: ${JSON.stringify(resEntradaNorte1.data)}`);

  const resEntradaNorte2 = await post('/inventario/entradas', {
    sucursalId: 2,
    productoId: prodSueltoId,
    cantidad: 50,
    motivo: 'Surtido de mostrador sede Norte',
  }, tokenAdminNorte);
  if (!resEntradaNorte2.ok) throw new Error(`Error entrada Norte 2: ${JSON.stringify(resEntradaNorte2.data)}`);
  console.log('   ✔ Sede Norte: Ingresadas 20 unid. de Taladro y 50 unid. de Cinta Aislante');

  // Entrada en Sede Sur (Sucursal 3): 35 cervezas
  const resEntradaSur = await post('/inventario/entradas', {
    sucursalId: 3,
    productoId: prodSurId,
    cantidad: 35,
    motivo: 'Abastecimiento de bebidas sede Sur',
  }, tokenAdminSur);
  if (!resEntradaSur.ok) throw new Error(`Error entrada Sur: ${JSON.stringify(resEntradaSur.data)}`);
  console.log('   ✔ Sede Sur: Ingresadas 35 unid. de Cerveza Artesanal');

  // Comprobar aislamiento de stock entre Sede 2 y Sede 3
  const stockNorteRes = await get('/inventario/stock', tokenCajeroNorte, { sucursalId: 2 });
  const stockNorte = new Map((stockNorteRes.data || []).map((s: any) => [s.productoId, Number(s.stockActual)]));

  const stockSurRes = await get('/inventario/stock', tokenCajeraSur, { sucursalId: 3 });
  const stockSur = new Map((stockSurRes.data || []).map((s: any) => [s.productoId, Number(s.stockActual)]));

  console.log(`   - Stock en Sede Norte -> Taladro: ${stockNorte.get(prodNorteId) ?? 0}, Cerveza: ${stockNorte.get(prodSurId) ?? 0}`);
  console.log(`   - Stock en Sede Sur   -> Taladro: ${stockSur.get(prodNorteId) ?? 0}, Cerveza: ${stockSur.get(prodSurId) ?? 0}`);

  if (stockNorte.get(prodNorteId) !== 20 || (stockNorte.get(prodSurId) ?? 0) !== 0) {
    throw new Error('Aislamiento de stock falló en Sede Norte.');
  }
  if (stockSur.get(prodSurId) !== 35 || (stockSur.get(prodNorteId) ?? 0) !== 0) {
    throw new Error('Aislamiento de stock falló en Sede Sur.');
  }
  console.log('   ✔ Aislamiento de stock confirmado: Las existencias son 100% locales por sucursal.\n');

  // ─── 5. Facturación POS en Sede Norte (Cajero amaya) ────────────────────────
  console.log('5. Flujo POS en Sede Norte (Cajero amaya@gmail.com)...');
  // Cerrar turno previo si quedó abierto de una ejecución anterior
  const turnoActNorte = await get('/ventas/turnos/actual', tokenCajeroNorte);
  const tNortePrevio = turnoActNorte.data?.turno;
  if (tNortePrevio && !tNortePrevio.fechaCierre) {
    console.log(`   ℹ Cerrando turno previo abierto en Sede Norte (ID: ${tNortePrevio.id})...`);
    await post(`/ventas/turnos/${tNortePrevio.id}/cerrar`, { fondoFinal: 50000 }, tokenCajeroNorte);
  }

  // Apertura de nuevo turno para la prueba
  const resTurnoNorte = await post('/ventas/turnos', { fondoInicial: 50000 }, tokenCajeroNorte);
  if (!resTurnoNorte.ok) throw new Error(`Error abriendo turno Norte: ${JSON.stringify(resTurnoNorte.data)}`);
  const turnoNorteId = resTurnoNorte.data.turno?.id || resTurnoNorte.data.id;
  console.log(`   ✔ Turno abierto en Sede Norte (ID: ${turnoNorteId}) con base de $50.000 COP`);

  // Emisión de Factura en Sede Norte
  const clienteIdPrueba = '75d04607-009c-4a60-9ea6-b1e9fb41e63d'; // Cliente B2C Juan Perez
  const resFacNorte = await post('/ventas/facturas', {
    clienteId: clienteIdPrueba,
    items: [
      { productoId: prodNorteId, cantidad: 2, precioUnitario: 185000 },
      { productoId: prodSueltoId, cantidad: 4, precioUnitario: 3500 },
    ],
    pagos: [{ medioPago: 'efectivo', monto: 384000 }],
    esB2B: false,
  }, tokenCajeroNorte);
  if (!resFacNorte.ok) throw new Error(`Error emitiendo factura Norte: ${JSON.stringify(resFacNorte.data)}`);
  const facNorteNum = resFacNorte.data.consecutivo || resFacNorte.data.id;
  console.log(`   ✔ Factura emitida en Sede Norte: #${facNorteNum} por valor de $384.000 COP`);

  // Cierre de turno
  const resCierreNorte = await post(`/ventas/turnos/${turnoNorteId}/cerrar`, {
    fondoFinal: 50000 + 384000, // $434.000 esperado
  }, tokenCajeroNorte);
  if (!resCierreNorte.ok) throw new Error(`Error cerrando turno Norte: ${JSON.stringify(resCierreNorte.data)}`);
  console.log('   ✔ Turno de caja en Sede Norte cerrado y arqueado con $434.000 COP\n');

  // ─── 6. Facturación POS en Sede Sur (Cajera maria) ──────────────────────────
  console.log('6. Flujo POS en Sede Sur (Cajera maria@gmail.com)...');
  // Cerrar turno previo si quedó abierto de una ejecución anterior
  const turnoActSur = await get('/ventas/turnos/actual', tokenCajeraSur);
  const tSurPrevio = turnoActSur.data?.turno;
  if (tSurPrevio && !tSurPrevio.fechaCierre) {
    console.log(`   ℹ Cerrando turno previo abierto en Sede Sur (ID: ${tSurPrevio.id})...`);
    await post(`/ventas/turnos/${tSurPrevio.id}/cerrar`, { fondoFinal: 80000 }, tokenCajeraSur);
  }

  // Apertura de nuevo turno para la prueba
  const resTurnoSur = await post('/ventas/turnos', { fondoInicial: 80000 }, tokenCajeraSur);
  if (!resTurnoSur.ok) throw new Error(`Error abriendo turno Sur: ${JSON.stringify(resTurnoSur.data)}`);
  const turnoSurId = resTurnoSur.data.turno?.id || resTurnoSur.data.id;
  console.log(`   ✔ Turno abierto en Sede Sur (ID: ${turnoSurId}) con base de $80.000 COP`);

  // Emisión de Factura en Sede Sur
  const resFacSur = await post('/ventas/facturas', {
    clienteId: clienteIdPrueba,
    items: [
      { productoId: prodSurId, cantidad: 5, precioUnitario: 10000 },
    ],
    pagos: [{ medioPago: 'efectivo', monto: 50000 }],
    esB2B: false,
  }, tokenCajeraSur);
  if (!resFacSur.ok) throw new Error(`Error emitiendo factura Sur: ${JSON.stringify(resFacSur.data)}`);
  const facSurNum = resFacSur.data.consecutivo || resFacSur.data.id;
  console.log(`   ✔ Factura emitida en Sede Sur: #${facSurNum} por valor de $50.000 COP`);

  // Cierre de turno
  const resCierreSur = await post(`/ventas/turnos/${turnoSurId}/cerrar`, {
    fondoFinal: 80000 + 50000, // $130.000 esperado
  }, tokenCajeraSur);
  if (!resCierreSur.ok) throw new Error(`Error cerrando turno Sur: ${JSON.stringify(resCierreSur.data)}`);
  console.log('   ✔ Turno de caja en Sede Sur cerrado y arqueado con $130.000 COP\n');

  // ─── 7. Comprobación de Stock Actualizado Post-Ventas ──────────────────────
  console.log('7. Verificando reducción de existencias tras ventas...');
  const stockNortePost = await get('/inventario/stock', tokenCajeroNorte, { sucursalId: 2 });
  const mapaNortePost = new Map((stockNortePost.data || []).map((s: any) => [s.productoId, Number(s.stockActual)]));
  const taladrosRestantes = mapaNortePost.get(prodNorteId);
  const cintasRestantes = mapaNortePost.get(prodSueltoId);
  console.log(`   ✔ Sede Norte: Taladros restantes: ${taladrosRestantes} (esperado 18), Cintas restantes: ${cintasRestantes} (esperado 46)`);
  if (taladrosRestantes !== 18 || cintasRestantes !== 46) {
    throw new Error('Stock no descontó correctamente en Sede Norte.');
  }

  const stockSurPost = await get('/inventario/stock', tokenCajeraSur, { sucursalId: 3 });
  const mapaSurPost = new Map((stockSurPost.data || []).map((s: any) => [s.productoId, Number(s.stockActual)]));
  const cervezasRestantes = mapaSurPost.get(prodSurId);
  console.log(`   ✔ Sede Sur: Cervezas restantes: ${cervezasRestantes} (esperado 30)`);
  if (cervezasRestantes !== 30) {
    throw new Error('Stock no descontó correctamente en Sede Sur.');
  }

  // ─── 8. Supervisión de Facturación por Admin de Sucursal ───────────────────
  console.log('\n8. Supervisión de Facturación por cada Admin de Sucursal...');
  const facsNorteAdmin = await get('/ventas/facturas', tokenAdminNorte, { sucursalId: 2 });
  const itemsNorte = Array.isArray(facsNorteAdmin.data) ? facsNorteAdmin.data : (facsNorteAdmin.data.items || facsNorteAdmin.data.facturas || []);
  const vioFacNorte = itemsNorte.some((f: any) => String(f.id) === String(resFacNorte.data.id) || f.consecutivo === facNorteNum || f.numero === facNorteNum);
  const vioFacSurEnNorte = itemsNorte.some((f: any) => String(f.id) === String(resFacSur.data.id));

  console.log(`   ✔ Admin Norte ve su factura #${facNorteNum}: ${vioFacNorte ? 'SÍ' : 'NO'}`);
  console.log(`   ✔ Admin Norte ve facturas de Sede Sur: ${vioFacSurEnNorte ? 'SÍ (ERROR)' : 'NO (CORRECTO)'}`);
  if (!vioFacNorte || vioFacSurEnNorte) {
    throw new Error('Aislamiento de facturación entre sedes falló en Admin Norte.');
  }

  const facsSurAdmin = await get('/ventas/facturas', tokenAdminSur, { sucursalId: 3 });
  const itemsSur = Array.isArray(facsSurAdmin.data) ? facsSurAdmin.data : (facsSurAdmin.data.items || facsSurAdmin.data.facturas || []);
  const vioFacSur = itemsSur.some((f: any) => String(f.id) === String(resFacSur.data.id) || f.consecutivo === facSurNum || f.numero === facSurNum);
  const vioFacNorteEnSur = itemsSur.some((f: any) => String(f.id) === String(resFacNorte.data.id));

  console.log(`   ✔ Admin Sur ve su factura #${facSurNum}: ${vioFacSur ? 'SÍ' : 'NO'}`);
  console.log(`   ✔ Admin Sur ve facturas de Sede Norte: ${vioFacNorteEnSur ? 'SÍ (ERROR)' : 'NO (CORRECTO)'}`);
  if (!vioFacSur || vioFacNorteEnSur) {
    throw new Error('Aislamiento de facturación entre sedes falló en Admin Sur.');
  }

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('  ¡TODAS LAS PRUEBAS DE FLUJOS MULTI-SUCURSAL PASARON CON ÉXITO!  ');
  console.log('═══════════════════════════════════════════════════════════════════');
}

main().catch((err) => {
  console.error('\n❌ ERROR EN LA PRUEBA:', err.message);
  Deno.exit(1);
});
