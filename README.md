# Sistema de Inclusión Laboral para Personas con Discapacidad (SILPPD)

## Vista del sistema

![Vista del sistema](preview.png)

Plataforma web desarrollada como proyecto académico para facilitar la conexión entre personas con discapacidad y oportunidades laborales, promoviendo la inclusión laboral mediante herramientas digitales accesibles.

## Características Principales

- **Arquitectura Desacoplada**: Separación estricta de HTML, CSS y JS para mejorar la mantenibilidad (ISO/IEC 25010).
- **Gestión Multi-rol**: Soporte nativo para Usuarios (Candidatos), Empresas y Administradores.
- **Seguridad y Privacidad**: Implementación de políticas de protección de datos según Ley 29733 (Perú).
- **Diseño Inclusivo**: Interfaz optimizada para accesibilidad basada en estándares ISO 21542.
- **Sistema de Mensajería**: Chat en tiempo real para comunicación directa admin-usuario.
- **Paneles de Control**: Dashboards analíticos para seguimiento de métricas e inserción laboral.

## Estándares y Normativas

El desarrollo de este sistema se rige bajo los siguientes estándares internacionales y nacionales para asegurar la calidad y accesibilidad:

- **ISO/IEC 25010**: Modelo de calidad de software (Mantenibilidad y Seguridad).
- **ISO/IEC 12207**: Calidad en los procesos del ciclo de vida del software.
- **ISO 27001**: Gestión de la seguridad de la información y ciberseguridad.
- **ISO 30415**: Gestión de la diversidad e inclusión en entornos laborales.
- **ISO 9999**: Productos de apoyo para personas con discapacidad.
- **Ley N.º 29733 & Ley N.º 29973**: Normativa legal peruana de protección de datos y discapacidad.

## Control de Calidad (Metodologías Ágiles)

El proyecto cuenta con un flujo de **Agile Testing** que incluye:
- Pruebas funcionales E2E para flujos críticos (Registro, Postulación, Validación).
- Pruebas unitarias para la capa de persistencia local.
- Auditorías de cumplimiento normativo integradas en el panel de configuración.

## Credenciales de Prueba (Testing Accounts)

Para facilitar el testeo por parte de evaluadores o personal de QA, se han configurado los siguientes accesos directos:

| Rol | Correo Electrónico | Contraseña |
| :--- | :--- | :--- |
| **Administrador** | `admin@talentoinclusivo.com` | `admin123` |
| **Empresa (Demo)** | `empresa@talentoinclusivo.com` | `empresa123` |
| **Usuario (Demo)** | `usuario@talentoinclusivo.com` | `usuario123` |

## Tecnologías utilizadas

- HTML5, CSS3, JavaScript (Vanilla JS & ES6+)
- Bootstrap 5.3.3
- FontAwesome 6.5.1
- Chart.js (Analíticas y Reportes)

## Estructura del Proyecto

```
SILPPD
│
├── Admin/        # Módulo administrativo (Dashboards, Gestión, Configuración)
├── User/         # Módulo de candidatos (Perfil, Seguimiento, Mensajería)
├── Empresa/      # Módulo de empresas (Dashboard, Gestión de Ofertas)
├── BD/           # Capa de persistencia local y autenticación (Data.js, Auth.js)
├── scratch/      # Scripts de pruebas unitarias y automatización
└── login.html    # Punto de entrada principal
```

## Instalación y Uso

1. Clonar el repositorio:
   `git clone https://github.com/Jose-Is-gb/SILPPD.git`
2. Abrir el archivo `login.html` en el navegador.
3. Utilizar las **Credenciales de Prueba** mencionadas arriba para una exploración rápida.

## 🌐 Demo

[🚀 Ver aplicación en línea](https://jose-is-gb.github.io/SILPPD/login.html)

## Autor

**José Gerónimo Benavides**  
Estudiante de Ingeniería de Sistemas  
Lima, Perú
