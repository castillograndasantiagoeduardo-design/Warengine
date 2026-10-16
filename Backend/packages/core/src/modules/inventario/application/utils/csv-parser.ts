/**
 * Utilidad pura para parseo de archivos CSV.
 * Soporta delimitadores de coma (,) y punto y coma (;), campos entrecomillados y saltos de línea Windows/Unix.
 */

export interface FilaCSV {
  [columna: string]: string;
}

export function parsearCSV(contenido: string): { filas: FilaCSV[]; errores: string[] } {
  const lineas = dividirLineas(contenido);
  if (lineas.length === 0) {
    return { filas: [], errores: ['El archivo CSV está vacío.'] };
  }

  // Detectar delimitador inspeccionando la primera línea
  const primeraLinea = lineas[0];
  const delimitador = primeraLinea.includes(';') && !primeraLinea.includes(',') ? ';' : ',';

  const cabecerasCrudas = dividirCampos(primeraLinea, delimitador);
  const cabeceras = cabecerasCrudas.map((c) => normalizarCabecera(c));

  if (cabeceras.length === 0 || cabeceras.every((c) => c === '')) {
    return { filas: [], errores: ['El archivo no contiene encabezados válidos en la primera fila.'] };
  }

  const filas: FilaCSV[] = [];
  const errores: string[] = [];

  for (let i = 1; i < lineas.length; i++) {
    const linea = lineas[i].trim();
    if (!linea) continue; // omitir líneas en blanco

    const valores = dividirCampos(lineas[i], delimitador);
    const filaObj: FilaCSV = {};

    for (let j = 0; j < cabeceras.length; j++) {
      const clave = cabeceras[j];
      if (clave) {
        filaObj[clave] = (valores[j] ?? '').trim();
      }
    }

    filas.push(filaObj);
  }

  return { filas, errores };
}

function normalizarCabecera(columna: string): string {
  const limpia = columna.trim().toLowerCase().replace(/["']/g, '');
  // Normalizaciones estándar para campos comunes
  if (limpia === 'sku' || limpia === 'codigo' || limpia === 'código') return 'sku';
  if (limpia === 'nombre' || limpia === 'descripcion' || limpia === 'descripción' || limpia === 'producto') return 'nombre';
  if (
    limpia === 'preciocompra' ||
    limpia === 'precio_compra' ||
    limpia === 'costo' ||
    limpia === 'precio de compra'
  ) return 'precioCompra';
  if (
    limpia === 'precioventa' ||
    limpia === 'precio_venta' ||
    limpia === 'precio' ||
    limpia === 'precio de venta'
  ) return 'precioVenta';
  if (
    limpia === 'preciocorporativo' ||
    limpia === 'precio_corporativo' ||
    limpia === 'precio corporativo'
  ) return 'precioCorporativo';
  if (
    limpia === 'categoriaid' ||
    limpia === 'categoria_id' ||
    limpia === 'categoría_id' ||
    limpia === 'id_categoria'
  ) return 'categoriaId';
  if (
    limpia === 'proveedorid' ||
    limpia === 'proveedor_id' ||
    limpia === 'id_proveedor'
  ) return 'proveedorId';

  return limpia;
}

function dividirLineas(contenido: string): string[] {
  // Maneja \r\n, \r y \n
  return contenido.split(/\r\n|\n|\r/);
}

function dividirCampos(linea: string, delimitador: string): string[] {
  const campos: string[] = [];
  let campoActual = '';
  let campoEntrecomillado = false;

  for (let i = 0; i < linea.length; i++) {
    const char = linea[i];

    if (char === '"' && campoActual.trim().length === 0 && !campoEntrecomillado) {
      // Inicia campo entrecomillado formal al inicio
      campoEntrecomillado = true;
    } else if (campoEntrecomillado && char === '"') {
      if (linea[i + 1] === '"') {
        // Comilla escapada ""
        campoActual += '"';
        i++;
      } else {
        // Cierre de campo entrecomillado
        campoEntrecomillado = false;
      }
    } else if (char === delimitador && !campoEntrecomillado) {
      campos.push(campoActual);
      campoActual = '';
      campoEntrecomillado = false;
    } else {
      campoActual += char;
    }
  }
  campos.push(campoActual);

  return campos.map((c) => c.trim().replace(/^["']|["']$/g, ''));
}
