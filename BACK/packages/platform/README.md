# packages/platform/ — Infraestructura técnica sin lógica de negocio

Implementa los ports técnicos de `core` (JWT, hashing, TOTP, correo, logger…).

**Qué va aquí:** implementaciones concretas de los ports definidos en
`core/application/ports/`: `jwt/` (firma y verificación de tokens),
`hashing/` (hash de contraseñas), `totp/` (2FA), `mailer/`, `logger/`,
`rate-limit/` y `config/` (validación de variables de entorno con Zod).

**Qué NO va aquí:** lógica de negocio, reglas de Warengine, casos de uso.
Si algo de aquí necesita conocer a `Factura` o `Producto`, está mal ubicado.
