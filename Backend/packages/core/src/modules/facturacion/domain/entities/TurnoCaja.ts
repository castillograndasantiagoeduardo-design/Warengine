export class TurnoCaja {
    constructor(
        public readonly id: string,
        public readonly usuarioId: string,
        public readonly sucursalId: number,
        public readonly fondoInicial: number,
        public readonly fechaApertura: Date,
        public readonly fechaCierre: Date | null,
        public readonly fondoFinal: number | null = null,
        public readonly diferencia: number | null = null,
    ) { }

    /** Un turno está abierto mientras no tenga fecha de cierre. */
    public get estaAbierto(): boolean {
        return this.fechaCierre === null;
    }

    /** Un turno está cerrado cuando tiene fecha de cierre. */
    public get estaCerrado(): boolean {
        return this.fechaCierre !== null;
    }
}