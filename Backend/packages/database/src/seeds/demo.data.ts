/**
 * demo.data.ts — Datos estáticos del seed de demostración (sin contraseñas).
 *
 * Las contraseñas de los usuarios de prueba salen SOLO de SEED_DEMO_PASSWORD (ver demo.seed.ts).
 */

export const SEDE_PRINCIPAL_ID = 1;

export interface SucursalDemo {
  clave: 'norte' | 'centro';
  nombre: string;
  direccion: string;
  contacto: string;
  areas: string[];
}

export const SUCURSALES_DEMO: SucursalDemo[] = [
  {
    clave: 'norte',
    nombre: 'Sede Norte',
    direccion: 'Cra 15 # 93-20, Bogotá',
    contacto: '601 745 2200 · norte@warengine.local',
    areas: ['Bodega', 'Mostrador', 'Caja'],
  },
  {
    clave: 'centro',
    nombre: 'Sede Centro',
    direccion: 'Cl 12 # 7-45, Bogotá',
    contacto: '601 336 1800 · centro@warengine.local',
    areas: ['Bodega', 'Mostrador'],
  },
];

/** Áreas de la Sede Principal (sistema). */
export const AREAS_PRINCIPAL = ['Administración'];

type ClaveSede = SucursalDemo['clave'] | 'principal';

export interface EmpleadoDemo {
  documento: string;
  nombre: string;
  cargo: string;
  sede: ClaveSede;
  area: string;
  telefono: string;
  fechaIngreso: string;
  /** Trayectoria salarial en orden cronológico: [fechaEfectiva, sueldo, motivo]. */
  salarios: [string, number, string][];
  /** Si tiene cuenta de acceso: correo y rol. */
  cuenta?: { email: string; rol: 'admin-sucursal' | 'cajero' | 'vendedor-b2b' };
}

export const EMPLEADOS_DEMO: EmpleadoDemo[] = [
  {
    documento: '1012345671', nombre: 'Laura Méndez Rojas', cargo: 'Administradora de sede', sede: 'norte', area: 'Mostrador',
    telefono: '310 555 0101', fechaIngreso: '2024-02-01',
    salarios: [['2024-02-01', 2800000, 'Salario de ingreso'], ['2025-01-15', 3100000, 'Ajuste anual'], ['2026-01-15', 3400000, 'Ajuste anual']],
    cuenta: { email: 'admin.norte@warengine.local', rol: 'admin-sucursal' },
  },
  {
    documento: '1023456782', nombre: 'Carlos Ruiz Pardo', cargo: 'Cajero', sede: 'norte', area: 'Caja',
    telefono: '311 555 0102', fechaIngreso: '2024-06-10',
    salarios: [['2024-06-10', 1450000, 'Salario de ingreso'], ['2025-06-10', 1560000, 'Ajuste anual']],
    cuenta: { email: 'cajero1@warengine.local', rol: 'cajero' },
  },
  {
    documento: '1034567893', nombre: 'Daniela Torres Gil', cargo: 'Cajera', sede: 'centro', area: 'Mostrador',
    telefono: '312 555 0103', fechaIngreso: '2025-03-03',
    salarios: [['2025-03-03', 1450000, 'Salario de ingreso'], ['2026-03-03', 1580000, 'Ajuste anual']],
    cuenta: { email: 'cajero2@warengine.local', rol: 'cajero' },
  },
  {
    documento: '1045678904', nombre: 'Andrés Salazar Vega', cargo: 'Ejecutivo comercial B2B', sede: 'centro', area: 'Mostrador',
    telefono: '313 555 0104', fechaIngreso: '2024-09-16',
    salarios: [['2024-09-16', 2200000, 'Salario de ingreso'], ['2025-09-16', 2450000, 'Cumplimiento de metas']],
    cuenta: { email: 'vendedor.b2b@warengine.local', rol: 'vendedor-b2b' },
  },
  {
    documento: '1056789015', nombre: 'Miguel Ángel Rincón', cargo: 'Bodeguero', sede: 'norte', area: 'Bodega',
    telefono: '314 555 0105', fechaIngreso: '2023-11-20',
    salarios: [['2023-11-20', 1300000, 'Salario de ingreso'], ['2024-11-20', 1400000, 'Ajuste anual'], ['2025-11-20', 1500000, 'Ajuste anual']],
  },
  {
    documento: '1067890126', nombre: 'Paola Jiménez Cruz', cargo: 'Auxiliar de mostrador', sede: 'norte', area: 'Mostrador',
    telefono: '315 555 0106', fechaIngreso: '2025-05-05',
    salarios: [['2025-05-05', 1423500, 'Salario de ingreso']],
  },
  {
    documento: '1078901237', nombre: 'Jorge Castaño Ríos', cargo: 'Bodeguero', sede: 'centro', area: 'Bodega',
    telefono: '316 555 0107', fechaIngreso: '2024-01-08',
    salarios: [['2024-01-08', 1300000, 'Salario de ingreso'], ['2025-01-08', 1420000, 'Ajuste anual']],
  },
  {
    documento: '1089012348', nombre: 'Valentina Ospina Lara', cargo: 'Auxiliar de mostrador', sede: 'centro', area: 'Mostrador',
    telefono: '317 555 0108', fechaIngreso: '2025-08-19',
    salarios: [['2025-08-19', 1423500, 'Salario de ingreso'], ['2026-08-19', 1500000, 'Periodo de prueba superado']],
  },
  {
    documento: '1090123459', nombre: 'Ricardo Peña Duarte', cargo: 'Contador', sede: 'principal', area: 'Administración',
    telefono: '318 555 0109', fechaIngreso: '2023-04-12',
    salarios: [['2023-04-12', 3200000, 'Salario de ingreso'], ['2024-04-12', 3450000, 'Ajuste anual'], ['2025-04-12', 3700000, 'Ajuste anual']],
  },
  {
    documento: '1101234560', nombre: 'Sofía Arango Mejía', cargo: 'Analista de compras', sede: 'principal', area: 'Administración',
    telefono: '319 555 0110', fechaIngreso: '2024-07-01',
    salarios: [['2024-07-01', 2500000, 'Salario de ingreso'], ['2025-07-01', 2700000, 'Ajuste anual']],
  },
];

export const CATEGORIAS_DEMO = ['Bebidas', 'Snacks', 'Lácteos', 'Abarrotes', 'Aseo'];

export const PROVEEDORES_DEMO: { nombre: string; contacto: string }[] = [
  { nombre: 'Distribuidora Andina S.A.S.', contacto: 'pedidos@andina.local · 601 400 1000' },
  { nombre: 'Alimentos del Valle Ltda.', contacto: 'ventas@delvalle.local · 602 330 2000' },
  { nombre: 'Hogar Limpio S.A.', contacto: 'comercial@hogarlimpio.local · 604 250 3000' },
];

export interface ProductoDemo {
  sku: string;
  nombre: string;
  categoria: string;
  proveedor: number; // índice en PROVEEDORES_DEMO
  compra: number;
  venta: number;
  /** Peso relativo de rotación: más alto = se vende más (para que el ranking tenga forma). */
  rotacion: number;
}

export const PRODUCTOS_DEMO: ProductoDemo[] = [
  { sku: 'BEB-001', nombre: 'Agua mineral 600 ml', categoria: 'Bebidas', proveedor: 0, compra: 900, venta: 1800, rotacion: 10 },
  { sku: 'BEB-002', nombre: 'Gaseosa cola 1.5 L', categoria: 'Bebidas', proveedor: 0, compra: 3200, venta: 5200, rotacion: 9 },
  { sku: 'BEB-003', nombre: 'Jugo de naranja 1 L', categoria: 'Bebidas', proveedor: 1, compra: 3500, venta: 5900, rotacion: 6 },
  { sku: 'BEB-004', nombre: 'Café molido 500 g', categoria: 'Bebidas', proveedor: 1, compra: 11000, venta: 16900, rotacion: 5 },
  { sku: 'SNK-001', nombre: 'Papas fritas 150 g', categoria: 'Snacks', proveedor: 0, compra: 2600, venta: 4500, rotacion: 8 },
  { sku: 'SNK-002', nombre: 'Galletas de avena x12', categoria: 'Snacks', proveedor: 1, compra: 3100, venta: 5200, rotacion: 5 },
  { sku: 'SNK-003', nombre: 'Chocolatina 40 g', categoria: 'Snacks', proveedor: 0, compra: 1200, venta: 2300, rotacion: 7 },
  { sku: 'SNK-004', nombre: 'Maní salado 200 g', categoria: 'Snacks', proveedor: 0, compra: 2900, venta: 4800, rotacion: 2 },
  { sku: 'LAC-001', nombre: 'Leche entera 1 L', categoria: 'Lácteos', proveedor: 1, compra: 2900, venta: 4300, rotacion: 9 },
  { sku: 'LAC-002', nombre: 'Yogur de fresa 1 L', categoria: 'Lácteos', proveedor: 1, compra: 4800, venta: 7400, rotacion: 4 },
  { sku: 'LAC-003', nombre: 'Queso campesino 500 g', categoria: 'Lácteos', proveedor: 1, compra: 8500, venta: 12900, rotacion: 4 },
  { sku: 'LAC-004', nombre: 'Mantequilla 250 g', categoria: 'Lácteos', proveedor: 1, compra: 5200, venta: 7900, rotacion: 2 },
  { sku: 'ABA-001', nombre: 'Arroz blanco 1 kg', categoria: 'Abarrotes', proveedor: 1, compra: 3300, venta: 4900, rotacion: 8 },
  { sku: 'ABA-002', nombre: 'Aceite vegetal 1 L', categoria: 'Abarrotes', proveedor: 1, compra: 7900, venta: 11500, rotacion: 5 },
  { sku: 'ABA-003', nombre: 'Azúcar refinada 1 kg', categoria: 'Abarrotes', proveedor: 1, compra: 3600, venta: 5300, rotacion: 6 },
  { sku: 'ABA-004', nombre: 'Pasta spaghetti 500 g', categoria: 'Abarrotes', proveedor: 1, compra: 2100, venta: 3400, rotacion: 4 },
  { sku: 'ASE-001', nombre: 'Jabón de loza 500 g', categoria: 'Aseo', proveedor: 2, compra: 3400, venta: 5600, rotacion: 3 },
  { sku: 'ASE-002', nombre: 'Papel higiénico x4', categoria: 'Aseo', proveedor: 2, compra: 5300, venta: 8200, rotacion: 6 },
  { sku: 'ASE-003', nombre: 'Detergente en polvo 1 kg', categoria: 'Aseo', proveedor: 2, compra: 8900, venta: 13500, rotacion: 3 },
  { sku: 'ASE-004', nombre: 'Cloro 1 L', categoria: 'Aseo', proveedor: 2, compra: 2400, venta: 3900, rotacion: 1 },
];

/** SKUs que quedan por debajo del stock mínimo al final del seed (alertas de stock). */
export const SKUS_BAJO_MINIMO: Record<SucursalDemo['clave'], string[]> = {
  norte: ['LAC-001', 'BEB-002', 'ASE-002'],
  centro: ['ABA-001', 'SNK-001'],
};

export const CLIENTES_DEMO = [
  { tipoDocumento: 'CC', numero: '222222222222', nombre: 'Consumidor Final', tipo: 'B2C' as const },
  { tipoDocumento: 'CC', numero: '52345678', nombre: 'María Fernanda López', tipo: 'B2C' as const },
  { tipoDocumento: 'CC', numero: '80456789', nombre: 'Juan Pablo Herrera', tipo: 'B2C' as const },
  {
    tipoDocumento: 'NIT', numero: '900123456-7', nombre: 'Restaurante El Fogón S.A.S.', tipo: 'B2B' as const,
    telefono: '601 222 3344', direccion: 'Av 19 # 104-30, Bogotá', email: 'compras@elfogon.local',
  },
];

export const ALERTAS_DEMO: { motivo: string; prioridad: 'urgente' | 'normal'; estado: 'pendiente' | 'visto' | 'atendido'; descripcion: string }[] = [
  { motivo: 'Datáfono sin conexión', prioridad: 'urgente', estado: 'pendiente', descripcion: 'El datáfono de la caja 1 no transmite desde las 10:00.' },
  { motivo: 'Faltante de cambio', prioridad: 'normal', estado: 'visto', descripcion: 'Se requieren monedas de $500 y billetes de $2.000.' },
  { motivo: 'Producto vencido en góndola', prioridad: 'normal', estado: 'atendido', descripcion: 'Se retiraron 6 unidades de yogur con fecha vencida.' },
];
