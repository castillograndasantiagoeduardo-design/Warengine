import type { EstadoCreditoCliente, NivelRiesgoCredito } from '@warengine/contracts';

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
        public readonly gananciaNetaMensual: number | null = null,
        public readonly antiguedadEmpresaMeses: number | null = null,
        public readonly plazoCreditoDias: number | null = 30,
        public readonly cupoCreditoSugerido: number = 0,
        public readonly cupoCreditoAprobado: number = 0,
        public readonly cupoCreditoUtilizado: number = 0,
        public readonly nivelRiesgoCredito: NivelRiesgoCredito | null = null,
        public readonly estadoCredito: EstadoCreditoCliente = 'sin_solicitud',
        public readonly creditoAprobadoPor: string | null = null,
        public readonly creditoAprobadoEn: Date | null = null,
        public readonly motivoDecisionCredito: string | null = null,
        public readonly observacionFinanciera: string | null = null,
        public readonly saldoPendiente: number = 0,
        public readonly totalCompras: number = 0,
    ) { }

    public get esB2B(): boolean {
        return this.tipoCliente === 'B2B';
    }

    /** RF-FMC-E2: el crédito corporativo solo aplica a B2B con crédito habilitado. */
    public get puedePagarConCredito(): boolean {
        return this.esB2B && this.creditoHabilitado;
    }

    /** Saldo disponible del cupo corporativo aprobado. */
    public get cupoCreditoDisponible(): number {
        if (!this.creditoHabilitado) return 0;
        return Math.max(0, Math.round((this.cupoCreditoAprobado - this.cupoCreditoUtilizado) * 100) / 100);
    }

    /**
     * Valida si el cliente tiene cupo suficiente para una operación a crédito.
     * Nota de retrocompatibilidad: clientes legacy con `creditoHabilitado = true` y
     * `cupoCreditoAprobado = 0` (anteriores al sistema de cupos) se permiten si no tienen tope fijado.
     */
    public tieneCupoDisponible(monto: number): boolean {
        if (!this.puedePagarConCredito) return false;
        if (this.cupoCreditoAprobado <= 0 && this.estadoCredito === 'sin_solicitud') {
            return true;
        }
        return this.cupoCreditoDisponible + 0.01 >= monto;
    }

    public toJSON() {
        return {
            id: this.id,
            tipoDocumento: this.tipoDocumento,
            numeroDocumento: this.numeroDocumento,
            nombreRazonSocial: this.nombreRazonSocial,
            tipoCliente: this.tipoCliente,
            email: this.email,
            telefono: this.telefono,
            direccion: this.direccion,
            creditoHabilitado: this.creditoHabilitado,
            gananciaNetaMensual: this.gananciaNetaMensual,
            antiguedadEmpresaMeses: this.antiguedadEmpresaMeses,
            plazoCreditoDias: this.plazoCreditoDias,
            cupoCreditoSugerido: this.cupoCreditoSugerido,
            cupoCreditoAprobado: this.cupoCreditoAprobado,
            cupoCreditoUtilizado: this.cupoCreditoUtilizado,
            cupoCreditoDisponible: this.cupoCreditoDisponible,
            nivelRiesgoCredito: this.nivelRiesgoCredito,
            estadoCredito: this.estadoCredito,
            creditoAprobadoPor: this.creditoAprobadoPor,
            creditoAprobadoEn: this.creditoAprobadoEn,
            motivoDecisionCredito: this.motivoDecisionCredito,
            observacionFinanciera: this.observacionFinanciera,
            saldoPendiente: this.saldoPendiente,
            totalCompras: this.totalCompras,
        };
    }
}
