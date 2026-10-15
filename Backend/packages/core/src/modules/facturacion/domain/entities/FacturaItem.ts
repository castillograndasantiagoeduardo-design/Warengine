export class FacturaItem {
    constructor(
        public readonly id: string,
        public readonly facturaId: string,
        public readonly productoId: string,
        public readonly cantidad: number,
        public readonly precioUnitario: number,
        public readonly descuento: number,
        public readonly subtotal: number,
    ) { }

    public static crear(
        id: string,
        facturaId: string,
        productoId: string,
        cantidad: number,
        precioUnitario: number,
        descuento: number = 0,
    ): FacturaItem {
        const subtotal = Math.round(((cantidad * precioUnitario) - descuento) * 100) / 100;
        return new FacturaItem(
            id,
            facturaId,
            productoId,
            cantidad,
            precioUnitario,
            descuento,
            subtotal,
        );
    }
}
