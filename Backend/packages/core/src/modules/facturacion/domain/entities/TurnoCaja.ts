export class TurnoCaja {
    constructor(
        public readonly id: string,
        public readonly usuarioId: string,
        public readonly sucursalId: number,
        public readonly fondoInicial: number,
        public readonly fechaApertura: Date,
        public readonly fechaCierre: Date | null,
    ) { }

    /** Un turno está abierto mientras no tenga fecha de cierre. */
    public get estaAbierto(): boolean {
        return this.fechaCierre === null;
    }
}