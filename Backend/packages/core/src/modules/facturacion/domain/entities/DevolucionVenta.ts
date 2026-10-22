import { FacturaItem } from './FacturaItem.ts';

export class DevolucionVenta {
    constructor(
        public readonly id: string,
        public readonly facturaId: string,
        public readonly facturaItemId: string,
        public readonly cantidad: number,
        public readonly motivo: string,
        public readonly montoReembolso: number,
        public readonly reingresaStock: boolean,
        public readonly usuarioId: string,
        public readonly sucursalId: number,
        public readonly fecha: Date,
    ) { }

    /**
     * Reembolso proporcional al subtotal de la línea (respeta descuentos).
     * Si se devuelve lo que queda de la línea, se liquida el remanente exacto
     * para que la suma de reembolsos nunca exceda el subtotal.
     */
    public static calcularReembolso(
        item: FacturaItem,
        cantidad: number,
        cantidadYaDevuelta: number,
        montoYaReembolsado: number,
    ): number {
        const restante = item.cantidad - cantidadYaDevuelta;
        const bruto = cantidad === restante
            ? item.subtotal - montoYaReembolsado
            : (item.subtotal / item.cantidad) * cantidad;
        return Math.max(0, Math.round(bruto * 100) / 100);
    }
}