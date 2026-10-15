export type MedioPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'credito_corporativo';

export class FacturaPago {
    constructor(
        public readonly id: string,
        public readonly facturaId: string,
        public readonly medioPago: MedioPago,
        public readonly monto: number,
        public readonly referenciaTransaccion: string | null,
        public readonly fecha: Date,
    ) { }
}
