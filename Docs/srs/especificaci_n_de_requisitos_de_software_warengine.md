# Especificación de Requisitos de Software (SRS)

**Proyecto:** Warengine\
**Estándar:** IEEE Std 830-1998\
**Revisión:** Rev. 99.99\
**Fecha:** Septiembre 2026

---

## Ficha del Documento

| Fecha | Revisión | Autor | Verificado Dep. Calidad |
| :--- | :--- | :--- | :--- |
| Septiembre 2026 | Rev. 99.99 | Santiago Eduardo Castillo Granda, Diego Alexander Trujillo Medina, Oscar Eduardo Amaya Parada | [Firma o sello] |

### Validación del Documento

| Por el cliente | Por la empresa suministradora |
| :--- | :--- |
| Fdo. D./ Dña [Nombre] | Fdo. D./ Dña [Nombre] |

---

## Tabla de Contenidos

- [1. Introducción](#1-introducción)
  - [1.1 Propósito](#11-propósito)
  - [1.2 Alcance](#12-alcance)
  - [1.3 Personal Involucrado](#13-personal-involucrado)
  - [1.4 Definiciones, Acrónimos y Abreviaturas](#14-definiciones-acrónimos-y-abreviaturas)
  - [1.5 Referencias](#15-referencias)
  - [1.6 Resumen](#16-resumen)
- [2. Descripción General](#2-descripción-general)
  - [2.1 Perspectiva del Producto](#21-perspectiva-del-producto)
  - [2.2 Funcionalidad del Producto](#22-funcionalidad-del-producto)
  - [2.3 Características de los Usuarios](#23-características-de-los-usuarios)
  - [2.4 Restricciones](#24-restricciones)
  - [2.5 Suposiciones y Dependencias](#25-suposiciones-y-dependencias)
  - [2.6 Evolución Previsible del Sistema](#26-evolución-previsible-del-sistema)
- [3. Requisitos Específicos](#3-requisitos-específicos)
  - [MÓDULO 1: SEGURIDAD Y AUTENTICACIÓN](#módulo-1-seguridad-y-autenticación)
  - [MÓDULO 2: ADMINISTRACIÓN Y CONTROL](#módulo-2-administración-y-control)
  - [MÓDULO 3: FACTURACIÓN, MOSTRADOR Y CONSULTA DE INVENTARIO](#módulo-3-facturación,-mostrador-y-consulta-de-inventario)
  - [MÓDULO 4: ASISTENTE CONVERSACIONAL (SERVIDOR MCP)](#módulo-4-asistente-conversacional-(servidor-mcp))
  - [MÓDULO 5: LOGÍSTICA Y GESTIÓN DE ACTIVOS INTERNOS](#módulo-5-logística-y-gestión-de-activos-internos)
  - [3.1 Requisitos Comunes de las Interfaces](#31-requisitos-comunes-de-las-interfaces)
  - [3.2 Requisitos Funcionales Base (Resumen Global)](#32-requisitos-funcionales-base-resumen-global)
  - [3.3 Requisitos No Funcionales](#33-requisitos-no-funcionales)
  - [3.4 Otros Requisitos](#34-otros-requisitos)
- [4. Apéndices](#4-apéndices)

---

## 1. Introducción

Este documento constituye la Especificación de Requisitos de Software (SRS) del proyecto **Warengine**, una plataforma integral de gestión de inventario, facturación y control de personal que incorpora un servidor intermedio basado en el **Model Context Protocol (MCP)** para permitir consultas en lenguaje natural sobre la información operativa del negocio. El documento se elabora conforme al estándar **IEEE Std 830-1998**.

### 1.1 Propósito

Definir de forma completa, clara y verificable los requisitos funcionales y no funcionales del sistema Warengine, de manera que sirva como acuerdo entre el equipo de desarrollo y el cliente, y como base para el diseño, la construcción y las pruebas del software. Está dirigido al equipo de desarrollo, a los instructores evaluadores del programa ADSO del SENA y a los usuarios finales y propietarios del negocio que validarán el producto.

### 1.2 Alcance

El producto a desarrollar se denomina Warengine. Comprende la gestión de productos, categorías, proveedores, entradas y salidas de mercancía en inventario, transferencias, ajustes, facturación de mostrador POS y facturación comercial B2B a crédito corporativo, gestión de clientes, administración de personal, asignación de áreas organizativas, histórico de salarios de empleados, control de usuarios y roles RBAC multisede, junto con un asistente conversacional conectado mediante un servidor MCP que consulta la base de datos a través de herramientas (Tools) controladas. Queda fuera del alcance de esta versión la integración con facturación electrónica tributaria directa ante la DIAN y la contabilidad general formal externa.

### 1.3 Personal Involucrado

| Nombre | Rol | Categoría Profesional | Responsabilidades | Información de Contacto |
| :--- | :--- | :--- | :--- | :--- |
| **Santiago Eduardo Castillo Granda** | Líder de proyecto, desarrollador junior | Aprendiz de Tecnología en Análisis y Desarrollo de Software (ADSO) – SENA, Ficha 3232476 | Levantamiento y análisis de requisitos, diseño de la arquitectura (Clean Architecture), desarrollo del backend y del frontend, implementación del servidor MCP y ejecución de pruebas. | Tel: 3142994265<br>Email: castillograndasantiagoeduardo@gmail.com |
| **Diego Alexander Trujillo Medina** | Co-Líder de proyecto, desarrollador junior | Aprendiz de Tecnología en Análisis y Desarrollo de Software (ADSO) – SENA, Ficha 3232476 | Levantamiento y análisis de requisitos, diseño de la arquitectura (Clean Architecture), desarrollo del backend y del frontend, implementación del servidor MCP y ejecución de pruebas. | Tel: 3142994265<br>Email: castillograndasantiagoeduardo@gmail.com |
| **Oscar Eduardo Amaya Parada** | Desarrollador de Software | Aprendiz de Tecnología en Análisis y Desarrollo de Software (ADSO) – SENA, Ficha 3232476 | Levantamiento y análisis de requisitos, diseño de la arquitectura (Clean Architecture), desarrollo del backend y del frontend, implementación del servidor MCP y ejecución de pruebas. | Tel: 3209111484<br>Email: amayaoscar466@gmail.com |

### 1.4 Definiciones, Acrónimos y Abreviaturas

- **ADSO:** Análisis y Desarrollo de Software, programa de formación del SENA.
- **API:** Interfaz de Programación de Aplicaciones (Application Programming Interface).
- **MCP (Model Context Protocol):** Protocolo estándar que expone herramientas (Tools) para que un modelo de inteligencia artificial consulte datos de forma segura y estructurada.
- **Tool:** Operación específica y acotada que el servidor MCP pone a disposición del asistente de IA.
- **RBAC:** Control de Acceso Basado en Roles (Role-Based Access Control) con granularidad por permisos.
- **ORM:** Mapeo Objeto-Relacional; en este proyecto se emplea Drizzle ORM sobre base de datos MySQL 8.
- **SRS:** Especificación de Requisitos de Software (Software Requirements Specification) bajo estándar IEEE 830.
- **POS:** Punto de Venta (Point of Sale).
- **JWT:** JSON Web Token, mecanismo de autenticación sin estado basado en tokens criptográficos firmados.
- **SKU:** Stock Keeping Unit, código alfanumérico único de identificación de un artículo del inventario.
- **Unit of Work (UoW):** Patrón arquitectónico que encapsula múltiples operaciones de persistencia dentro de una única transacción atómica ACID gobernada por la base de datos.

### 1.5 Referencias

- IEEE Std 830-1998, IEEE Recommended Practice for Software Requirements Specifications.
- Clean Architecture: A Craftsman's Guide to Software Structure and Design (Robert C. Martin).
- Model Context Protocol (MCP) Specification (Anthropic / ModelContextProtocol.io).
- Documentación de arquitectura modular interna de Warengine (`Docs/modulos/`).

### 1.6 Resumen

El capítulo 2 presenta una descripción general del producto: su perspectiva, funcionalidad principal, características de los usuarios, restricciones, suposiciones y evolución previsible. El capítulo 3 detalla los requisitos específicos organizados modularmente (seguridad y autenticación, administración y control, facturación y consulta de inventario, asistente conversacional MCP, logística y activos), requisitos de interfaces, requisitos funcionales base y requisitos no funcionales. El capítulo 4 recopila los apéndices.

---

## 2. Descripción General

### 2.1 Perspectiva del Producto

Warengine es un producto independiente de tipo plataforma web, compuesto por tres piezas arquitectónicas desacopladas:
1. Backend: Desarrollado en Deno con TypeScript y Drizzle ORM sobre MySQL 8 aplicando Clean Architecture, arquitectura hexagonal (Ports & Adapters) y principios SOLID.
2. Frontend: Desarrollado en React y Next.js con diseño responsivo para escritorio y tablet.
3. Servidor MCP: Capa de presentación intermedia que expone Tools parametrizadas al asistente de IA, reutilizando los mismos casos de uso del Core de la aplicación sin ejecutar consultas SQL directas.

### 2.2 Funcionalidad del Producto

• Gestión de inventario y catálogo: Productos con SKU único, categorías, proveedores, control de existencias por sucursal, entradas por compra, salidas manuales justificadas, ajustes por conteo físico, transferencias inter-sucursal y kardex inmutable.
• Facturación y punto de venta: Apertura y cierre de turnos de caja con arqueo, facturación POS de mostrador, facturación comercial B2B a crédito corporativo, directorio centralizado de clientes y control atómico de existencias.
• Administración, personal y control: Gestión de sucursales, áreas organizativas, empleados, historial de salarios, asignación de usuarios y roles RBAC multisede, auditoría inmutable de operaciones y dashboard analítico de ventas y rentabilidad.
• Asistente conversacional con MCP: Consultas en lenguaje natural sobre stock, rotación, facturación y alertas con métricas en tiempo real bajo estricto control de permisos.
• Logística y activos internos: Catálogo de activos de trabajo, asignación a empleados o áreas y control de ciclo de vida y mantenimientos.

### 2.3 Características de los Usuarios

| Tipo de Usuario | Formación / Habilidades | Actividades Principales |
| :--- | :--- | :--- |
| **Super Admin / Propietario** | Formación en administración o gestión de negocios. Manejo web básico. Manejo básico de aplicaciones web. No requiere conocimientos de programación ni SQL: las consultas analíticas se realizan visualmente o mediante el asistente conversacional. | Auditoría de logs inmutables, gestión de sucursales y áreas, métricas financieras globales, asignación multisede de usuarios y cambio de roles, aumentos salariales y atención de alertas administrativas. |
| **Administrador de Almacén** | Formación técnica en logística o inventarios. Manejo web básico. Manejo de sistemas de inventario y terminales web. | Gestión de catálogo (categorías, proveedores, productos), registro de entradas de compras, salidas por merma/daño, ajustes por conteo físico, transferencias, supervisión de kardex y alertas de abastecimiento. |
| **Cajero** | Educación media básica. Manejo de sistemas POS y navegador web. Agilidad en facturación, cobro en efectivo y medios electrónicos, arqueo de caja. | Apertura y cierre de turno de caja con arqueo ciego, registro de clientes en mostrador, emisión de facturas POS, cálculo de vueltos y despacho de alertas al supervisor. |
| **Vendedor B2B** | Educación media o técnica en ventas comerciales. Manejo de cotizaciones, atención a clientes corporativos y consulta de catálogo. | Consulta expandida multi-bodega de stock y precios corporativos, registro y actualización de clientes B2B, y emisión de facturación comercial a crédito corporativo sin requerir turno de caja físico. |

### 2.4 Restricciones

- El backend debe desarrollarse exclusivamente con Deno y TypeScript, aplicando Clean Architecture, principios SOLID y separación estricta en módulos de dominio.
- La persistencia relacional debe realizarse sobre MySQL 8 mediante Drizzle ORM, aplicando triggers y restricciones CHECK para gobernar la integridad del kardex y las existencias no negativas.
- El frontend debe construirse con React y Next.js.
- El acceso del asistente de IA a la información solo puede producirse a través de las Tools definidas en el servidor MCP; queda estrictamente prohibida la inyección o ejecución de SQL arbitrario.
- El sistema debe operar en navegadores web modernos (Chrome, Edge, Firefox) con diseño responsivo sin cliente móvil nativo en esta versión.
- El desarrollo debe ajustarse a los criterios de calidad y normativas del programa de formación ADSO del SENA.

### 2.5 Suposiciones y Dependencias

- Disponibilidad de conexión a internet estable en los puntos de venta y almacenes.
- Disponibilidad de un servidor MySQL 8 y un entorno de ejecución Deno actualizado.
- Disponibilidad de un proveedor LLM compatible con el estándar Model Context Protocol (MCP).
- La información inicial de catálogo maestro será cargada por el cliente antes del despliegue en producción.

### 2.6 Evolución Previsible del Sistema

- Integración con facturación electrónica directa ante la DIAN mediante proveedor tecnológico autorizado.
- Módulo predictivo de demanda y sugerencias de reabastecimiento asistido por machine learning.
- Aplicativo móvil progresivo (PWA) para toma física de inventario mediante lectura óptica de códigos de barras.
- Soporte para arquitectura multiempresa (multi-tenant) y ampliación de Tools MCP de análisis financiero avanzado.

---

## 3. Requisitos Específicos

### MÓDULO 1: SEGURIDAD Y AUTENTICACIÓN

#### Bloque A – Interfaz del formulario (Login)

| ID | Nombre de Requisito | Descripción | Tipo | Fuente / Rol | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-SA-A1** | Login con JWT y generar Cookies | El usuario podrá autenticarse con sus credenciales de forma segura y cifrada, recibiendo tokens de sesión almacenados en cookies seguras. | Autenticación | Todos los roles | Alta/Esencial |
| **RF-SA-A2** | Campo de correo electrónico | El sistema debe mostrar un campo de texto para ingresar el correo electrónico, con placeholder indicativo y validación de sintaxis. | Autenticación | Todos los roles | Alta/Esencial |
| **RF-SA-A2b** | Campo de contraseña | El sistema debe mostrar un campo de tipo contraseña que oculte los caracteres ingresados por defecto. | Autenticación | Todos los roles | Alta/Esencial |
| **RF-SA-A3** | Botón mostrar/ocultar contraseña | El sistema debe permitir alternar la visibilidad de la contraseña mediante un ícono interactivo junto al campo. | Autenticación | Todos los roles | Alta/Esencial |
| **RF-SA-A4** | Botón de envío del formulario | El sistema debe mostrar un botón 'Iniciar sesión' que envíe la solicitud de autenticación al backend vía HTTPS. | Autenticación | Todos los roles | Alta/Esencial |
| **RF-SA-A5** | Deshabilitar botón mientras se procesa | El sistema debe deshabilitar el botón de envío mientras la solicitud de autenticación esté en curso, para evitar envíos duplicados. | Autenticación | Todos los roles | Media/Deseado |
| **RF-SA-A6** | Indicador de carga (spinner) | El sistema debe mostrar un indicador visual de carga mientras se espera la respuesta del servidor. | Autenticación | Todos los roles | Media/Deseado |

#### Bloque B – Validaciones en el cliente

| ID | Nombre de Requisito | Descripción | Tipo | Fuente / Rol | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-SA-B1** | Validación de campo correo vacío | El sistema debe impedir el envío del formulario si el campo correo está vacío, mostrando un mensaje de advertencia debajo del campo. | Validación de datos | Frontend | Alta/Esencial |
| **RF-SA-B2** | Validación de campo contraseña vacío | El sistema debe impedir el envío del formulario si el campo contraseña está vacío, mostrando un mensaje debajo del campo. | Validación de datos | Frontend | Alta/Esencial |
| **RF-SA-B2b** | Validación de formato de correo | El sistema debe validar que el texto ingresado en correo cumpla el formato estándar usuario@dominio antes de habilitar el envío. | Validación de datos | Frontend | Alta/Esencial |
| **RF-SA-B3** | Validación de longitud mínima de contraseña | El sistema debe validar que la contraseña ingresada tenga al menos 8 caracteres antes de enviar la solicitud al servidor. | Validación de datos | Frontend | Alta/Esencial |
| **RF-SA-B4** | Limpieza de mensajes de error al corregir | El sistema debe ocultar el mensaje de error de un campo en cuanto el usuario empiece a editar o corregir el dato. | Interfaz de usuario (UI) | Frontend | Baja/Opcional |

#### Bloque C – Autenticación en el backend

| ID | Nombre de Requisito | Descripción | Tipo | Fuente / Rol | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-SA-C1** | Recepción de credenciales en el backend | El backend debe exponer un endpoint seguro (POST /auth/login) que reciba correo y contraseña en el cuerpo de la solicitud mediante HTTPS. | Autenticación | Backend API | Alta/Esencial |
| **RF-SA-C2** | Búsqueda del usuario por correo | El sistema debe buscar en la base de datos un usuario activo cuyo correo electrónico coincida de forma exacta con el ingresado. | Autenticación | Backend Core | Alta/Esencial |
| **RF-SA-C3** | Verificación de hash de contraseña | El sistema debe verificar la contraseña ingresada contra el hash almacenado utilizando el algoritmo criptográfico seguro Argon2id. | Autenticación / Seguridad | Backend Core | Alta/Esencial |
| **RF-SA-C4** | Verificación de estado de la cuenta (activa/inactiva) | El sistema debe rechazar el acceso si la cuenta del usuario está marcada como inactiva (is_active = 0), aunque la contraseña sea correcta. | Autenticación | Backend Core | Alta/Esencial |
| **RF-SA-C4b** | Rechazo por usuario inexistente | Si el correo no existe en la base de datos, el sistema debe rechazar el acceso emitiendo un mensaje genérico sin indicar que el correo no está registrado. | Seguridad | Backend Core | Alta/Esencial |
| **RF-SA-C5** | Rechazo por contraseña incorrecta | Si la contraseña no coincide con el hash almacenado, el sistema debe rechazar el acceso con un mensaje genérico sin dar pistas del motivo exacto del fallo. | Seguridad | Backend Core | Alta/Esencial |

#### Bloque D – Token y sesión

| ID | Nombre de Requisito | Descripción | Tipo | Fuente / Rol | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-SA-D1** | Generación del token JWT | Si las credenciales son válidas, el sistema debe generar un token de acceso JWT firmado criptográficamente con una clave secreta del servidor. | Autenticación | Backend Platform | Alta/Esencial |
| **RF-SA-D2** | Inclusión del ID de usuario en el payload | El token JWT generado debe incluir en su claim estándar 'sub' el identificador único UUID del usuario. | Autenticación | Backend Platform | Alta/Esencial |
| **RF-SA-D3** | Inclusión del rol en el payload | El token JWT generado debe incluir el identificador del rol asignado para su verificación posterior en las políticas de autorización RBAC. | Autenticación / RBAC | Backend Platform | Alta/Esencial |
| **RF-SA-D4** | Resolución de sucursal y alcance operativo | El sistema debe resolver dinámicamente la sucursal o bodegas autorizadas del usuario mediante el caso de uso ResolverAlcanceSucursalUseCase y la persistencia multisede (usuario_sucursales), desacoplando la sesión de cambios de sede sin requerir regenerar el token. | Autenticación / RBAC | Backend Core | Alta/Esencial |
| **RF-SA-D5** | Inclusión de JSON de respuesta | El servidor incluirá en el cuerpo de respuesta al login exitoso un objeto JSON con los datos del usuario, su rol y la lista de códigos de permisos asignados. | Autenticación | Backend API | Alta/Esencial |
| **RF-SA-D6** | Definición del tiempo de expiración del token | El token de acceso JWT tendrá una vigencia corta configurada de 15 minutos, complementado por un Refresh Token rotativo de 7 días. | Autenticación | Backend Platform | Alta/Esencial |
| **RF-SA-D7** | Entrega del token en cookie httpOnly | El sistema debe enviar el token de sesión dentro de una cookie HTTP con el atributo httpOnly activado, impidiendo su lectura desde scripts de cliente. | Seguridad | Backend API | Alta/Esencial |
| **RF-SA-D8** | Atributo secure en la cookie | La cookie de sesión debe llevar el atributo secure, transmitiéndose exclusivamente sobre canales cifrados HTTPS. | Seguridad | Backend API | Alta/Esencial |
| **RF-SA-D9** | Atributo SameSite en la cookie | La cookie de sesión debe configurarse con el atributo SameSite (Lax/Strict) para mitigar vectores de ataque CSRF. | Seguridad | Backend API | Alta/Esencial |
| **RF-SA-D10** | Invalidación del token al expirar | El sistema debe rechazar automáticamente cualquier solicitud que presente un token cuya fecha de vigencia haya expirado. | Autenticación | Backend Platform | Alta/Esencial |
| **RF-SA-D11** | Invalidación de token ante cambios de usuario | Si un SuperAdmin modifica el rol, sucursales asignadas o estado de un usuario, el campo tokens_invalidados_en en la BD debe actualizarse, revocando de inmediato los tokens emitidos previamente. | Seguridad | Backend Core | Alta/Esencial |
| **RF-SA-D12** | Segundo factor de autenticación (2FA TOTP) para SuperAdmin | El sistema debe ofrecer como opción configurable autenticación de doble factor basada en códigos temporales TOTP (app de autenticación) para el rol SuperAdmin. | Autenticación / Seguridad | Super Admin | Alta/Esencial |

#### Bloque E – Control de acceso y redirección

| ID | Nombre de Requisito | Descripción | Tipo | Fuente / Rol | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-SA-E1** | Middleware de verificación de token | El backend debe validar la firma, vigencia y no-revocación del token en cada solicitud a una ruta protegida antes de procesar el controlador. | Autenticación | Backend API | Alta/Esencial |
| **RF-SA-E2** | Respuesta 401 por token ausente | El sistema responderá con código HTTP 401 Unauthorized cuando una solicitud a una ruta protegida no incluya credenciales válidas. | Autenticación | Backend API | Alta/Esencial |
| **RF-SA-E3** | Respuesta 401 por token inválido o alterado | El sistema responderá con código HTTP 401 cuando el token presente firmas corruptas, manipuladas o no verificables. | Autenticación | Backend API | Alta/Esencial |
| **RF-SA-E4** | Verificación de permisos según rol (RBAC) | El sistema debe comprobar que el usuario autenticado cuente con el permiso granular requerido para la acción solicitada antes de autorizarla. | Autorización / RBAC | Backend Core | Alta/Esencial |
| **RF-SA-E5** | Respuesta 403 por rol/permiso insuficiente | El sistema responderá con código HTTP 403 Forbidden cuando el usuario autenticado carezca del permiso necesario para la operación. | Autorización | Backend API | Alta/Esencial |
| **RF-SA-E6** | Redirección a panel según rol | Tras un login exitoso, la interfaz web debe redirigir al usuario automáticamente al panel principal correspondiente a su perfil de trabajo. | Interfaz de usuario | Frontend | Alta/Esencial |
| **RF-SA-E7** | Abstracción de autorización compartida | La lógica de permisos debe residir en una abstracción compartida (IValidarPermisoUseCase / IAuthorizationPolicy) inyectada tanto en los middlewares HTTP como en el Gateway de Tools de MCP. | Arquitectura | Backend Core | Alta/Esencial |

#### Bloque F – Seguridad adicional

| ID | Nombre de Requisito | Descripción | Tipo | Fuente / Rol | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-SA-F1** | Límite de intentos fallidos por cuenta | El sistema debe registrar y contabilizar los intentos fallidos de inicio de sesión por cuenta en una ventana deslizante de 5 minutos. | Seguridad | Backend Core | Media/Deseado |
| **RF-SA-F2** | Bloqueo temporal tras exceder intentos | El sistema debe bloquear temporalmente el acceso a la cuenta durante 5 minutos si se acumulan 5 intentos fallidos consecutivos. | Seguridad | Backend Core | Alta/Esencial |
| **RF-SA-F3** | Límite de intentos fallidos por dirección IP | El sistema debe contabilizar y limitar a 20 los intentos fallidos provenientes de una misma IP en una ventana de 15 minutos, respondiendo con HTTP 429. | Seguridad | Backend Core | Alta/Esencial |
| **RF-SA-F4** | Registro de intentos exitosos (log) | El sistema debe registrar en la tabla intentos_login cada acceso exitoso indicando email, dirección IP y fecha/hora exacta. | Auditoría | Backend Database | Alta/Esencial |
| **RF-SA-F5** | Registro de intentos fallidos (log) | El sistema debe registrar en la tabla intentos_login cada acceso fallido indicando el correo ingresado, la dirección IP y la estampa temporal. | Auditoría | Backend Database | Alta/Esencial |
| **RF-SA-F6** | Cifrado de contraseñas almacenadas | Las contraseñas deben persistirse exclusivamente en forma de hash seguro generado con Argon2id con salt aleatorio; nunca en texto plano. | Seguridad | Backend Database | Alta/Esencial |
| **RF-SA-F7** | Mensajes de error genéricos | Todo mensaje de error en autenticación debe ser genérico ('credenciales incorrectas'), sin dar indicios sobre si el correo existe o si la clave fue la errónea. | Seguridad | Backend API | Alta/Esencial |

#### Bloque G – Funciones complementarias de sesión

| ID | Nombre de Requisito | Descripción | Tipo | Fuente / Rol | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-SA-G1** | Cierre de sesión (logout) | El sistema debe permitir cerrar sesión eliminando la cookie de autenticación del cliente y revocando el Refresh Token en la base de datos. | Autenticación | Todos los roles | Alta/Esencial |
| **RF-SA-G2** | Renovación de token (refresh token rotativo) | El sistema debe permitir emitir un nuevo Access Token mediante un Refresh Token vigente, invalidando el Refresh Token previo y emitiendo uno nuevo. | Autenticación | Backend Core | Media/Deseado |
| **RF-SA-G3** | Expiración del refresh token | El refresh token tendrá una duración máxima de 7 días con fecha de expiración explícita almacenada en la base de datos. | Autenticación | Backend Database | Media/Deseado |
| **RF-SA-G4** | Opción 'recordarme' | El sistema ofrecerá una opción para extender la duración de la sesión del usuario en dispositivos de confianza. | Autenticación | Frontend / API | Media/Deseado |
| **RF-SA-G5** | Cierre automático por inactividad | El sistema cerrará la sesión de forma automática si no se detecta actividad del usuario durante un período predefinido. | Seguridad | Frontend / API | Media/Deseado |

#### Bloque H – Recuperación de contraseña

| ID | Nombre de Requisito | Descripción | Tipo | Fuente / Rol | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-SA-H1** | Solicitud de recuperación de contraseña | El sistema debe permitir solicitar el restablecimiento de contraseña ingresando el correo registrado en la plataforma. | Autenticación | Todos los roles | Alta/Esencial |
| **RF-SA-H2** | Límite de solicitudes de recuperación | El sistema debe aplicar limitación de tasa (rate limiting) a las solicitudes de recuperación por IP y por correo para prevenir spam y enumeración. | Seguridad | Backend API | Media/Deseado |
| **RF-SA-H3** | Envío de enlace de recuperación por correo | El sistema despachará al correo del usuario un enlace con un token criptográfico unívoco para el cambio seguro de credenciales. | Autenticación | Backend Platform | Alta/Esencial |
| **RF-SA-H4** | Expiración del enlace de recuperación | El enlace de recuperación debe invalidarse tras 30 minutos de su emisión o de forma inmediata tras su primer uso exitoso. | Seguridad | Backend Database | Alta/Esencial |
| **RF-SA-H5** | Formulario de nueva contraseña | El sistema debe desplegar una pantalla dedicada para capturar y confirmar la nueva contraseña tras acceder desde el enlace válido. | Interfaz de usuario | Frontend | Alta/Esencial |
| **RF-SA-H6** | Validación de coincidencia de contraseñas | El sistema debe comprobar que la contraseña nueva y su confirmación coincidan y cumplan las políticas de longitud antes de persistir el hash. | Validación de datos | Frontend / Core | Alta/Esencial |

#### Bloque I – Seguridad del servidor MCP (RBAC de las Tools del chatbot)

| ID | Nombre de Requisito | Descripción | Tipo | Fuente / Rol | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-SA-I1** | Catálogo de Tools filtrado por rol | El endpoint tools/list del servidor MCP debe exponer únicamente el subconjunto de herramientas autorizadas para el rol del usuario autenticado. | Servidor MCP / RBAC | Servidor MCP | Alta/Esencial |
| **RF-SA-I2** | Autorización delegada al Caso de Uso | Las Tools del servidor MCP no contendrán reglas de negocio ni autorización propia; delegarán al Tool Gateway y a los Casos de Uso del Core. | Arquitectura / MCP | Servidor MCP | Alta/Esencial |
| **RF-SA-I3** | Restricción de Tools financieras a SuperAdmin | Toda Tool que exponga márgenes de ganancia o métricas consolidadas estará restringida exclusivamente al rol SuperAdmin. | Seguridad MCP | Servidor MCP | Alta/Esencial |
| **RF-SA-I4** | Alcance de sucursal en las Tools del Administrador | Las Tools invocadas por Administradores de Almacén o Cajeros filtrarán datos según la sucursal del token, ignorando parámetros del LLM. | Seguridad MCP | Servidor MCP | Alta/Esencial |
| **RF-SA-I5** | Tools de solo lectura para Cajero y Vendedor | Los roles Cajero y Vendedor solo tendrán acceso a Tools catalogadas como de solo lectura en el servidor MCP. | Seguridad MCP | Servidor MCP | Alta/Esencial |
| **RF-SA-I6** | Rechazo temprano de Tools no autorizadas (fail-fast) | El componente Tool Gateway validará permisos antes de transferir la ejecución al Caso de Uso, evitando efectos secundarios. | Arquitectura MCP | Servidor MCP | Alta/Esencial |
| **RF-SA-I7** | Propagación de la identidad del login al servidor MCP | El servidor MCP utilizará el mismo token JWT de la sesión web para validar usuario, rol y permisos en tiempo real. | Autenticación MCP | Servidor MCP | Alta/Esencial |
| **RF-SA-I8** | Prohibición de exposición de esquema o SQL crudo | Las Tools retornarán DTOs procesados por el Core; queda prohibido exponer consultas SQL o esquemas Drizzle al modelo de IA. | Seguridad MCP | Servidor MCP | Alta/Esencial |
| **RF-SA-I9** | Auditoría de invocación de Tools | El sistema debe registrar cada invocación de Tool (usuario, rol, parámetros, resultado o denegación) en la tabla logs_mcp_tools. | Auditoría MCP | Servidor MCP | Alta/Esencial |
| **RF-SA-I10** | Validación de parámetros contra manipulación por el modelo | Los parámetros construidos por el LLM se validarán estrictamente con esquemas Zod antes de alcanzar la capa de aplicación. | Seguridad MCP | Servidor MCP | Alta/Esencial |
| **RF-SA-I11** | Invalidación de la sesión conversacional junto con la sesión web | El cierre de sesión o expiración del token en la aplicación web invalidará inmediatamente la sesión del chatbot. | Sesión MCP | Servidor MCP | Alta/Esencial |
| **RF-SA-I12** | Mensajes de denegación genéricos en el chatbot | Si una Tool es rechazada por falta de permisos, el chatbot responderá con mensajes neutros sin revelar detalles técnicos de la plataforma. | Seguridad MCP | Servidor MCP | Alta/Esencial |

---

### MÓDULO 2: ADMINISTRACIÓN Y CONTROL

#### Bloque A – Dashboard y analítica

| ID | Nombre de Requisito | Descripción | Tipo | Fuente / Rol | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-ADM-A1** | Panel de métricas globales de ganancias | El sistema debe mostrar en el dashboard principal un resumen de las ganancias totales acumuladas, ingresos brutos y márgenes consolidados. | Requisito analítico | Super Admin | Alta/Esencial |
| **RF-ADM-A2** | Gráfico de tendencias de ventas | El sistema debe presentar un gráfico cronológico de tendencias de ventas con agrupación diaria, semanal o mensual. | Requisito analítico | Super Admin / Admin Sucursal | Alta/Esencial |
| **RF-ADM-A3** | Comparativo de rendimiento entre sucursales | El sistema debe mostrar gráficos y tablas comparativas del volumen de ventas y transacciones entre las distintas sedes. | Requisito analítico | Super Admin | Media/Deseado |
| **RF-ADM-A4** | Indicador de producto más vendido a nivel global | El sistema debe identificar y mostrar el producto con mayor rotación comercial considerando todas las sucursales. | Requisito analítico | Super Admin / Admin Almacén | Media/Deseado |
| **RF-ADM-A5** | Indicador de producto menos vendido a nivel global | El sistema debe identificar y mostrar el producto con menor rotación comercial considerando todas las sucursales. | Requisito analítico | Super Admin / Admin Almacén | Media/Deseado |
| **RF-ADM-A6** | Alertas de agotamiento de stock | El sistema debe listar en el dashboard los productos cuyas existencias sean iguales o inferiores al stock mínimo, clasificados por sucursal. | Requisito operativo | Super Admin / Admin Almacén | Alta/Esencial |

#### Bloque B – Gestión de inventario y catálogo

| ID | Nombre de Requisito | Descripción | Tipo | Fuente / Rol | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-ADM-B1** | Creación de producto | El sistema debe permitir registrar un nuevo producto con SKU único, nombre, categoría, proveedor, precio de compra y precio de venta. | Requisito funcional | Admin Almacén / Super Admin | Alta/Esencial |
| **RF-ADM-B2** | Edición de producto existente y registro de cambios de precio | El sistema debe permitir editar productos existentes registrando en auditoría cualquier variación histórica de precios de compra o venta. | Requisito funcional | Admin Almacén / Super Admin | Alta/Esencial |
| **RF-ADM-B3** | Activación/inactivación de producto | El sistema debe permitir la inactivación lógica (is_active = 0) de un producto, ocultándolo de ventas pero preservando su histórico. | Requisito funcional | Admin Almacén / Super Admin | Alta/Esencial |
| **RF-ADM-B4** | Listado y búsqueda de productos con filtros | El sistema debe permitir consultar productos con filtros combinados por categoría, proveedor, estado y umbral de existencias. | Requisito funcional | Admin Almacén / Super Admin | Alta/Esencial |
| **RF-ADM-B5** | Gestión de categorías de producto | El sistema debe permitir crear, editar, listar y cambiar de estado las categorías taxonómicas del catálogo. | Requisito funcional | Admin Almacén / Super Admin | Media/Deseado |
| **RF-ADM-B6** | Gestión de proveedores | El sistema debe permitir registrar, editar e inactivar información comercial y de contacto de proveedores. | Requisito funcional | Admin Almacén / Super Admin | Media/Deseado |
| **RF-ADM-B7** | Registro de entradas de mercancía | El sistema debe permitir registrar entradas de inventario por compras asociadas a proveedor, incrementando automáticamente el kardex y stock. | Requisito funcional | Admin Almacén | Alta/Esencial |
| **RF-ADM-B8** | Registro de salidas manuales de mercancía | El sistema debe permitir registrar salidas manuales por merma, daño o ajuste con motivo obligatorio, reduciendo existencias en kardex. | Requisito funcional | Super Admin / Admin Almacén | Media/Deseado |
| **RF-ADM-B9** | Validación de stock no negativo | El sistema debe forzar mediante triggers y restricciones de base de datos que ninguna salida deje existencias bajo cero. | Integridad de datos | Backend Database | Alta/Esencial |
| **RF-ADM-B10** | Historial de movimientos de inventario (kardex) | El sistema debe presentar la trazabilidad cronológica inmutable de todas las entradas, salidas y ajustes de stock por ítem y sucursal. | Auditoría / Inventario | Admin Almacén / Super Admin | Media/Deseado |
| **RF-ADM-B11** | Configuración de stock mínimo por producto por sucursal | El sistema debe permitir definir umbrales de stock mínimo específicos para cada producto en cada sede para disparar alertas de abastecimiento. | Requisito operativo | Admin Almacén / Super Admin | Media/Deseado |
| **RF-ADM-B12** | Unicidad del SKU | El sistema debe validar que el SKU de cada producto sea único en el catálogo, rechazando el registro o edición de un producto cuyo SKU ya exista y mostrando un mensaje que indique el conflicto. | Integridad de datos | Admin Almacén / Super Admin | Alta/Esencial |
| **RF-ADM-B13** | Validación de precios del producto | El sistema debe validar que los precios de compra y de venta sean valores numéricos mayores que cero, y advertir al usuario, sin impedir el guardado, cuando el precio de venta sea inferior al de compra. | Validación de datos | Admin Almacén / Super Admin | Media/Deseado |
| **RF-ADM-B14** | Consulta del historial de precios | El sistema debe permitir consultar, por producto, el historial de cambios de precio de compra y de venta (RF-ADM-B2), mostrando el valor anterior, el valor nuevo, la fecha, la hora y el usuario responsable. | Auditoría / Inventario | Admin Almacén / Super Admin | Media/Deseado |
| **RF-ADM-B15** | Listado de entradas de mercancía | El sistema debe mostrar el listado de entradas de mercancía registradas (RF-ADM-B7), filtrable por proveedor, producto y rango de fechas, con acceso al detalle de cada entrada. | Consulta / Inventario | Admin Almacén / Super Admin | Media/Deseado |
| **RF-ADM-B16** | Anulación de entradas de mercancía | El sistema debe permitir anular una entrada de mercancía registrada por error con motivo obligatorio, revirtiendo el stock ingresado y rechazando la anulación si deja existencias negativas (RF-ADM-B9). | Gestión de inventario | Super Admin | Media/Deseado |
| **RF-ADM-B17** | Ajuste de inventario por conteo físico | El sistema debe permitir registrar el resultado de un conteo físico por producto, calculando la diferencia frente al stock del sistema y generando un movimiento de ajuste con motivo obligatorio en kardex. | Gestión de inventario | Admin Almacén / Super Admin | Media/Deseado |
| **RF-ADM-B18** | Transferencia de mercancía entre sucursales | El sistema debe permitir registrar el traslado de unidades de un producto desde una sucursal origen hacia una destino, descontando en origen y sumando en destino en una sola operación atómica sin saldos negativos. | Logística / Sucursales | Super Admin | Media/Deseado |
| **RF-ADM-B19** | Restricción de inactivación de categorías y proveedores con productos activos | El sistema debe impedir la inactivación de una categoría o proveedor (RF-ADM-B5, RF-ADM-B6) que tenga productos activos asociados, solicitando reasignar o inactivar previamente dichos productos. | Integridad de catálogo | Admin Almacén / Super Admin | Media/Deseado |
| **RF-ADM-B20** | Importación masiva de productos | El sistema debe permitir cargar productos desde un archivo CSV o Excel, validando cada fila bajo las reglas de catálogo maestro y entregando un reporte de filas cargadas y rechazadas con su motivo. | Operaciones masivas | Admin Almacén / Super Admin | Baja/Opcional |
| **RF-ADM-B21** | Exportación de inventario y kardex | El sistema debe permitir exportar a Excel o CSV el listado de productos (RF-ADM-B4) y el historial de movimientos kardex (RF-ADM-B10), respetando filtros aplicados y alcance de sede. | Exportación / Reportes | Admin Almacén / Super Admin | Baja/Opcional |

#### Bloque C – Gestión de personal, sucursales, áreas y salarios

| ID | Nombre de Requisito | Descripción | Tipo | Fuente / Rol | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-ADM-C1** | Listado de sucursales registradas | El sistema debe listar las sedes operativas activas e inactivas registradas, visible para SuperAdmin. | Requisito funcional | Super Admin | Alta/Esencial |
| **RF-ADM-C2** | Registro de nueva sucursal | El sistema debe permitir dar de alta nuevas sucursales operativas con nombre, dirección física y datos de contacto. | Requisito funcional | Super Admin | Media/Deseado |
| **RF-ADM-C3** | Edición de datos de sucursal | El sistema debe permitir modificar los datos comerciales, de ubicación y estado operativo de una sucursal existente. | Requisito funcional | Super Admin | Media/Deseado |
| **RF-ADM-C4** | Vista comparativa de inventario entre sucursales | El sistema debe permitir comparar en una sola vista los niveles de existencias de un mismo SKU a lo largo de las distintas sedes. | Requisito analítico | Super Admin | Baja/Opcional |
| **RF-ADM-C5** | Listado de usuarios con filtro por rol y sucursal | El sistema debe presentar el directorio de cuentas de usuario con filtros combinables por perfil de rol y sede de operación. | Requisito funcional | Super Admin | Alta/Esencial |
| **RF-ADM-C6** | Creación de nuevo usuario y empleado atómico | El sistema debe permitir registrar atómicamente la ficha de empleado y su correspondiente cuenta de usuario con credenciales seguras. | Requisito funcional | Super Admin | Alta/Esencial |
| **RF-ADM-C7** | Asignación o cambio de rol a un usuario | El sistema debe permitir reasignar privilegios y roles de acceso (SuperAdmin, Admin Sucursal, Cajero, Vendedor B2B) protegiendo al último SuperAdmin. | Requisito funcional | Super Admin | Alta/Esencial |
| **RF-ADM-C8** | Activación/desactivación de cuentas de usuario | El sistema debe permitir bloquear o reactivar preventivamente el acceso de un usuario revocando sus sesiones activas. | Requisito funcional | Super Admin | Alta/Esencial |
| **RF-ADM-C9** | Restablecimiento de contraseña por el SuperAdmin | El sistema debe permitir al SuperAdmin restablecer administrativamente la clave de un colaborador forzando el reinicio de credenciales. | Requisito funcional | Super Admin | Media/Deseado |
| **RF-ADM-C10** | Asignación de usuario a una o varias sucursales (Multisede) | El sistema debe permitir delimitar el ámbito operativo de un usuario vinculándolo a una o múltiples sedes en la tabla usuario_sucursales. | Requisito funcional | Super Admin | Media/Deseado |
| **RF-ADM-C11** | Auditoría de logs del sistema | El sistema debe ofrecer un visor inmutable de eventos críticos (creaciones, modificaciones, bajas, accesos) filtrable por fecha y actor. | Auditoría | Super Admin | Alta/Esencial |
| **RF-ADM-C12** | Gestión y edición independiente de datos de empleados | El sistema debe permitir consultar y editar la información demográfica, contractual, cargo y área de los empleados de forma independiente a la cuenta de usuario. | Personal | Super Admin | Alta/Esencial |
| **RF-ADM-C13** | Gestión de áreas organizativas por sucursal | El sistema debe permitir crear, editar, listar y eliminar áreas organizativas (ej. Bodega, Mostrador) dentro de cada sede para estructurar el personal y la logística. | Organización | Super Admin | Media/Deseado |
| **RF-ADM-C14** | Historial de salarios y registro de aumentos | El sistema debe permitir registrar aumentos salariales con motivo y fecha efectiva, manteniendo una bitácora inmutable en historial_salarios y actualizando el sueldo actual del empleado. | Personal / Salarios | Super Admin | Media/Deseado |
| **RF-ADM-C15** | Gestión y atención de alertas administrativas | El sistema debe centralizar el registro, listado y actualización de estado (pendiente, visto, atendido) de requerimientos operativos y alertas reportadas a la dirección. | Administración | Super Admin | Alta/Esencial |
| **RF-ADM-C16** | Búsqueda de usuarios por nombre o correo | El sistema debe permitir buscar usuarios por nombre o correo electrónico dentro del listado (RF-ADM-C5), combinable con los filtros de rol y sucursal. | Consulta / Usuarios | Super Admin | Media/Deseado |
| **RF-ADM-C17** | Inactivación de sucursales | El sistema debe permitir inactivar una sucursal en lugar de eliminarla físicamente, conservando su historial de ventas e inventario, rechazando la baja mientras tenga usuarios activos asignados. | Gestión de sedes | Super Admin | Media/Deseado |
| **RF-ADM-C18** | Ficha de detalle de sucursal | El sistema debe mostrar, para cada sucursal, una ficha con sus datos de contacto, los usuarios asignados, la cantidad de productos con existencias y un resumen de sus ventas recientes. | Consulta / Sedes | Super Admin | Baja/Opcional |
| **RF-ADM-C19** | Inmutabilidad de los registros de auditoría | El sistema no debe permitir modificar ni eliminar los registros de auditoría (RF-ADM-C11) desde ninguna interfaz ni rol, incluido el SuperAdmin, forzado a nivel de base de datos. | Seguridad / Auditoría | Super Admin | Alta/Esencial |
| **RF-ADM-C20** | Exportación de registros de auditoría | El sistema debe permitir al SuperAdmin exportar a Excel o CSV los registros de auditoría (RF-ADM-C11) que coincidan con los filtros de usuario, fecha y tipo de acción aplicados. | Exportación / Auditoría | Super Admin | Baja/Opcional |

---

### MÓDULO 3: FACTURACIÓN, MOSTRADOR Y CONSULTA DE INVENTARIO

#### Bloque A – Transición post-login, sesión operativa y selección de modo

| ID | Nombre de Requisito | Descripción | Tipo | Fuente / Rol | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-FMC-A1** | Verificación de Seguridad de Perfil y Token JWT | Al iniciar sesión, el sistema valida la vigencia del token y los permisos asignados antes de desplegar la pantalla de mostrador. | Funcional | Operadores POS | Alta/Esencial |
| **RF-FMC-A2** | Determinación de Modos Disponibles según Rol | El sistema muestra únicamente las vistas de trabajo (Facturación POS, Consulta B2B o ambas) autorizadas según el rol. | Funcional | Operadores POS | Alta/Esencial |
| **RF-FMC-A3** | Carga de Sucursal y Bodega de Salida | El sistema determina la sucursal del operador para acotar las existencias visibles y dirigir los descuentos de stock. | Funcional | Operadores POS | Alta/Esencial |
| **RF-FMC-A4** | Apertura de Turno / Caja Chica (solo Cajero) | El cajero debe declarar y registrar el fondo inicial de efectivo previo a habilitar la emisión de facturas en el mostrador. | Funcional | Cajero | Alta/Esencial |
| **RF-FMC-A5** | Registro Contable de Apertura de Turno | El monto de apertura queda asentado como saldo base para contrastar con las ventas al momento del arqueo de cierre. | Funcional | Cajero | Alta/Esencial |
| **RF-FMC-A6** | Delimitación operativa entre roles Cajero y Vendedor B2B | El rol Vendedor B2B está facultado para emitir facturación comercial a crédito corporativo sin requerir turno de caja físico, manteniendo el cobro en efectivo y turnos restringidos al Cajero. | Funcional / RBAC | Cajero / Vendedor B2B | Alta/Esencial |
| **RF-FMC-A7** | Verificación de Estado del Servidor / Conectividad | El sistema verifica el estado de enlace con el servidor; ante contingencias de red, degrada el modo a solo lectura con última información en caché. | Funcional | Operadores POS | Media/Deseado |
| **RF-FMC-A8** | Pantalla de Carga con Contexto Operativo | Se despliega una pantalla de transición con estado mientras se inicializa el contexto de trabajo de la sede. | Funcional | Operadores POS | Media/Deseado |
| **RF-FMC-A9** | Cierre de turno de caja y arqueo de efectivo | El sistema debe permitir al cajero cerrar su turno registrando el conteo físico de efectivo (arqueo ciego) y calculando automáticamente sobrantes o faltantes. | Funcional | Cajero | Alta/Esencial |
| **RF-FMC-A10** | Consulta del turno de caja activo | El sistema debe permitir consultar en cualquier momento los datos del turno de caja activo del operador para validar su estado antes de cobros. | Funcional | Cajero | Alta/Esencial |

#### Bloque B – Interfaz de facturación y mostrador

| ID | Nombre de Requisito | Descripción | Tipo | Fuente / Rol | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-FMC-B1** | Selector de Modo (Pestañas de Cabecera) | Permite alternar ágilmente entre 'Facturación' y 'Consulta B2B' sin recargar la página, conservando los ítems de la venta activa. | Funcional | Operadores POS | Alta/Esencial |
| **RF-FMC-B2** | Header Operativo con Estado de Caja | Presenta información en tiempo real de operador, sucursal, estado de enlace y condición de apertura de caja. | Funcional | Operadores POS | Alta/Esencial |
| **RF-FMC-B3** | Búsqueda de Productos por Barcode/SKU o Catálogo | Permite incorporar productos a la venta mediante pistola lectora de código de barras o búsqueda textual por nombre o SKU. | Funcional | Operadores POS | Alta/Esencial |
| **RF-FMC-B4** | Botón '+ Nuevo Cliente' | Despliega un modal para registrar un nuevo cliente sin interrumpir ni reiniciar el borrador de la factura en preparación. | Funcional | Operadores POS | Alta/Esencial |
| **RF-FMC-B5** | Validación de Campos Fiscales del Nuevo Cliente | Verifica la estructura válida de documento (CC, NIT, RUT) y correo; exige obligatoriamente dirección y teléfono para cuentas B2B. | Funcional | Operadores POS | Alta/Esencial |
| **RF-FMC-B6** | Panel de Factura — Tabla de Ítems | Grilla editable que lista los productos seleccionados permitiendo modificar cantidades y descuentos en línea. | Funcional | Operadores POS | Alta/Esencial |
| **RF-FMC-B7** | Registro y Asignación Inmediata del Cliente a la Factura | Al crear un cliente, queda vinculado automáticamente a la cabecera de la factura activa. | Funcional | Operadores POS | Alta/Esencial |
| **RF-FMC-B8** | Cálculo de Subtotal, IVA y Total | El sistema recalcula reactivamente subtotal, impuesto (IVA) y total consolidado ante cada variación de productos o cantidades. | Funcional | Operadores POS | Alta/Esencial |
| **RF-FMC-B9** | Visualización de Stock por Bodega Asignada | El catálogo de mostrador delimita las existencias exclusivamente al inventario disponible en la bodega local. | Funcional | Operadores POS | Media/Deseado |
| **RF-FMC-B11** | Estado Vacío del Panel de Factura | Muestra un estado visual ilustrativo mientras no se agreguen artículos, deshabilitando botones de cobro preventivamente. | Funcional | Operadores POS | Alta/Esencial |
| **RF-FMC-B12** | Contador de Ítems y Unidades | Muestra en tiempo real el conteo desagregado de líneas de productos y total de unidades físicas incorporadas en la factura. | Funcional | Operadores POS | Alta/Esencial |
| **RF-FMC-B13** | Facturación y emisión B2B sin exigencia de turno físico | El sistema permite a usuarios autorizados emitir facturas a clientes corporativos B2B a crédito sin exigir turno de caja de mostrador. | Funcional / B2B | Vendedor B2B / Cajero | Alta/Esencial |

#### Bloque C – Modo consulta de inventario

| ID | Nombre de Requisito | Descripción | Tipo | Fuente / Rol | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-FMC-C1** | Vista de Catálogo Expandido Multi-Bodega | Despliega existencias consolidadas y discriminadas por cada sucursal para asistir en ventas y cotizaciones. | Funcional | Vendedor B2B / Cajero | Alta/Esencial |
| **RF-FMC-C2** | Filtros por Categoría, Bodega y Disponibilidad | Permite filtrar simultáneamente el inventario por línea de categoría, sede física y estado de stock. | Funcional | Vendedor B2B / Cajero | Alta/Esencial |
| **RF-FMC-C3** | Indicador Visual 'Solo Lectura' en Consulta | Etiqueta visualmente el modo consulta como informativo, suprimiendo controles de edición sobre los artículos. | Funcional | Vendedor B2B / Cajero | Alta/Esencial |
| **RF-FMC-C5** | Bloqueo de Controles de Edición a Nivel de Backend | Los controladores y casos de uso invalidan cualquier mutación sobre el catálogo originada en flujos de consulta comercial. | Funcional / Seguridad | Backend Core | Alta/Esencial |
| **RF-FMC-C6** | Visualización de Precios Corporativos | Presenta las tarifas corporativas autorizadas junto con la fecha en que fueron actualizadas por última vez. | Funcional | Vendedor B2B / Cajero | Alta/Esencial |
| **RF-FMC-C7** | Exportación/Copia de Referencia para Cotización | Permite transferir ágilmente el SKU o descripción del artículo al portapapeles para herramientas externas. | Funcional | Vendedor B2B / Cajero | Media |
| **RF-FMC-C8** | Búsqueda dentro del Modo Consulta | El motor de búsqueda en consulta opera con estado desacoplado del buscador del módulo de facturación activa. | Funcional | Vendedor B2B / Cajero | Media |
| **RF-FMC-C9** | Persistencia de Filtros al Cambiar de Modo | Los filtros aplicados en el catálogo se conservan si el asesor alterna momentáneamente entre secciones. | Funcional | Vendedor B2B / Cajero | Baja/Opcional |

#### Bloque D – Directorio de clientes y filtrado por documento

| ID | Nombre de Requisito | Descripción | Tipo | Fuente / Rol | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-FMC-D1** | Botón 'Buscar Cliente' en Panel de Factura | Abre un modal modal de búsqueda sobre el directorio de terceros sin perder el progreso de la factura. | Funcional | Operadores POS | Alta/Esencial |
| **RF-FMC-D2** | Estructura del Modal de Directorio de Clientes | Incluye buscador dinámico, segmentador por tipo de documento, listado paginado y acceso a nuevo registro. | Funcional | Operadores POS | Alta/Esencial |
| **RF-FMC-D3** | Filtros por Tipo de Documento (CC / NIT / RUT) | Segmentación inmediata de terceros según naturaleza jurídica (cédula, NIT o RUT). | Funcional | Operadores POS | Alta/Esencial |
| **RF-FMC-D4** | Búsqueda por Nombre, Razón Social o Número de Documento | Motor de consulta predictiva que ubica clientes por nombre, razón social o identificación tributaria. | Funcional | Operadores POS | Alta/Esencial |
| **RF-FMC-D5** | Identificación Visual del Tipo de Cliente (B2C/B2B) | Distingue visualmente con etiquetas claras a los consumidores finales frente a clientes corporativos. | Funcional | Operadores POS | Media |
| **RF-FMC-D6** | Selección y Asignación Directa del Cliente a la Factura | Carga al tercero seleccionado en la cabecera de la factura recalculando listas de precio si aplica. | Funcional | Operadores POS | Alta/Esencial |
| **RF-FMC-D7** | Botón 'Cambiar Cliente' desde Factura en Curso | Permite sustituir al cliente previamente vinculado reabriendo el directorio unificado. | Funcional | Operadores POS | Media |
| **RF-FMC-D8** | Acceso a Registro de Cliente Nuevo desde el Directorio | Permite transicionar directamente al formulario de alta de tercero ante búsquedas sin coincidencia. | Funcional | Operadores POS | Media |
| **RF-FMC-D10** | Prevención de Duplicados por Documento | Valida unicidad de tipo y número de documento antes del registro, reutilizando el cliente si ya existe. | Funcional / Datos | Backend Core | Alta/Esencial |
| **RF-FMC-D11** | Persistencia del Directorio entre Facturas y Sesiones | El directorio de clientes opera de manera centralizada y compartida entre todos los operadores y sedes. | Funcional | Backend Database | Media |
| **RF-FMC-D12** | Actualización y edición de datos de cliente existente | Permite actualizar datos de contacto, dirección fiscal y condición de crédito corporativo de clientes ya creados. | Funcional | Operadores POS | Alta/Esencial |
| **RF-FMC-D13** | Filtros del Modo Consulta (Categoría/Bodega/Disponibilidad) | Al aplicar un filtro en el catálogo del modo consulta, la lista se actualiza sola sin afectar el uso ni la combinación de los demás filtros. | Interfaz de usuario | Vendedor B2B / Cajero | Media |

#### Bloque E – Modal de cobro, medios de pago y confirmación

| ID | Nombre de Requisito | Descripción | Tipo | Fuente / Rol | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-FMC-E1** | Estructura del Modal de Cobro | Ventana de liquidación con resumen de factura, datos fiscales, opciones de medios de pago y botones de acción. | Funcional | Operadores POS | Alta/Esencial |
| **RF-FMC-E2** | Selección de Medio de Pago | Soporta cobros en efectivo, tarjeta, transferencia bancaria y crédito corporativo (clientes B2B habilitados). | Funcional | Operadores POS | Alta/Esencial |
| **RF-FMC-E3** | Validación de Efectivo Recibido y Cálculo de Vuelto | Verifica suficiencia del efectivo entregado y calcula en tiempo real el valor a devolver al cliente. | Funcional | Operadores POS | Alta/Esencial |
| **RF-FMC-E4** | Autocompletado de Monto para Tarjeta/Transferencia | Precarga el valor total exacto pendiente al elegir formas de pago electrónicas. | Funcional | Operadores POS | Media |
| **RF-FMC-E5** | Botón 'Emitir Factura y Procesar Salida' | Ejecuta la transacción de venta bajo un Unit of Work atómico, emitiendo el comprobante y rebajando el inventario. | Funcional | Operadores POS | Alta/Esencial |
| **RF-FMC-E6** | Registro de Transacción y Actualización de Stock en Kardex | Asienta de forma inmutable la factura, los renglones, los pagos y el movimiento de salida en movimientos_inventario. | Funcional / Transaccional | Backend Core | Alta/Esencial |
| **RF-FMC-E7** | Manejo de Error en la Emisión (Rollback atómico) | Ante fallos en cualquier fase del cobro, revierte íntegramente la transacción sin alterar existencias ni comprobantes. | Fiabilidad | Backend Core | Alta/Esencial |
| **RF-FMC-E8** | Notificación de Éxito con Número de Factura | Notifica la venta exitosa indicando folio, consecutivo generado por sucursal y total cobrado. | Funcional | Operadores POS | Media |
| **RF-FMC-E9** | Reinicio del Módulo Post-Facturación | Limpia automáticamente el espacio de trabajo dejándolo preparado para la transacción siguiente. | Funcional | Operadores POS | Alta/Esencial |
| **RF-FMC-E10** | Anulación de Facturas y Reversión de Stock | Permite anular administrativamente facturas emitidas por error, reingresando de manera atómica los artículos al kardex. | Funcional / Auditoría | Super Admin / Admin Sucursal | Alta/Esencial |

#### Bloque F – Sistema de alerta urgente al administrador (Soporte de mostrador)

| ID | Nombre de Requisito | Descripción | Tipo | Fuente / Rol | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-FMC-F1** | Botón 'Alertar a Admin' (Header) | Acceso permanente en la cabecera de la aplicación para reportar incidencias inmediatas al supervisor. | Funcional | Operadores POS | Alta/Esencial |
| **RF-FMC-F2** | Estructura del Modal de Alerta | Ventana con selector de motivos predefinidos, nivel de prioridad y campo de descripción. | Funcional | Operadores POS | Alta/Esencial |
| **RF-FMC-F3** | Selección de Prioridad (Urgente/Normal) | Clasifica la severidad del reporte determinando la urgencia con la que se alerta al administrador. | Funcional | Operadores POS | Alta/Esencial |
| **RF-FMC-F4** | Campo de Descripción Condicionalmente Obligatorio | Exige la redacción obligatoria de detalles cuando el operador selecciona el motivo 'Otro'. | Funcional | Operadores POS | Media |
| **RF-FMC-F5** | Envío de la Alerta y Registro de Trazabilidad | Despacha la alerta en tiempo real y la persiste en alertas_admin con usuario, sede, motivo y fecha. | Funcional | Backend Core | Alta/Esencial |
| **RF-FMC-F6** | Notificación de Confirmación de Envío | Confirma al operador el envío exitoso del reporte permitiéndole continuar su labor sin bloqueos. | Funcional | Operadores POS | Media |
| **RF-FMC-F7** | Badge Persistente de Estado de Alerta | Notificador flotante que mantiene visible al cajero el estado de sus alertas emitidas. | Funcional | Operadores POS | Media |
| **RF-FMC-F8** | Confirmación de Lectura y Atención por el Administrador | Actualiza el estado de la alerta cuando el supervisor la revisa o la resuelve. | Funcional | Super Admin / Admin Sucursal | Media |
| **RF-FMC-F9** | Descarte Manual del Badge de Alerta | Permite al operador cerrar la notificación visual de su pantalla sin eliminar el registro histórico. | Funcional | Operadores POS | Baja/Opcional |

#### Bloque G – Comportamiento detallado de botones e interacciones

| ID | Nombre de Requisito | Descripción | Tipo | Fuente / Rol | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-FMC-G1** | Botón 'Alertar a Admin' (interacción) | Abre el formulario de alerta con la prioridad predeterminada configurada en Urgente. | Interfaz de usuario | Operadores POS | Alta/Esencial |
| **RF-FMC-G2** | Chips de Motivo (interacción) | Habilita el botón de despacho en cuanto el usuario selecciona uno de los motivos tipificados. | Interfaz de usuario | Operadores POS | Alta/Esencial |
| **RF-FMC-G3** | Selector de Prioridad (interacción) | Permite conmutar la urgencia entre Normal y Urgente sin reiniciar los datos redactados. | Interfaz de usuario | Operadores POS | Media |
| **RF-FMC-G4** | Botón 'Enviar alerta ahora' | Transmite formalmente el reporte al backend validando la completitud de los datos obligatorios. | Interfaz de usuario | Operadores POS | Alta/Esencial |

---

### MÓDULO 4: ASISTENTE CONVERSACIONAL (SERVIDOR MCP)

#### Bloque A – Consultas de inventario y catálogo

| ID | Nombre de Requisito | Descripción | Tipo | Fuente / Rol | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-MCP-A1** | Consulta de stock por producto | El asistente debe responder en lenguaje natural el stock disponible y mínimo de un producto por SKU o nombre. | Servidor MCP | Admin Almacén / Cajero | Alta/Esencial |
| **RF-MCP-A2** | Listado de productos con stock bajo | El asistente debe listar los productos con existencias en o por debajo del mínimo, filtrados por la sucursal del token. | Servidor MCP | Admin Almacén | Alta/Esencial |
| **RF-MCP-A3** | Consulta de proveedor y precio de compra | El asistente debe informar el proveedor asociado y costo vigente de compra de un artículo ante consultas autorizadas. | Servidor MCP | Admin Almacén | Media/Deseado |
| **RF-MCP-A4** | Consulta de productos por categoría | El asistente debe listar los productos pertenecientes a una categoría solicitada en lenguaje natural. | Servidor MCP | Admin Almacén | Media/Deseado |
| **RF-MCP-A5** | Historial de movimientos de un producto | El asistente debe informar las últimas entradas y salidas registradas de un SKU en un rango de fechas. | Servidor MCP | Admin Almacén | Media/Deseado |

#### Bloque B – Consultas de ventas y facturación

| ID | Nombre de Requisito | Descripción | Tipo | Fuente / Rol | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-MCP-B1** | Consulta de ventas por periodo | El asistente debe reportar ingresos y número de facturas emitidas en el día, semana o mes, acotado a la sede del usuario. | Servidor MCP | Cajero / Admin Almacén | Alta/Esencial |
| **RF-MCP-B2** | Consulta del producto más vendido | El asistente debe identificar el artículo con mayor rotación comercial en un intervalo dado para la sucursal. | Servidor MCP | Admin Almacén / Super Admin | Media/Deseado |
| **RF-MCP-B3** | Consulta del estado de una factura | El asistente debe consultar el estado, cliente y desglose de una factura a partir de su consecutivo. | Servidor MCP | Cajero / Vendedor | Media/Deseado |
| **RF-MCP-B4** | Comparativo de ventas entre sucursales | El asistente debe generar, exclusivamente para SuperAdmin, un balance comparativo de ventas entre sucursales. | Servidor MCP | Super Admin | Media/Deseado |
| **RF-MCP-B5** | Historial de compras de un cliente | El asistente debe extraer el histórico de facturación de un tercero mediante nombre, documento o teléfono. | Servidor MCP | Cajero / Vendedor | Media/Deseado |

#### Bloque C – Consultas de personal, sucursales y analítica

| ID | Nombre de Requisito | Descripción | Tipo | Fuente / Rol | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-MCP-C1** | Consulta de métricas globales de ganancias | Exclusivo para SuperAdmin: informar margen bruto y ganancias totales acumuladas de la empresa. | Servidor MCP | Super Admin | Alta/Esencial |
| **RF-MCP-C2** | Consulta de personal activo por sucursal | El asistente debe reportar la dotación y cargos de empleados activos en una sucursal determinada. | Servidor MCP | Super Admin / Admin Sucursal | Media/Deseado |
| **RF-MCP-C3** | Resumen ejecutivo del dashboard | El asistente debe generar un resumen ejecutivo de los indicadores clave acotado a la sucursal del token. | Servidor MCP | Super Admin / Admin Sucursal | Media/Deseado |
| **RF-MCP-C4** | Comparativo de rendimiento entre sedes | El asistente debe informar las sedes con mayor y menor volumen comercial en un rango temporal dado. | Servidor MCP | Super Admin | Media/Deseado |

#### Bloque D – Interacción conversacional y experiencia del asistente

| ID | Nombre de Requisito | Descripción | Tipo | Fuente / Rol | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-MCP-D1** | Aclaración ante solicitudes ambiguas | Si una solicitud carece de parámetros clave (fechas, producto, sede), el agente solicitará aclaración antes de invocar Tools. | Servidor MCP | Todos los roles | Alta/Esencial |
| **RF-MCP-D2** | Respuesta en lenguaje natural a partir de datos estructurados | El asistente debe formatear las respuestas en prosa fluida ocultando las estructuras técnicas o JSON internos devueltos por la Tool. | Servidor MCP | Todos los roles | Alta/Esencial |
| **RF-MCP-D3** | Continuidad de contexto dentro de la sesión | El asistente debe mantener el hilo conversacional durante la sesión activa permitiendo preguntas continuadas. | Servidor MCP | Todos los roles | Media/Deseado |
| **RF-MCP-D4** | Límite de tiempo de respuesta | El asistente debe responder en menos de 10 segundos; ante un timeout de Tool, notificará al usuario de manera clara y cordial. | Servidor MCP | Todos los roles | Alta/Esencial |

---

### MÓDULO 5: LOGÍSTICA Y GESTIÓN DE ACTIVOS INTERNOS

#### Bloque A – Catálogo de activos y áreas

| ID | Nombre de Requisito | Descripción | Tipo | Fuente / Rol | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-LOG-A1** | Gestión de categorías de activos | Crear, editar e inactivar familias de activos de trabajo internos (tecnología, maquinaria, dotación) independientes del inventario vendible. | Logística | Super Admin / Admin Sucursal | Media/Deseado |
| **RF-LOG-A2** | Registro de activo | Registrar activos indicando código interno, número de serie, descripción, categoría, sucursal y estado (disponible, asignado, mantenimiento, baja). | Logística | Admin Sucursal | Alta/Esencial |
| **RF-LOG-A3** | Consumo de áreas organizativas | El módulo consumirá las áreas creadas en Administración (RF-ADM-C13) para clasificar y ubicar los activos fijos dentro de la sede. | Logística | Admin Sucursal | Media/Deseado |
| **RF-LOG-A4** | Listado y búsqueda de activos con filtros | Consultar el inventario interno de activos filtrando por sucursal, categoría, área y estado operativo. | Logística | Admin Sucursal | Media/Deseado |
| **RF-LOG-A5** | Baja de un activo | Marcar activos dados de baja por deterioro, daño irreparable o pérdida, conservando su trazabilidad histórica. | Logística | Admin Sucursal | Media/Deseado |

#### Bloque B – Asignación de activos

| ID | Nombre de Requisito | Descripción | Tipo | Fuente / Rol | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-LOG-B1** | Asignación de activo a empleado | Asignar la custodia de un activo a un colaborador individual, marcándolo de inmediato como no disponible. | Logística | Admin Sucursal | Alta/Esencial |
| **RF-LOG-B2** | Asignación de activo a un área | Asignar activos al uso de un área colectiva; validación estricta de exclusividad: o a persona o a área, nunca a ambos simultáneamente. | Logística | Admin Sucursal | Media/Deseado |
| **RF-LOG-B3** | Registro de quién autoriza la asignación | Registrar en cada asignación el usuario responsable que formalizó la entrega y la fecha/hora de la misma. | Logística | Admin Sucursal | Alta/Esencial |
| **RF-LOG-B4** | Historial de asignaciones de un activo | Bitácora cronológica que muestra todos los empleados y áreas que han tenido la custodia previa y presente del elemento. | Logística | Admin Sucursal / Super Admin | Media/Deseado |
| **RF-LOG-B5** | Devolución o reasignación de un activo | Formalizar la restitución de un activo al inventario disponible o su reasignación directa a un nuevo custodio. | Logística | Admin Sucursal | Media/Deseado |

#### Bloque C – Mantenimiento y ciclo de vida de activos

| ID | Nombre de Requisito | Descripción | Tipo | Fuente / Rol | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-LOG-C1** | Registro de mantenimiento de un activo | Registrar mantenimientos preventivos o correctivos indicando proveedor técnico, costo, fecha y descripción de labores. | Logística | Admin Sucursal | Media/Deseado |
| **RF-LOG-C2** | Cambio de estado durante el mantenimiento | Conmutar automáticamente el estado a 'en mantenimiento' bloqueando nuevas asignaciones hasta la entrega técnica formal. | Logística | Admin Sucursal | Alta/Esencial |
| **RF-LOG-C3** | Historial de mantenimientos por activo | Histórico cronológico acumulado de todas las asistencias técnicas y costos asociados por cada activo. | Logística | Admin Sucursal / Super Admin | Media/Deseado |
| **RF-LOG-C4** | Consulta del activo mediante el asistente conversacional | Responder vía servidor MCP consultas en lenguaje natural sobre estado, custodio y ubicación del activo por sucursal. | Logística / MCP | Admin Sucursal / Super Admin | Media/Deseado |

---

### 3.1 Requisitos Comunes de las Interfaces

#### 3.1.1 Interfaces de Usuario

Interfaz web responsiva desarrollada en React y Next.js organizada modularmente. Menú dinámico renderizado según permisos RBAC. Asistente conversacional embebido en un drawer/panel lateral sin interrumpir el flujo operativo.

#### 3.1.2 Interfaces de Hardware

Compatibilidad universal sin hardware propietario. Integración con lectores ópticos de códigos de barras (emulación de teclado HID) e impresoras térmicas de tickets (ESC/POS).

#### 3.1.3 Interfaces de Software

Backend desarrollado en Deno con TypeScript y Drizzle ORM comunicándose con base de datos MySQL 8. Servidor MCP intermedio consumido por el agente LLM a través de la especificación Model Context Protocol.

#### 3.1.4 Interfaces de Comunicación

API REST sobre HTTPS con intercambio de datos en formato JSON. Autenticación distribuida mediante tokens JWT en cookies HttpOnly, Secure y SameSite.

### 3.2 Requisitos Funcionales Base (Resumen Global)

| Código | Requisito | Tipo | Prioridad | Descripción Resumida |
| :--- | :--- | :--- | :--- | :--- |
| **RF-01** | Gestión de productos e inventario | Funcional | Alta / Esencial | CRUD de catálogo, SKU único, validación y consulta de precios, registro de entradas, salidas, ajustes por conteo físico y transferencias evitando saldos negativos mediante el kardex. |
| **RF-02** | Facturación en punto de venta y B2B | Funcional | Alta / Esencial | Emisión de comprobantes POS en mostrador con apertura/cierre de turnos y arqueo ciego, junto con facturación comercial B2B a crédito corporativo con Unit of Work atómico. |
| **RF-03** | Gestión de personal, áreas y sucursales | Funcional | Alta / Esencial | CRUD de colaboradores, sedes, áreas organizativas, historial de salarios, auditoría inmutable y control de acceso RBAC granular multisede. |
| **RF-04** | Administración y panel de control | Funcional | Alta / Esencial | Dashboard con métricas de ventas, rentabilidad consolidada, ranking de productos y avisos de stock crítico por sede. |
| **RF-05** | Seguridad y autenticación | Funcional | Alta / Esencial | Autenticación segura JWT, Argon2id, mitigación de fuerza bruta, RBAC multisede y gestión de sesiones protegidas. |
| **RF-06** | Asistente conversacional MCP | Funcional | Alta / Esencial | Consultas en lenguaje natural apoyadas por Tools MCP parametrizadas y restringidas por sucursal y rol. |
| **RF-07** | Gestión de clientes y crédito corporativo | Funcional | Alta / Esencial | Directorio unificado de clientes B2C y corporativos B2B con validación fiscal, historial de compras, edición de datos y habilitación de crédito. |

### 3.3 Requisitos No Funcionales

- **RNF-01:** El sistema debe soportar al menos 20 usuarios concurrentes sin degradación perceptible.
- **RNF-02:** El 95% de las peticiones de inventario y facturación deben resolverse en menos de 2 segundos.
- **RNF-03:** Respuestas del asistente de IA en un tiempo máximo de 10 segundos.
- **RNF-04:** Cifrado de contraseñas mediante hashing seguro con sal utilizando Argon2id.
- **RNF-05:** Validación RBAC estricta tanto en cliente (UI) como en controlador y casos de uso (backend).
- **RNF-06:** Registro en log de auditoría inmutable de toda operación de creación, modificación o baja (usuario, fecha, hora, detalle).
- **RNF-07:** El servidor MCP solo expondrá Tools parametrizadas con validación Zod; queda prohibida la inyección o ejecución de SQL arbitrario.
- **RNF-08:** Ante caídas del servicio de IA, las funciones de facturación, inventario y personal siguen operando de forma 100% autónoma.
- **RNF-09:** Operaciones de venta ejecutadas bajo transacciones de base de datos atómicas (Unit of Work ACID) para impedir desfases entre ventas y existencias.
- **RNF-10:** Respaldos automáticos diarios de la base de datos MySQL 8 con retención de los últimos 15 días.
- **RNF-11:** Disponibilidad garantizada de al menos el 99% en horario comercial (excluyendo ventanas pactadas de soporte).
- **RNF-12:** RTO no mayor a 5 minutos ante interrupciones del servidor MCP o proveedor de IA.
- **RNF-13:** Adherencia estricta a Clean Architecture: endpoints REST y Tools MCP reutilizan el mismo caso de uso sin duplicar reglas de negocio.
- **RNF-14:** Cobertura de pruebas automatizadas mínima del 70% sobre casos de uso críticos.
- **RNF-15:** Control de versiones del esquema relacional mediante migraciones de Drizzle ORM sobre MySQL 8.
- **RNF-16:** Backend desplegable en contenedores Docker ejecutando Deno sin dependencias de un SO específico.
- **RNF-17:** Compatibilidad visual y funcional en las dos últimas versiones estables de navegadores modernos (Chrome, Firefox, Edge) en resoluciones desktop y tablet.

### 3.4 Otros Requisitos

- **RNF-18:** Cumplimiento estricto de la Ley 1581 de 2012 (Habeas Data, Colombia) para el tratamiento de datos de personas naturales y jurídicas.
- **RNF-19:** Capacidad de exportación de balances, catálogos e informes en formatos PDF y hojas de cálculo (Excel).

## 4. Apéndices

- **Apéndice A:** Matriz de trazabilidad entre permisos RBAC, endpoints REST y Casos de Uso.
- **Apéndice B:** Arquitectura transaccional Unit of Work gobernada por triggers MySQL 8.
- **Apéndice C:** Especificación de herramientas (Tools) del servidor MCP.
