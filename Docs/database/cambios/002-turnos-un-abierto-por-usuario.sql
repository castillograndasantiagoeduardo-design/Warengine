-- Garantiza a nivel de BD un solo turno abierto por usuario (pendiente 6.9).
-- El índice UNIQUE ignora los NULL, así que los turnos cerrados no estorban.
ALTER TABLE turnos_caja
    ADD COLUMN turno_abierto_usuario CHAR(36)
        GENERATED ALWAYS AS (
            CASE WHEN fecha_cierre IS NULL AND deleted_at IS NULL THEN usuario_id END
        ) STORED,
    ADD UNIQUE INDEX uq_turnos_un_abierto_por_usuario (turno_abierto_usuario);