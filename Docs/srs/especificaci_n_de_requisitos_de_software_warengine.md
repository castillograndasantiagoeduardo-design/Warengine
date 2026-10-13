# Especificación de Requisitos de Software (SRS)

**Proyecto:** Warengine\
**Estándar:** IEEE Std 830-1998\
**Revisión:** 99.99\
**Fecha:** Septiembre 2026

---

## Ficha del Documento

| Fecha           | Revisión   | Autor                                                                                         | Verificado Dep. Calidad |
| :-------------- | :--------- | :-------------------------------------------------------------------------------------------- | :---------------------- |
| Septiembre 2026 | Rev. 99.99 | Santiago Eduardo Castillo Granda, Diego Alexander Trujillo Medina, Oscar Eduardo Amaya Parada | [Firma o sello]         |

### Validación del Documento

| Por el cliente        | Por la empresa suministradora |
| :-------------------- | :---------------------------- |
| Fdo. D./ Dña [Nombre] | Fdo. D./ Dña [Nombre]         |

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
  - [Módulo 1: Seguridad y Autenticación](#módulo-1-seguridad-y-autenticación)
  - [Módulo 2: Administración y Control](#módulo-2-administración-y-control)
  - [Módulo 3: Facturación, Mostrador y Consulta de Inventario](#módulo-3-facturación-mostrador-y-consulta-de-inventario)
  - [Módulo 4: Asistente Conversacional (Servidor MCP)](#módulo-4-asistente-conversacional-servidor-mcp)
  - [Módulo 5: Logística y Gestión de Activos Internos](#módulo-5-logística-y-gestión-de-activos-internos)
  - [3.1 Requisitos Comunes de las Interfaces](#31-requisitos-comunes-de-las-interfaces)
  - [3.2 Requisitos Funcionales Base (Resumen Global)](#32-requisitos-funcionales-base-resumen-global)
  - [3.3 Requisitos No Funcionales](#33-requisitos-no-funcionales)
  - [3.4 Otros Requisitos](#34-otros-requisitos)
- [4. Apéndices](#4-apéndices)

---

## 1. Introducción

Este documento constituye la Especificación de Requisitos de Software (SRS) del
proyecto **Warengine**, una plataforma integral de gestión de inventario,
facturación y control de personal que incorpora un servidor intermedio basado en
el **Model Context Protocol (MCP)** para permitir consultas en lenguaje natural
sobre la información operativa del negocio. El documento se elabora conforme al
estándar **IEEE Std 830-1998**.

### 1.1 Propósito

Definir de forma completa, clara y verificable los requisitos funcionales y no
funcionales del sistema Warengine, de manera que sirva como acuerdo entre el
equipo de desarrollo y el cliente, y como base para el diseño, la construcción y
las pruebas del software. Está dirigido al equipo de desarrollo, a los
instructores evaluadores del programa ADSO del SENA y a los usuarios finales y
propietarios del negocio que validarán el producto.

### 1.2 Alcance

El producto a desarrollar se denomina **Warengine**. Comprende la gestión de
productos, categorías, proveedores, entradas y salidas de mercancía,
facturación, clientes, usuarios y roles, junto con un asistente conversacional
conectado mediante un servidor MCP que consulta la base de datos a través de
herramientas (_Tools_) controladas. Queda fuera del alcance de esta versión la
integración con facturación electrónica ante la DIAN, la contabilidad general y
la nómina.

### 1.3 Personal Involucrado

| Nombre                               | Rol                                        | Categoría Profesional                                | Responsabilidades                                                                                                                       | Información de Contacto                                           |
| :----------------------------------- | :----------------------------------------- | :--------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------- |
| **Santiago Eduardo Castillo Granda** | Líder de proyecto, desarrollador junior    | Aprendiz de Tecnología en ADSO - SENA, Ficha 3232476 | Levantamiento y análisis de requisitos, diseño de Clean Architecture, desarrollo backend/frontend, servidor MCP y ejecución de pruebas. | Tel: 3142994265<br>Email: castillograndasantiagoeduardo@gmail.com |
| **Diego Alexander Trujillo Medina**  | Co-Líder de proyecto, desarrollador junior | Aprendiz de Tecnología en ADSO - SENA, Ficha 3232476 | Levantamiento y análisis de requisitos, diseño de Clean Architecture, desarrollo backend/frontend, servidor MCP y ejecución de pruebas. | Tel: 3142994265<br>Email: castillograndasantiagoeduardo@gmail.com |
| **Oscar Eduardo Amaya Parada**       | Desarrollador de Software                  | Aprendiz de Tecnología en ADSO - SENA, Ficha 3232476 | Levantamiento y análisis de requisitos, diseño de Clean Architecture, desarrollo backend/frontend, servidor MCP y ejecución de pruebas. | Tel: 3209111484<br>Email: amayaoscar466@gmail.com                 |

### 1.4 Definiciones, Acrónimos y Abreviaturas

- **ADSO:** Análisis y Desarrollo de Software, programa de formación del SENA.
- **API:** Interfaz de Programación de Aplicaciones (_Application Programming
  Interface_).
- **MCP (Model Context Protocol):** Protocolo que expone herramientas (_Tools_)
  para que un modelo de inteligencia artificial consulte datos de forma segura y
  estructurada.
- **Tool:** Operación específica y acotada que el servidor MCP pone a
  disposición del asistente de IA.
- **RBAC:** Control de Acceso Basado en Roles (_Role-Based Access Control_).
- **ORM:** Mapeo Objeto-Relacional (_Object-Relational Mapping_); en este
  proyecto se emplea Drizzle ORM.
- **SRS:** Especificación de Requisitos de Software (_Software Requirements
  Specification_).
- **POS:** Punto de Venta (_Point of Sale_).
- **JWT:** JSON Web Token, mecanismo de autenticación basado en tokens firmados.
- **SKU:** _Stock Keeping Unit_, código único de identificación de un artículo
  del inventario.

### 1.5 Referencias

| Referencia | Título   | Ruta   | Fecha   | Autor   |
| :--------- | :------- | :----- | :------ | :------ |
| [Ref.]     | [Título] | [Ruta] | [Fecha] | [Autor] |

### 1.6 Resumen

El capítulo 2 presenta una descripción general del producto: perspectiva,
funcionalidad principal, perfiles de usuario, restricciones, suposiciones y
evolución previsible. El capítulo 3 detalla los requisitos específicos
(interfaces, funcionales y no funcionales), identificados unívocamente para su
trazabilidad. El capítulo 4 recopila los apéndices.

---

## 2. Descripción General

### 2.1 Perspectiva del Producto

Warengine es un producto independiente de tipo plataforma web, compuesto por
tres piezas:

1. **Backend:** Construido con Deno, TypeScript y Drizzle ORM sobre MySQL
   aplicando Clean Architecture y principios SOLID.
2. **Frontend:** Desarrollado en React y Next.js.
3. **Servidor MCP:** Capa de presentación adicional que reutiliza los mismos
   casos de uso de la aplicación. El asistente de IA nunca accede directamente a
   la base de datos: solo invoca las _Tools_ expuestas por el servidor MCP.

### 2.2 Funcionalidad del Producto

- **Gestión de inventario:** Productos, categorías, proveedores, entradas,
  salidas y control de existencias por sucursal.
- **Facturación y punto de venta:** Creación de facturas, registro de clientes y
  consulta de disponibilidad de artículos.
- **Control de personal y roles:** Administración de usuarios y asignación de
  permisos mediante RBAC.
- **Asistente conversacional con MCP:** Consultas en lenguaje natural sobre
  stock, rotación, ventas y alertas con métricas en tiempo real.
- **Reportes y auditoría:** Registro de logs operacionales y métricas
  financieras para soporte en la toma de decisiones.

### 2.3 Características de los Usuarios

| Tipo de Usuario               | Formación / Habilidades                                                                      | Actividades                                                                                    |
| :---------------------------- | :------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------- |
| **Super Admin / Propietario** | Formación en administración/gestión. Manejo web básico. Sin conocimientos requeridos de SQL. | Auditoría de logs, gestión de sucursales, métricas financieras globales y asignación de roles. |
| **Administrador de Almacén**  | Formación técnica en logística/inventarios. Manejo web básico.                               | Gestión de categorías, entradas/salidas de mercancía y relación con proveedores.               |
| **Cajero / Vendedor**         | Educación media básica. Manejo de sistemas POS y navegador web.                              | Creación de facturas, registro de clientes y verificación de disponibilidad de artículos.      |

### 2.4 Restricciones

- Backend implementado exclusivamente en **Deno** con **TypeScript**, **Clean
  Architecture** y principios **SOLID**.
- Persistencia relacional en **MySQL** a través de **Drizzle ORM**.
- Frontend construido sobre **React** y **Next.js**.
- Acceso de IA restringido exclusivamente a las _Tools_ del servidor MCP (acceso
  directo a SQL estrictamente prohibido).
- Plataforma web accesible desde navegadores modernos (Chrome, Edge, Firefox).
  Sin cliente móvil nativo en esta versión.
- Cumplimiento estricto de cronogramas y directrices de calidad del programa
  ADSO del SENA.

### 2.5 Suposiciones y Dependencias

- Conexión a internet estable en puntos de venta y almacén.
- Disponibilidad de un proveedor LLM compatible con Model Context Protocol
  (MCP).
- El cliente completará la carga inicial de datos maestros previa al paso a
  producción.
- Disponibilidad de servidor de base de datos y entorno Deno actualizado.

### 2.6 Evolución Previsible del Sistema

- Integración con facturación electrónica y reportes tributarios (DIAN).
- Módulo predictivo de demanda y reabastecimiento automático.
- Aplicativo móvil para escaneo de códigos de barra en conteo de inventario.
- Extensión del catálogo de Tools MCP y arquitectura multiempresa
  (multi-tenant).

---

## 3. Requisitos Específicos

### Módulo 1: Seguridad y Autenticación

#### Bloque A - Interfaz del Formulario

| ID            | Nombre de Requisito                    | Descripción                                                                                                                         | Tipo          | Prioridad       |
| :------------ | :------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- | :------------ | :-------------- |
| **RF-SA-A1**  | Login con JWT y generar Cookies        | El usuario podrá autenticarse con sus credenciales de forma segura y cifrada.                                                       | Autenticación | Alta / Esencial |
| **RF-SA-A2**  | Campo de correo electrónico            | El sistema debe mostrar un campo de texto para ingresar el correo electrónico, con placeholder indicativo.                          | Autenticación | Alta / Esencial |
| **RF-SA-A2b** | Campo de contraseña                    | El sistema debe mostrar un campo de tipo contraseña que oculte los caracteres ingresados por defecto.                               | Autenticación | Alta / Esencial |
| **RF-SA-A3**  | Botón mostrar/ocultar contraseña       | El sistema debe permitir alternar la visibilidad de la contraseña mediante un icono junto al campo.                                 | Autenticación | Alta / Esencial |
| **RF-SA-A4**  | Botón de envío del formulario          | El sistema debe mostrar un botón "Iniciar sesión" que envíe la solicitud de autenticación al backend.                               | Autenticación | Alta / Esencial |
| **RF-SA-A5**  | Deshabilitar botón mientras se procesa | El sistema debe deshabilitar el botón de envío mientras la solicitud de autenticación esté en curso, para evitar envíos duplicados. | Autenticación | Media / Deseado |
| **RF-SA-A6**  | Indicador de carga (spinner)           | El sistema debe mostrar un indicador visual de carga mientras se espera la respuesta del servidor.                                  | Autenticación | Media / Deseado |

#### Bloque B - Validaciones en el Cliente

| ID            | Nombre de Requisito                         | Descripción                                                                                                               | Tipo                     | Prioridad       |
| :------------ | :------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------ | :----------------------- | :-------------- |
| **RF-SA-B1**  | Validación de campo correo vacío            | El sistema debe impedir el envío del formulario si el campo correo está vacío, mostrando un mensaje debajo del campo.     | Validación de datos      | Alta / Esencial |
| **RF-SA-B2**  | Validación de campo contraseña vacío        | El sistema debe impedir el envío del formulario si el campo contraseña está vacío, mostrando un mensaje debajo del campo. | Validación de datos      | Alta / Esencial |
| **RF-SA-B2b** | Validación de formato de correo             | El sistema debe validar que el texto ingresado en correo cumpla el formato usuario@dominio antes de habilitar el envío.   | Validación de datos      | Alta / Esencial |
| **RF-SA-B3**  | Validación de longitud mínima de contraseña | El sistema debe validar que la contraseña ingresada tenga al menos 8 caracteres antes de enviar la solicitud.             | Validación de datos      | Alta / Esencial |
| **RF-SA-B4**  | Limpieza de mensajes de error al corregir   | El sistema debe ocultar el mensaje de error de un campo en cuanto el usuario empiece a corregirlo.                        | Interfaz de usuario (UI) | Baja / Opcional |

#### Bloque C - Autenticación en el Backend

| ID            | Nombre de Requisito                                   | Descripción                                                                                                                                | Tipo          | Prioridad       |
| :------------ | :---------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- | :------------ | :-------------- |
| **RF-SA-C1**  | Recepción de credenciales en el backend               | El backend debe exponer un endpoint que reciba correo y contraseña en el cuerpo de la solicitud mediante HTTPS.                            | Autenticación | Alta / Esencial |
| **RF-SA-C2**  | Búsqueda del usuario por correo                       | El sistema debe buscar en la base de datos un usuario cuyo correo coincida exactamente con el ingresado.                                   | Autenticación | Alta / Esencial |
| **RF-SA-C3**  | Verificación de hash de contraseña                    | El sistema debe comparar la contraseña ingresada contra el hash almacenado, usando el mismo algoritmo con el que fue cifrada.              | Autenticación | Alta / Esencial |
| **RF-SA-C4**  | Verificación de estado de la cuenta (activa/inactiva) | El sistema debe rechazar el acceso si la cuenta del usuario está marcada como inactiva o deshabilitada, aunque la contraseña sea correcta. | Autenticación | Alta / Esencial |
| **RF-SA-C4b** | Rechazo por usuario inexistente                       | Si el correo no existe en la base de datos, el sistema debe rechazar el acceso sin indicar que el correo no está registrado.               | Autenticación | Alta / Esencial |
| **RF-SA-C5**  | Rechazo por contraseña incorrecta                     | Si la contraseña no coincide con el hash almacenado, el sistema debe rechazar el acceso sin indicar cuál dato fue incorrecto.              | Autenticación | Alta / Esencial |

#### Bloque D - Token y Sesión

| ID            | Nombre de Requisito                                   | Descripción                                                                                                                                                                                                                             | Tipo                 | Prioridad       |
| :------------ | :---------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------- | :-------------- |
| **RF-SA-D1**  | Generación del token JWT                              | Si las credenciales son válidas, el sistema debe generar un token JWT firmado con una clave secreta del servidor.                                                                                                                       | Autenticación        | Alta / Esencial |
| **RF-SA-D2**  | Inclusión del ID de usuario en el payload             | El token JWT generado debe incluir el identificador único del usuario en su payload.                                                                                                                                                    | Autenticación        | Alta / Esencial |
| **RF-SA-D3**  | Inclusión del rol en el payload                       | El token JWT generado debe incluir el rol del usuario para su uso posterior en la verificación de permisos.                                                                                                                             | Autenticación        | Alta / Esencial |
| **RF-SA-D4**  | Inclusión de la sucursal/bodega en el payload         | El token JWT debe incluir el identificador de la sucursal o bodega asignada al usuario (cuando aplique a su rol), de modo que tanto el backend REST como el servidor MCP acoten operaciones sin requerir parámetros extras del cliente. | RBAC / Autenticación | Alta / Esencial |
| **RF-SA-D5**  | Inclusión de JSON de respuesta                        | El servidor incluirá en la respuesta a la petición de login un objeto JSON con los datos del usuario y sus permisos registrados.                                                                                                        | Autenticación        | Alta / Esencial |
| **RF-SA-D6**  | Definición del tiempo de expiración del token         | El token JWT debe tener un tiempo de expiración configurado (por ejemplo, 1 hora) definido en el momento de su creación.                                                                                                                | Autenticación        | Alta / Esencial |
| **RF-SA-D7**  | Entrega del token en cookie httpOnly                  | El sistema debe enviar el token al cliente dentro de una cookie con el atributo httpOnly, impidiendo su lectura desde JavaScript.                                                                                                       | Autenticación        | Alta / Esencial |
| **RF-SA-D8**  | Atributo secure en la cookie                          | La cookie que contiene el token debe llevar el atributo secure, de modo que solo se transmita sobre HTTPS.                                                                                                                              | Autenticación        | Alta / Esencial |
| **RF-SA-D9**  | Atributo SameSite en la cookie                        | La cookie del token debe configurarse con el atributo SameSite para mitigar ataques CSRF.                                                                                                                                               | Autenticación        | Alta / Esencial |
| **RF-SA-D10** | Invalidación del token al expirar                     | El sistema debe rechazar cualquier solicitud que use un token cuya fecha de expiración ya haya pasado.                                                                                                                                  | Autenticación        | Alta / Esencial |
| **RF-SA-D11** | Invalidación de token ante cambios de usuario         | Si un SuperAdmin modifica el rol, la sucursal asignada o el estado de un usuario, cualquier token emitido previamente debe quedar inválido, forzando un nuevo inicio de sesión.                                                         | Autenticación        | Alta / Esencial |
| **RF-SA-D12** | Segundo factor de autenticación (2FA) para SuperAdmin | El sistema debe ofrecer como opción configurable 2FA (TOTP por app/correo) para el rol SuperAdmin.                                                                                                                                      | Autenticación        | Alta / Esencial |

#### Bloque E - Control de Acceso y Redirección

| ID           | Nombre de Requisito                         | Descripción                                                                                                                                                                             | Tipo                         | Prioridad       |
| :----------- | :------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------- | :-------------- |
| **RF-SA-E1** | Middleware de verificación de token         | El backend debe validar la firma y vigencia del token en cada solicitud a una ruta protegida antes de procesarla.                                                                       | Autenticación                | Alta / Esencial |
| **RF-SA-E2** | Respuesta 401 por token ausente             | El sistema debe responder con código 401 cuando una solicitud protegida no incluya token.                                                                                               | Autenticación                | Alta / Esencial |
| **RF-SA-E3** | Respuesta 401 por token inválido o alterado | El sistema debe responder con código 401 si el token no puede verificarse con la clave del servidor.                                                                                    | Autenticación                | Alta / Esencial |
| **RF-SA-E4** | Verificación de permisos según rol          | El sistema debe validar los permisos registrados para el rol antes de autorizar cualquier acción.                                                                                       | Autenticación                | Alta / Esencial |
| **RF-SA-E5** | Respuesta 403 por rol insuficiente          | El sistema responderá con código 403 si el rol autenticado carece de autorización para la acción requerida.                                                                             | Autenticación                | Alta / Esencial |
| **RF-SA-E6** | Redirección a panel según rol               | Tras el inicio de sesión exitoso, el sistema redirige al usuario a la vista principal según su perfil.                                                                                  | Autenticación                | Alta / Esencial |
| **RF-SA-E7** | Abstracción de autorización compartida      | La verificación de permisos se delegará a una interfaz común (`IAuthorizationPolicy`) compartida tanto por el middleware HTTP como por el Tool Gateway de MCP (evitando acoplamientos). | Arquitectura / Autenticación | Alta / Esencial |

#### Bloque F - Seguridad Adicional

| ID           | Nombre de Requisito                          | Descripción                                                                                         | Tipo          | Prioridad       |
| :----------- | :------------------------------------------- | :-------------------------------------------------------------------------------------------------- | :------------ | :-------------- |
| **RF-SA-F1** | Límite de intentos fallidos por cuenta       | El sistema contabilizará los intentos fallidos de autenticación por cuenta en una ventana temporal. | Autenticación | Media / Deseado |
| **RF-SA-F2** | Bloqueo temporal tras exceder intentos       | Bloqueo del inicio de sesión de la cuenta por 5 minutos tras 5 intentos fallidos consecutivos.      | Autenticación | Alta / Esencial |
| **RF-SA-F3** | Límite de intentos fallidos por dirección IP | Limitar intentos fallidos desde una misma IP para mitigar ataques de fuerza bruta distribuida.      | Autenticación | Alta / Esencial |
| **RF-SA-F4** | Registro de intentos exitosos (log)          | Registrar inicios de sesión exitosos indicando usuario, fecha, hora e IP de origen.                 | Auditoría     | Alta / Esencial |
| **RF-SA-F5** | Registro de intentos fallidos (log)          | Registrar intentos fallidos indicando correo utilizado, fecha, hora e IP de procedencia.            | Auditoría     | Alta / Esencial |
| **RF-SA-F6** | Cifrado de contraseñas almacenadas           | Almacenar contraseñas cifradas usando hash seguro (bcrypt o Argon2); nunca en texto plano.          | Seguridad     | Alta / Esencial |
| **RF-SA-F7** | Mensajes de error genéricos                  | Mostrar mensajes genéricos ("credenciales incorrectas") sin dar pistas de causas exactas de error.  | Seguridad     | Alta / Esencial |

#### Bloque G - Funciones Complementarias de Sesión

| ID           | Nombre de Requisito                 | Descripción                                                                                           | Tipo          | Prioridad       |
| :----------- | :---------------------------------- | :---------------------------------------------------------------------------------------------------- | :------------ | :-------------- |
| **RF-SA-G1** | Cierre de sesión (logout)           | Eliminar la cookie del token en cliente e invalidar sesión en servidor.                               | Autenticación | Alta / Esencial |
| **RF-SA-G2** | Renovación de token (refresh token) | Generar un nuevo token de acceso mediante refresh token válido sin solicitar credenciales nuevamente. | Autenticación | Media / Deseado |
| **RF-SA-G3** | Expiración del refresh token        | El refresh token tendrá una duración superior al token de acceso pero con límite temporal explícito.  | Autenticación | Media / Deseado |
| **RF-SA-G4** | Opción "recordarme"                 | Casilla opcional que extiende la duración de la sesión del usuario.                                   | Autenticación | Media / Deseado |
| **RF-SA-G5** | Cierre automático por inactividad   | Cierre de sesión automático tras cumplirse un periodo configurable de inactividad.                    | Autenticación | Media / Deseado |

#### Bloque H - Recuperación de Contraseña

| ID           | Nombre de Requisito                       | Descripción                                                                                              | Tipo           | Prioridad       |
| :----------- | :---------------------------------------- | :------------------------------------------------------------------------------------------------------- | :------------- | :-------------- |
| **RF-SA-H1** | Solicitud de recuperación de contraseña   | Solicitar cambio de contraseña mediante el correo electrónico previamente registrado.                    | Autenticación  | Alta / Esencial |
| **RF-SA-H2** | Límite de solicitudes de recuperación     | Tasa límite de peticiones de reseteo por IP/correo para evitar ataques de enumeración o spam de correos. | Seguridad      | Media / Deseado |
| **RF-SA-H3** | Envío de enlace de recuperación           | Despacho de correo con enlace unívoco y de validez temporal para el cambio de credenciales.              | Autenticación  | Alta / Esencial |
| **RF-SA-H4** | Expiración del enlace de recuperación     | Invalidez del enlace tras 30 minutos o posterior a su primer uso.                                        | Seguridad      | Alta / Esencial |
| **RF-SA-H5** | Formulario de nueva contraseña            | Pantalla para ingresar y confirmar la nueva contraseña desde el enlace válido recibido.                  | UI / Seguridad | Alta / Esencial |
| **RF-SA-H6** | Validación de coincidencia de contraseñas | Verificación de idéntica concordancia entre contraseña y confirmación previo al guardado.                | Validación     | Alta / Esencial |

#### Bloque I - Seguridad del Servidor MCP (RBAC de las Tools del Chatbot)

| ID            | Nombre de Requisito                            | Descripción                                                                                                                                     | Tipo                | Prioridad       |
| :------------ | :--------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- | :------------------ | :-------------- |
| **RF-SA-I1**  | Catálogo de Tools filtrado por rol             | El descubrimiento (`tools/list`) solo devolverá las herramientas explícitamente permitidas según el rol del usuario.                            | Servidor MCP / RBAC | Alta / Esencial |
| **RF-SA-I2**  | Autorización delegada al Caso de Uso           | Las Tools no contendrán lógica de permisos embebida; invocarán la abstracción de autorización común del sistema.                                | Arquitectura / MCP  | Alta / Esencial |
| **RF-SA-I3**  | Restricción de Tools financieras a SuperAdmin  | Exclusividad absoluta de Tools con métricas financieras (márgenes, ganancias) para SuperAdmin comprobada a nivel Caso de Uso.                   | Seguridad MCP       | Alta / Esencial |
| **RF-SA-I4**  | Alcance de sucursal en Tools de Administrador  | Las Tools filtrarán datos según la sucursal del token del usuario sin admitir sustituciones por parámetros del cliente o LLM.                   | Seguridad MCP       | Alta / Esencial |
| **RF-SA-I5**  | Tools de solo lectura para Cajero/Vendedor     | El rol Cajero/Vendedor solo puede invocar Tools catalogadas como de solo lectura. Cualquier acción de escritura se rechaza de inmediato.        | Seguridad MCP       | Alta / Esencial |
| **RF-SA-I6**  | Rechazo temprano de Tools (fail-fast)          | Un componente "Tool Gateway" interceptará y validará permisos antes de llegar a la lógica del caso de uso.                                      | Arquitectura MCP    | Alta / Esencial |
| **RF-SA-I7**  | Propagación de identidad al servidor MCP       | El servidor MCP utilizará el mismo token JWT de la sesión web para validar usuario, rol y sucursal.                                             | Autenticación MCP   | Alta / Esencial |
| **RF-SA-I8**  | Prohibición de exposición de esquema o SQL     | Las Tools retornarán únicamente DTOs procesados; queda prohibido exponer sentencias SQL o el ORM Drizzle a través de MCP.                       | Seguridad MCP       | Alta / Esencial |
| **RF-SA-I9**  | Auditoría de invocación de Tools               | Registro estricto de cada invocación de Tool (usuario, rol, parámetros y estado de acceso/denegación).                                          | Auditoría MCP       | Alta / Esencial |
| **RF-SA-I10** | Validación de parámetros contra manipulación   | Parámetros construidos por el LLM se validarán con esquemas rigurosos (p. ej., Zod) para mitigar vectores de prompt injection.                  | Seguridad MCP       | Alta / Esencial |
| **RF-SA-I11** | Invalidación de sesión MCP sincronizada        | El cierre o expiración del token web invalida automáticamente la sesión activa en el servidor MCP en tiempo real.                               | Sesión MCP          | Alta / Esencial |
| **RF-SA-I12** | Mensajes de denegación genéricos en el chatbot | En caso de permisos insuficientes, el chatbot dará respuestas conversacionales neutras sin exponer detalles de arquitectura o Tools existentes. | Seguridad MCP       | Alta / Esencial |

---

### Módulo 2: Administración y Control

#### Bloque A - Dashboard y Analítica

| ID            | Nombre de Requisito                              | Descripción                                                                                           | Fuente                       | Prioridad       |
| :------------ | :----------------------------------------------- | :---------------------------------------------------------------------------------------------------- | :--------------------------- | :-------------- |
| **RF-ADM-A1** | Panel de métricas globales de ganancias          | Resumen en panel de ganancias consolidadas acumuladas en todas las sucursales.                        | Super Admin / Admin Sucursal | Alta / Esencial |
| **RF-ADM-A2** | Gráfico de tendencias de ventas                  | Gráfico analítico de ventas con visualización diaria, semanal o mensual.                              | Super Admin / Admin Almacén  | Alta / Esencial |
| **RF-ADM-A3** | Comparativo de rendimiento entre sucursales      | Gráfico o tabla comparando el volumen de ventas entre distintas sucursales.                           | Super Admin / Admin Almacén  | Media / Deseado |
| **RF-ADM-A4** | Indicador de producto más y menos vendido global | Identificación y reporte de los productos de mayor y menor rotación global.                           | Super Admin / Admin Almacén  | Media / Deseado |
| **RF-ADM-A6** | Alertas de agotamiento de stock                  | Despliegue en dashboard de artículos con stock igual o por debajo del mínimo, ordenados por sucursal. | Super Admin / Admin Almacén  | Alta / Esencial |

#### Bloque B - Gestión de Inventario y Catálogo

| ID             | Nombre de Requisito                         | Descripción                                                                                        | Fuente                      | Prioridad       |
| :------------- | :------------------------------------------ | :------------------------------------------------------------------------------------------------- | :-------------------------- | :-------------- |
| **RF-ADM-B1**  | Creación de producto                        | Registro con SKU, nombre, categoría, proveedor, precio compra/venta, stock inicial y stock mínimo. | Admin Almacén / Super Admin | Alta / Esencial |
| **RF-ADM-B2**  | Edición de producto existente               | Modificación de productos con trazabilidad en historial de variaciones de precio.                  | Admin Almacén / Super Admin | Alta / Esencial |
| **RF-ADM-B3**  | Activación/inactivación de producto         | Inactivación lógica en lugar de borrado físico, preservando históricos.                            | Admin Almacén / Super Admin | Alta / Esencial |
| **RF-ADM-B4**  | Listado y búsqueda de productos con filtros | Filtros por categoría, proveedor, estado y alerta de stock bajo.                                   | Admin Almacén / Super Admin | Alta / Esencial |
| **RF-ADM-B5**  | Gestión de categorías de producto           | CRUD de categorías para organizar el catálogo de productos.                                        | Admin Almacén / Super Admin | Media / Deseado |
| **RF-ADM-B6**  | Gestión de proveedores                      | Registro, edición e inactivación de datos de proveedores y sus productos asignados.                | Admin Almacén / Super Admin | Media / Deseado |
| **RF-ADM-B7**  | Registro de entradas de mercancía           | Entrada de insumos asociada a proveedor con ajuste automático de existencias.                      | Admin Almacén               | Alta / Esencial |
| **RF-ADM-B8**  | Registro de salidas manuales de mercancía   | Descarga por mermas, averías o ajustes, requiriendo justificación obligatoria.                     | Super Admin                 | Media / Deseado |
| **RF-ADM-B9**  | Validación de stock no negativo             | Impedir que salidas manuales o ventas provoquen existencias bajo cero.                             | Admin Almacén               | Alta / Esencial |
| **RF-ADM-B10** | Historial de movimientos (kardex)           | Trazabilidad histórica y cronológica de entradas, salidas y ajustes por ítem.                      | Admin Almacén / Super Admin | Media / Deseado |
| **RF-ADM-B11** | Configuración de stock mínimo por producto  | Definir umbrales mínimos para disparar alarmas de abastecimiento.                                  | Admin Almacén / Super Admin | Media / Deseado |

#### Bloque C - Gestión de Personal y Sucursales

| ID             | Nombre de Requisito                              | Descripción                                                                                                | Fuente      | Prioridad       |
| :------------- | :----------------------------------------------- | :--------------------------------------------------------------------------------------------------------- | :---------- | :-------------- |
| **RF-ADM-C1**  | Listado de sucursales registradas                | Vista integral de sedes operativas, accesible solo para SuperAdmin.                                        | Super Admin | Alta / Esencial |
| **RF-ADM-C2**  | Edición de datos de sucursal                     | Modificación de nombre, dirección física y teléfonos de contacto de sucursales.                            | Super Admin | Media / Deseado |
| **RF-ADM-C3**  | Registro de nueva sucursal                       | Alta de sedes operativas en el sistema con datos de ubicación y contacto.                                  | Super Admin | Media / Deseado |
| **RF-ADM-C4**  | Vista comparativa de inventario entre sucursales | Comparación de niveles de existencia de un mismo ítem a lo largo de las sucursales.                        | Super Admin | Baja / Opcional |
| **RF-ADM-C5**  | Listado de usuarios con filtros                  | Directorio de empleados filtrable por perfil y sucursal de operación.                                      | Super Admin | Alta / Esencial |
| **RF-ADM-C6**  | Creación de nuevo usuario/empleado               | Registro de cuentas asociando nombre, correo, rol y sede inicial.                                          | Super Admin | Alta / Esencial |
| **RF-ADM-C7**  | Asignación o cambio de rol a un usuario          | Reasignación de privilegios entre SuperAdmin, Admin Sucursal y Cajero/Vendedor.                            | Super Admin | Alta / Esencial |
| **RF-ADM-C8**  | Activación/desactivación de cuentas              | Bloqueo o reactivación preventiva del acceso al sistema para un usuario dado.                              | Super Admin | Alta / Esencial |
| **RF-ADM-C9**  | Restablecimiento de contraseña por SuperAdmin    | Forzar cambio de clave de acceso a usuarios desde la administración central.                               | Super Admin | Media / Deseado |
| **RF-ADM-C10** | Asignación a una o varias sucursales             | Delimitar el ámbito de acceso físico/lógico del usuario en una o más sedes.                                | Super Admin | Media / Deseado |
| **RF-ADM-C11** | Auditoría de logs del sistema                    | Visor de eventos críticos (altas, modificaciones, bajas, errores de acceso) con filtros por fecha y actor. | Super Admin | Alta / Esencial |

#### Requisitos No Funcionales del Módulo 2

- **RNF-ADM-01:** El dashboard principal debe cargar métricas en menos de 3
  segundos con hasta 12 meses de datos históricos.
- **RNF-ADM-02:** Toda mutación en Inventario, Catálogo, Personal o Sedes debe
  persistirse en el log de auditoría (usuario, fecha, hora, detalle).
- **RNF-ADM-03:** Las interfaces y endpoints deben exigir autorización RBAC
  validada en frontend y backend según los middlewares de seguridad.
- **RNF-ADM-04:** Un Administrador de Sucursal solo podrá ver y alterar datos de
  su propia sede asignada; la visibilidad transversal queda reservada a
  SuperAdmin.

---

### Módulo 3: Facturación, Mostrador y Consulta de Inventario

#### Bloque A - Transición Post-Login, Sesión Operativa y Selección de Modo

| ID            | Nombre de Requisito                         | Descripción                                                                                                           | Tipo      | Prioridad       |
| :------------ | :------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------- | :-------- | :-------------- |
| **RF-FMC-A1** | Verificación de seguridad de perfil y token | Validación de vigencia de sesión antes de desplegar pantalla de trabajo; de lo contrario, expulsión a login.          | Funcional | Alta / Esencial |
| **RF-FMC-A2** | Modos disponibles según rol                 | Renderizar exclusivamente Facturación, Consulta o ambos acorde al rol asignado.                                       | Funcional | Alta / Esencial |
| **RF-FMC-A3** | Carga de sucursal y bodega de salida        | Detección de la bodega base para filtrar stock local y delimitar búsquedas por defecto.                               | Funcional | Alta / Esencial |
| **RF-FMC-A4** | Apertura de turno / caja chica (Cajero)     | Registro mandatorio de saldo inicial de caja previo a habilitar facturación (no aplica a vendedores B2B).             | Funcional | Alta / Esencial |
| **RF-FMC-A5** | Registro contable de apertura de turno      | Asentamiento del monto inicial para cuadre automático al final de la jornada.                                         | Funcional | Alta / Esencial |
| **RF-FMC-A6** | Permisos de solo lectura (Vendedor B2B)     | Deshabilitación absoluta de botones de facturación o edición en perfiles comerciales B2B.                             | Funcional | Alta / Esencial |
| **RF-FMC-A7** | Verificación de estado y conectividad       | Validación de red antes de habilitar funciones; ante desconexión, degradación a solo lectura o último stock en caché. | Funcional | Media / Deseado |
| **RF-FMC-A8** | Pantalla de carga con contexto operativo    | Vista transicional con estado durante la preparación de la sesión de mostrador.                                       | Funcional | Media / Deseado |

#### Bloque B - Interfaz de Facturación y Mostrador (Cajero)

| ID             | Nombre de Requisito                        | Descripción                                                                                          | Tipo      | Prioridad       |
| :------------- | :----------------------------------------- | :--------------------------------------------------------------------------------------------------- | :-------- | :-------------- |
| **RF-FMC-B1**  | Selector de modo (Pestañas)                | Navegación entre "Facturación" y "Consulta B2B" sin recarga, reteniendo ítems de la factura activa.  | Funcional | Alta / Esencial |
| **RF-FMC-B2**  | Header operativo con estado de caja        | Indicador con datos de operador, sede, conectividad y estado de apertura de caja.                    | Funcional | Alta / Esencial |
| **RF-FMC-B3**  | Búsqueda por Barcode/SKU o catálogo        | Localización instantánea de artículos mediante lector de barras o tipeo de nombre.                   | Funcional | Alta / Esencial |
| **RF-FMC-B4**  | Botón "+ Nuevo Cliente"                    | Modal de creación de nuevo cliente sin reiniciar ni perder la venta en curso.                        | Funcional | Alta / Esencial |
| **RF-FMC-B5**  | Validación fiscal de cliente nuevo         | Validación de estructura en documento/correo; obligatoriedad de teléfono/dirección para cuentas B2B. | Funcional | Alta / Esencial |
| **RF-FMC-B6**  | Tabla de ítems del panel de factura        | Grilla interactiva editable para cantidad, valores unitarios, descuentos y cálculo de subtotales.    | Funcional | Alta / Esencial |
| **RF-FMC-B7**  | Asignación inmediata de cliente creado     | Enlace automático del nuevo cliente registrado directamente a la cabecera de la factura en proceso.  | Funcional | Alta / Esencial |
| **RF-FMC-B8**  | Cálculo reactivo de Subtotal, IVA y Total  | Actualización instantánea de totales con cada adición o supresión de productos.                      | Funcional | Alta / Esencial |
| **RF-FMC-B9**  | Visualización de stock por bodega asignada | El panel de búsqueda acota existencias exclusivamente a la bodega local del cajero.                  | Funcional | Media / Deseado |
| **RF-FMC-B11** | Estado vacío del panel de factura          | Estado gráfico que guía al usuario y deshabilita botones de cobro mientras no haya ítems cargados.   | Funcional | Alta / Esencial |
| **RF-FMC-B12** | Contador de ítems y unidades               | Contador global con el desglose de productos y unidades agregadas en la factura.                     | Funcional | Alta / Esencial |

#### Bloque C - Modo Consulta de Inventario

| ID            | Nombre de Requisito                      | Descripción                                                                                           | Tipo      | Prioridad       |
| :------------ | :--------------------------------------- | :---------------------------------------------------------------------------------------------------- | :-------- | :-------------- |
| **RF-FMC-C1** | Catálogo expandido multi-bodega          | Visualización transversal de existencias desglosadas por cada sede para apoyo a cotizaciones.         | Funcional | Alta / Esencial |
| **RF-FMC-C2** | Filtros combinados de catálogo           | Búsqueda cruzada por categoría, bodega de acopio y estado de disponibilidad.                          | Funcional | Alta / Esencial |
| **RF-FMC-C3** | Indicador visual de solo lectura         | Etiquetado claro de "Solo consulta" sin controles de modificación de artículos.                       | Funcional | Alta / Esencial |
| **RF-FMC-C5** | Bloqueo de edición a nivel de backend    | Protección lógica en endpoints que invalida mutaciones procedentes de sesiones de consulta comercial. | Funcional | Alta / Esencial |
| **RF-FMC-C6** | Visualización de precios corporativos    | Muestra tarifas corporativas especiales y fecha de su última revisión.                                | Funcional | Alta / Esencial |
| **RF-FMC-C7** | Exportación/Copia de datos de cotización | Portapapeles rápido para exportar el SKU o detalles de cotización hacia herramientas externas.        | Funcional | Media           |
| **RF-FMC-C8** | Búsqueda independiente en modo consulta  | Aislamiento entre la búsqueda de consulta y el estado del buscador del módulo de cobro.               | Funcional | Media           |
| **RF-FMC-C9** | Persistencia de filtros                  | Conservar el estado de filtros aplicados aunque el vendedor navegue entre secciones.                  | Funcional | Baja / Opcional |

#### Bloque D - Directorio de Clientes y Filtrado

| ID             | Nombre de Requisito                        | Descripción                                                                            | Tipo      | Prioridad       |
| :------------- | :----------------------------------------- | :------------------------------------------------------------------------------------- | :-------- | :-------------- |
| **RF-FMC-D1**  | Botón "Buscar Cliente"                     | Modal del directorio sin pérdida del armado de factura en curso.                       | Funcional | Alta / Esencial |
| **RF-FMC-D2**  | Estructura del modal de directorio         | Contenedor con búsqueda rápida, selector por documento y listado de resultados.        | Funcional | Alta / Esencial |
| **RF-FMC-D3**  | Filtros por tipo de documento              | Segmentación inmediata por CC, NIT o RUT.                                              | Funcional | Alta / Esencial |
| **RF-FMC-D4**  | Búsqueda por Nombre/NIT/Razón Social       | Motor de consulta por nombre completo, identificación o razón social.                  | Funcional | Alta / Esencial |
| **RF-FMC-D5**  | Distintivo visual B2B vs B2C               | Indicador rápido para distinguir consumidor final de cuenta corporativa.               | Funcional | Media           |
| **RF-FMC-D6**  | Selección y asignación directa             | Carga inmediata del tercero en la factura con reajuste de listas de precios si aplica. | Funcional | Alta / Esencial |
| **RF-FMC-D7**  | Cambio de cliente asignado                 | Sustitución del cliente activo en factura reabriendo el directorio.                    | Funcional | Media           |
| **RF-FMC-D8**  | Acceso a registro desde directorio         | Botón rápido dentro del buscador para dar de alta a un tercero inexistente.            | Funcional | Media           |
| **RF-FMC-D10** | Prevención de duplicados por documento     | Validación previa para evitar clientes duplicados con igual identificación.            | Funcional | Alta / Esencial |
| **RF-FMC-D11** | Disponibilidad centralizada del directorio | Directorio unificado y compartido para todos los operadores del sistema.               | Funcional | Media           |

#### Bloque E - Modal de Cobro, Emisión y Confirmación

| ID            | Nombre de Requisito                       | Descripción                                                                                     | Tipo      | Prioridad       |
| :------------ | :---------------------------------------- | :---------------------------------------------------------------------------------------------- | :-------- | :-------------- |
| **RF-FMC-E1** | Estructura del modal de cobro             | Resumen de liquidación, cliente, medios de pago y botones de acción.                            | Funcional | Alta / Esencial |
| **RF-FMC-E2** | Selección de medio de pago                | Soporte para Efectivo, Tarjeta, Transferencia y Crédito Corporativo (clientes B2B habilitados). | Funcional | Alta / Esencial |
| **RF-FMC-E3** | Cálculo de devuelta en efectivo           | Control de monto entregado vs a pagar y cálculo reactivo de la devuelta (_vuelto_).             | Funcional | Alta / Esencial |
| **RF-FMC-E4** | Autocompletado para pagos electrónicos    | Monto exacto precargado al elegir tarjeta o transferencia bancaria.                             | Funcional | Media           |
| **RF-FMC-E5** | Emisión de factura y salida de inventario | Cierre y transacción: descuento atómico de stock e impresión del ticket/comprobante.            | Funcional | Alta / Esencial |
| **RF-FMC-E6** | Registro de transacción y kardex          | Asentamiento fiscal y contable del movimiento con rebaja de existencias.                        | Funcional | Alta / Esencial |
| **RF-FMC-E7** | Manejo de contingencias en emisión        | Manejo de errores con opción de reintentar sin pérdida de productos cargados.                   | Funcional | Alta / Esencial |
| **RF-FMC-E8** | Resumen y número de factura               | Alerta de venta exitosa indicando folio/consecutivo y valor cobrado.                            | Funcional | Media           |
| **RF-FMC-E9** | Limpieza post-facturación                 | Blanqueo automático de la interfaz preparándola para la siguiente transacción.                  | Funcional | Alta / Esencial |

#### Bloque F - Sistema de Alerta Urgente al Administrador (Soporte de Mostrador)

| ID            | Nombre de Requisito                 | Descripción                                                                                  | Tipo      | Prioridad       |
| :------------ | :---------------------------------- | :------------------------------------------------------------------------------------------- | :-------- | :-------------- |
| **RF-FMC-F1** | Botón de alerta visible en cabecera | Acceso rápido permanente para solicitar apoyo del supervisor o administrador en turno.       | Funcional | Alta / Esencial |
| **RF-FMC-F2** | Modal de notificación de incidentes | Ventana modal con motivos predefinidos, nivel de gravedad y descripción.                     | Funcional | Alta / Esencial |
| **RF-FMC-F3** | Priorización de incidencias         | Clasificación entre Urgente y Normal para determinar la urgencia de notificación.            | Funcional | Alta / Esencial |
| **RF-FMC-F4** | Descripción condicional obligatoria | Detalle mandatorio si el operador selecciona el motivo "Otro".                               | Funcional | Media           |
| **RF-FMC-F5** | Despacho y registro de auditoría    | Envío en tiempo real con almacenamiento en logs de fecha, hora, emisor y motivo.             | Funcional | Alta / Esencial |
| **RF-FMC-F6** | Acuse de despacho al cajero         | Confirmación al operador de que la notificación ha sido transmitida sin frenar su operación. | Funcional | Media           |
| **RF-FMC-F7** | Badge de estado de alerta           | Notificador flotante que recuerda al usuario la existencia de un reporte pendiente.          | Funcional | Media           |
| **RF-FMC-F8** | Acuse de lectura por administración | Notificación al mostrador una vez el supervisor ha abierto el requerimiento.                 | Funcional | Media           |
| **RF-FMC-F9** | Cierre de alerta en pantalla        | Posibilidad de descartar visualmente la alerta sin afectar el log del sistema.               | Funcional | Baja / Opcional |

#### Bloque G - Detalle de Interacciones y Botones

- **RF-FMC-D1a:** Botón "+ Nuevo Cliente" abre el formulario de registro listo
  para captura.
- **RF-FMC-D2a:** Botón "Guardar Cliente" habilitado solo con formulario válido;
  deduplica si el documento coincide.
- **RF-FMC-D3a:** Botón "Agregar (+)" valida disponibilidad en bodega previa
  inclusión en la lista de venta.
- **RF-FMC-D6a:** Controles numéricos (+ / -) recalculan importes y respetan
  inventario disponible.
- **RF-FMC-D7a:** Botón "Eliminar Ítem" solicita confirmación en partidas con
  descuento especial o grandes cantidades.
- **RF-FMC-D9a:** Botón "Copiar SKU" transfiere el identificador al
  portapapeles.
- **RF-FMC-D10a:** Botón "Procesar Factura y Despachar" se activa exclusivamente
  con ítems y cliente definidos.
- **RF-FMC-D11a:** Botón "Cancelar Factura" requiere confirmación para descartar
  el borrador en preparación.
- **RF-FMC-G1 a G4:** Flujo de envío de alertas con validación de motivos y
  selector de prioridad.

---

### Módulo 4: Asistente Conversacional (Servidor MCP)

#### Bloque A - Consultas de Inventario y Catálogo

| ID            | Nombre de Requisito                     | Descripción                                                                                         | Rol Objetivo           | Prioridad       |
| :------------ | :-------------------------------------- | :-------------------------------------------------------------------------------------------------- | :--------------------- | :-------------- |
| **RF-MCP-A1** | Consulta de stock por producto          | Responder en lenguaje natural el stock disponible y stock mínimo de un producto por SKU o nombre.   | Admin Almacén / Cajero | Alta / Esencial |
| **RF-MCP-A2** | Listado de productos con stock bajo     | Devolver productos con existencias en o por debajo del mínimo, filtrados por la sucursal del token. | Admin Almacén          | Alta / Esencial |
| **RF-MCP-A3** | Consulta de proveedor y costo de compra | Informar el proveedor de origen y costo vigente de compra del artículo requerido.                   | Admin Almacén          | Media / Deseado |
| **RF-MCP-A4** | Consulta de productos por categoría     | Listar los artículos pertenecientes a una categoría solicitada.                                     | Admin Almacén          | Media / Deseado |
| **RF-MCP-A5** | Historial de movimientos de un producto | Reportar las entradas y salidas de un SKU en un rango de fechas especificado.                       | Admin Almacén          | Media / Deseado |

#### Bloque B - Consultas de Ventas y Facturación

| ID            | Nombre de Requisito                    | Descripción                                                                                                    | Rol Objetivo                | Prioridad       |
| :------------ | :------------------------------------- | :------------------------------------------------------------------------------------------------------------- | :-------------------------- | :-------------- |
| **RF-MCP-B1** | Consulta de ventas por periodo         | Total de ingresos y facturas generadas en el día, semana o mes, acotado a la sede del usuario.                 | Cajero / Admin Almacén      | Alta / Esencial |
| **RF-MCP-B2** | Consulta de producto más vendido       | Identificar el producto con mayor rotación comercial en un intervalo dado y para la sucursal local.            | Admin Almacén / Super Admin | Media / Deseado |
| **RF-MCP-B3** | Consulta del estado de una factura     | Devolver el estado, cliente y desglose de una factura a partir de su consecutivo.                              | Cajero / Vendedor           | Media / Deseado |
| **RF-MCP-B4** | Comparativo de ventas entre sucursales | Generar un balance comparativo de ingresos inter-sucursales en un periodo especificado (exclusivo SuperAdmin). | Super Admin                 | Media / Deseado |
| **RF-MCP-B5** | Historial de compras de un cliente     | Extraer los consumos históricos y facturas de un tercero mediante nombre, NIT o teléfono.                      | Cajero / Vendedor           | Media / Deseado |

#### Bloque C - Consultas de Personal, Sucursales y Analítica

| ID            | Nombre de Requisito                        | Descripción                                                                                               | Rol Objetivo                 | Prioridad       |
| :------------ | :----------------------------------------- | :-------------------------------------------------------------------------------------------------------- | :--------------------------- | :-------------- |
| **RF-MCP-C1** | Consulta de métricas globales de ganancias | Exclusivo para SuperAdmin: responder sobre margen bruto y utilidades totales consolidadas.                | Super Admin                  | Alta / Esencial |
| **RF-MCP-C2** | Consulta de personal activo por sucursal   | Indicar el conteo y asignación de empleados activos en una sucursal determinada.                          | Super Admin / Admin Sucursal | Media / Deseado |
| **RF-MCP-C3** | Resumen ejecutivo del dashboard            | Resumen interpretativo de las métricas clave (ventas, alertas, rotación) acotado a la sucursal del token. | Super Admin / Admin Sucursal | Media / Deseado |
| **RF-MCP-C4** | Rendimiento comparado entre sedes          | Identificar sucursales con mejor y menor rendimiento en un rango de fechas (exclusivo SuperAdmin).        | Super Admin                  | Media / Deseado |

#### Bloque D - Interacción Conversacional y Experiencia

| ID            | Nombre de Requisito                         | Descripción                                                                                                         | Alcance | Prioridad       |
| :------------ | :------------------------------------------ | :------------------------------------------------------------------------------------------------------------------ | :------ | :-------------- |
| **RF-MCP-D1** | Aclaración ante solicitudes ambiguas        | Si faltan variables (fechas, sede, producto), el agente debe solicitar aclaración antes de invocar cualquier Tool.  | Todos   | Alta / Esencial |
| **RF-MCP-D2** | Respuesta natural desde datos estructurados | Redactar respuestas fluidas a partir del JSON/DTO devuelto por la Tool, ocultando la estructura técnica al usuario. | Todos   | Alta / Esencial |
| **RF-MCP-D3** | Continuidad de contexto en la sesión        | Mantener el hilo de la conversación permitiendo preguntas continuas sobre el contexto previo.                       | Todos   | Media / Deseado |
| **RF-MCP-D4** | Límite de tiempo de respuesta               | Responder en un tiempo menor a 10 segundos; de presentarse un timeout en la Tool, emitir disculpa y aviso formal.   | Todos   | Alta / Esencial |

---

### Módulo 5: Logística y Gestión de Activos Internos

#### Bloque A - Catálogo de Activos y Áreas

| ID            | Nombre de Requisito              | Descripción                                                                                  | Fuente                       | Prioridad       |
| :------------ | :------------------------------- | :------------------------------------------------------------------------------------------- | :--------------------------- | :-------------- |
| **RF-LOG-A1** | Gestión de categorías de activos | Crear, editar e inactivar familias de activos de trabajo (tecnología, maquinaria, dotación). | Super Admin / Admin Sucursal | Media / Deseado |
| **RF-LOG-A2** | Registro de activo               | Alta de equipo con serial, descripción, sucursal de base, categoría y estado operativo.      | Admin Sucursal               | Alta / Esencial |
| **RF-LOG-A3** | Gestión de áreas organizativas   | Definición de secciones operativas (ej. Mostrador, Bodega) dentro de cada sede.              | Super Admin / Admin Sucursal | Media / Deseado |
| **RF-LOG-A4** | Búsqueda de activos con filtros  | Filtrado de inventario interno según área, estado, categoría y sucursal.                     | Admin Sucursal               | Media / Deseado |
| **RF-LOG-A5** | Baja de un activo                | Desincorporación por extravío, obsolescencia o daño irreparable, preservando histórico.      | Admin Sucursal               | Media / Deseado |

#### Bloque B - Asignación de Activos

| ID            | Nombre de Requisito                       | Descripción                                                                                                    | Fuente                       | Prioridad       |
| :------------ | :---------------------------------------- | :------------------------------------------------------------------------------------------------------------- | :--------------------------- | :-------------- |
| **RF-LOG-B1** | Asignación de activo a empleado           | Asignar un activo a un colaborador individual, marcándolo como no disponible.                                  | Admin Sucursal               | Alta / Esencial |
| **RF-LOG-B2** | Asignación de activo a un área            | Asignar equipos a un área compartida; validación exclusiva: o a persona o a área, nunca ambos simultáneamente. | Admin Sucursal               | Media / Deseado |
| **RF-LOG-B3** | Registro del responsable de la asignación | Registro de trazabilidad del usuario administrativo que formaliza la entrega y la fecha exacta.                | Admin Sucursal               | Alta / Esencial |
| **RF-LOG-B4** | Historial de asignaciones de un activo    | Kardex cronológico de custodios pasados y presentes del elemento.                                              | Admin Sucursal / Super Admin | Media / Deseado |
| **RF-LOG-B5** | Devolución o reasignación                 | Cierre de entrega previa y devolución inmediata a bodega o traspaso a nuevo custodio.                          | Admin Sucursal               | Media / Deseado |

#### Bloque C - Mantenimiento y Ciclo de Vida

| ID            | Nombre de Requisito                    | Descripción                                                                                           | Fuente                       | Prioridad       |
| :------------ | :------------------------------------- | :---------------------------------------------------------------------------------------------------- | :--------------------------- | :-------------- |
| **RF-LOG-C1** | Registro de mantenimiento              | Registro de asistencias preventivas o correctivas con costo, fecha y descripción técnica del trabajo. | Admin Sucursal               | Media / Deseado |
| **RF-LOG-C2** | Bloqueo durante mantenimiento          | Estado "En mantenimiento" que bloquea reasignaciones hasta la culminación formal de la reparación.    | Admin Sucursal               | Alta / Esencial |
| **RF-LOG-C3** | Historial de mantenimientos por activo | Registro cronológico del acumulado de intervenciones mecánicas/técnicas y costos por activo.          | Admin Sucursal / Super Admin | Media / Deseado |
| **RF-LOG-C4** | Consulta de activo vía asistente MCP   | Consultas conversacionales sobre el estado, custodio y área del activo vía servidor MCP según sede.   | Admin Sucursal / Super Admin | Media / Deseado |

---

### 3.1 Requisitos Comunes de las Interfaces

#### 3.1.1 Interfaces de Usuario

- Interfaz web responsiva desarrollada en React y Next.js.
- Menú dinámico renderizado según el rol asignado por RBAC.
- Asistente conversacional embebido en un drawer/panel lateral sin interrumpir
  el flujo de trabajo principal.

#### 3.1.2 Interfaces de Hardware

- Compatibilidad estándar sin hardware propietario.
- Integración plug-and-play con lectores de códigos de barras (emulación de
  teclado) e impresoras térmicas de tickets (ESC/POS).

#### 3.1.3 Interfaces de Software

- **Backend:** Deno + TypeScript + Drizzle ORM comunicándose con MySQL.
- **Servidor MCP:** Servidor intermedio que expone herramientas estructuradas
  consumidas por el agente LLM a través de la especificación Model Context
  Protocol.

#### 3.1.4 Interfaces de Comunicación

- REST API sobre HTTPS con cargas de datos serializadas en JSON.
- Autenticación distribuida mediante tokens JWT en cookies con atributos
  `HttpOnly`, `Secure` y `SameSite`.

---

### 3.2 Requisitos Funcionales Base (Resumen Global)

| Código    | Requisito                         | Tipo      | Prioridad       | Descripción Resumida                                                                             |
| :-------- | :-------------------------------- | :-------- | :-------------- | :----------------------------------------------------------------------------------------------- |
| **RF-01** | Gestión de productos e inventario | Funcional | Alta / Esencial | CRUD de catálogo, SKU, precios, stock, registro de entradas y salidas evitando saldos negativos. |
| **RF-02** | Facturación en punto de venta     | Funcional | Alta / Esencial | Emisión de ventas POS, cálculo de impuestos, validación de stock y generación de consecutivo.    |
| **RF-03** | Gestión de personal y sucursales  | Funcional | Alta / Esencial | CRUD de colaboradores, sedes y control de acceso RBAC.                                           |
| **RF-04** | Administración y panel de control | Funcional | Alta / Esencial | Dashboard con métricas de ventas, rentabilidad consolidada y avisos de stock crítico.            |
| **RF-05** | Seguridad y autenticación         | Funcional | Alta / Esencial | Autenticación JWT, RBAC multi-capa y gestión de sesiones protegidas.                             |
| **RF-06** | Asistente conversacional MCP      | Funcional | Alta / Esencial | Consultas en lenguaje natural apoyadas por Tools MCP restringidas por sucursal y rol.            |
| **RF-07** | Gestión de clientes               | Funcional | Media / Deseado | Directorio de clientes con historial de compras asociado.                                        |

---

### 3.3 Requisitos No Funcionales

#### 3.3.1 Requisitos de Rendimiento

- **RNF-01:** El sistema debe soportar al menos 20 usuarios concurrentes sin
  degradación perceptible.
- **RNF-02:** El 95% de las peticiones de inventario y facturación deben
  resolverse en menos de 2 segundos.
- **RNF-03:** Respuestas del asistente de IA en un tiempo máximo de 10 segundos.

#### 3.3.2 Requisitos de Seguridad

- **RNF-04:** Cifrado de contraseñas mediante hashing con sal (bcrypt o Argon2).
- **RNF-05:** Validación RBAC estricta tanto en cliente (UI) como en
  controlador/casos de uso (backend).
- **RNF-06:** Registro en log de auditoría de toda operación de creación,
  modificación o baja (usuario, fecha, hora, detalle).
- **RNF-07:** El servidor MCP solo expondrá Tools parametrizadas; queda
  prohibida la inyección o ejecución de SQL arbitrario.

#### 3.3.3 Requisitos de Fiabilidad

- **RNF-08:** Degradación elegante: ante cortes del servicio de IA, las
  funciones de facturación, almacén y personal siguen operando de forma
  autónoma.
- **RNF-09:** Operaciones de venta ejecutadas bajo transacciones de base de
  datos atómicas (ACID) para impedir desfases entre ventas y existencias.
- **RNF-10:** Respaldos automáticos diarios de la base de datos con retención de
  los últimos 15 días.

#### 3.3.4 Requisitos de Disponibilidad

- **RNF-11:** Disponibilidad garantizada de al menos el 99% en horario comercial
  (excluyendo ventanas pactadas de soporte).
- **RNF-12:** RTO (Recovery Time Objective) no mayor a 5 minutos ante
  interrupciones del servidor MCP o proveedor de IA.

#### 3.3.5 Requisitos de Mantenibilidad

- **RNF-13:** Adherencia estricta a Clean Architecture: endpoints REST y Tools
  MCP reutilizan el mismo caso de uso sin duplicar reglas de negocio.
- **RNF-14:** Cobertura de pruebas automatizadas mínima del 70% sobre casos de
  uso críticos.
- **RNF-15:** Control de versiones del esquema relacional mediante migraciones
  de Drizzle ORM.

#### 3.3.6 Requisitos de Portabilidad

- **RNF-16:** Backend desplegable en contenedores Docker ejecutando Deno sin
  dependencias de un SO específico.
- **RNF-17:** Compatibilidad visual y funcional en las dos últimas versiones
  estables de navegadores modernos (Chrome, Firefox, Edge) en resoluciones
  desktop y tablet.

---

### 3.4 Otros Requisitos

- **RNF-18:** Cumplimiento de la Ley 1581 de 2012 (Habeas Data, Colombia) para
  el tratamiento de datos de personas naturales y jurídicas.
- **RNF-19:** Capacidad de exportación de balances e informes en formatos PDF y
  hojas de cálculo (Excel).

---

## 4. Apéndices

_Documentación complementaria sujeta a adiciones durante el ciclo de vida del
proyecto._
