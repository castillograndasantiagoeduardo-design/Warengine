export type TipoDocumentoCliente = 'CC' | 'NIT' | 'RUT';
export type TipoCliente = 'B2C' | 'B2B';

export class Cliente {
    constructor(
        public readonly id: string,
        public readonly tipoDocumento: TipoDocumentoCliente,
        public readonly numeroDocumento: string,
        public readonly nombreRazonSocial: string,
        public readonly tipoCliente: TipoCliente,
        public readonly email: string | null,
        public readonly telefono: string | null,
        public readonly direccion: string | null,
        public readonly creditoHabilitado: boolean,
    ) { }

    public get esB2B(): boolean {
        return this.tipoCliente === 'B2B';
    }

    /** RF-FMC-E2: el crédito corporativo solo aplica a B2B con crédito habilitado. */
    public get puedePagarConCredito(): boolean {
        return this.esB2B && this.creditoHabilitado;
    }
}