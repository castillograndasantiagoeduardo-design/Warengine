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