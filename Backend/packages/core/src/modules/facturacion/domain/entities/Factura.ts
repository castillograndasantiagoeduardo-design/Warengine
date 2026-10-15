import { FacturaItem } from './FacturaItem.ts';
import { FacturaPago } from './FacturaPago.ts';

export type EstadoFactura = 'emitida' | 'anulada';

export class Factura {
    constructor(
        public readonly id: string,
        public readonly consecutivo: number,
        public readonly clienteId: string,
        public readonly usuarioId: string,
        public readonly sucursalId: number,
        public readonly turnoCajaId: string | null,
        public readonly subtotal: number,
        public readonly iva: number,
        public readonly total: number,
        public readonly estado: EstadoFactura,
        public readonly anuladaPor: string | null,
        public readonly fecha: Date,
        public readonly items: FacturaItem[] = [],
        public readonly pagos: FacturaPago[] = [],
    ) { }

    /**
     * Calcula los totales a partir de los ítems respetando redondeo a 2 decimales.
     * En el modelo actual el IVA base es 0.00 (decisión abierta para fases fiscales).
     */
    public static calcularTotales(items: { cantidad: number; precioUnitario: number; descuento?: number }[]): {
        subtotal: number;
        iva: number;
        total: number;
    } {
        let sumaSubtotales = 0;
        for (const item of items) {
            const desc = item.descuento ?? 0;
            const linea = Math.round(((item.cantidad * item.precioUnitario) - desc) * 100) / 100;
            sumaSubtotales += linea;
        }
        const subtotal = Math.round(sumaSubtotales * 100) / 100;
        const iva = 0; // Configuración estándar de base
        const total = Math.round((subtotal + iva) * 100) / 100;
        return { subtotal, iva, total };
    }
}
