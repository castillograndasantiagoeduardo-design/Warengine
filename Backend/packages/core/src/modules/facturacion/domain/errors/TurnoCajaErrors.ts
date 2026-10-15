import { DomainError } from '@warengine/shared-kernel';

export class TurnoYaAbiertoError extends DomainError {
    public readonly code = 'TURNO_YA_ABIERTO';
    constructor() {
        super('Ya tienes un turno de caja abierto. Ciérralo antes de abrir uno nuevo.');
    }
}

export class FondoInicialInvalidoError extends DomainError {
    public readonly code = 'FONDO_INICIAL_INVALIDO';
    constructor() {
        super('El fondo inicial debe ser un número mayor o igual a cero.');
    }
}

export class OperadorSinSucursalError extends DomainError {
    public readonly code = 'OPERADOR_SIN_SUCURSAL';
    constructor() {
        super('No se pudo determinar la sucursal del operador.');
    }
}

export class TurnoNoEncontradoError extends DomainError {
    public readonly code = 'TURNO_NO_ENCONTRADO';
    constructor() {
        super('El turno de caja no existe.');
    }
}

export class TurnoYaCerradoError extends DomainError {
    public readonly code = 'TURNO_YA_CERRADO';
    constructor() {
        super('El turno de caja ya se encuentra cerrado.');
    }
}

export class FondoFinalInvalidoError extends DomainError {
    public readonly code = 'FONDO_FINAL_INVALIDO';
    constructor() {
        super('El fondo final debe ser un número mayor o igual a cero.');
    }
}

export class NoEsDuenioDelTurnoError extends DomainError {
    public readonly code = 'PERMISO_DENEGADO';
    constructor() {
        super('Solo el operador que abrió el turno puede cerrarlo.');
    }
}