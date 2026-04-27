# Sistema de Inclusión Laboral para Personas con Discapacidad (SILPPD)

## Vista del sistema

![Vista del sistema](preview.png)

Plataforma web desarrollada como proyecto académico para facilitar la conexión entre personas con discapacidad y oportunidades laborales, promoviendo la inclusión laboral mediante herramientas digitales accesibles.

## Características Principales

- **Arquitectura Basada en la Nube**: Integración completa con Firebase BaaS (Backend as a Service) asegurando alta disponibilidad y escalabilidad.
- **Gestión Multi-rol**: Soporte nativo para Usuarios (Candidatos), Empresas y Administradores.
- **Autenticación Segura**: Sistema de encriptación de contraseñas y correos gestionado por Firebase Authentication, con soporte de recuperación de acceso.
- **Seguridad y Privacidad**: Implementación de políticas de protección de datos según Ley 29733 (Perú).
- **Diseño Inclusivo**: Interfaz optimizada para accesibilidad basada en estándares ISO 21542.
- **Sistema de Mensajería**: Chat en tiempo real, incluyendo soporte para previsualización e intercambio de archivos adjuntos (PDF, Imágenes).
- **Paneles de Control (Dashboards)**: Reportería e indicadores clave para el seguimiento de métricas, ofertas activas e inserción laboral.

## Estándares y Normativas

El desarrollo de este sistema se rige bajo los siguientes estándares internacionales y nacionales para asegurar la calidad y accesibilidad:

- **ISO/IEC 25010**: Modelo de calidad de software (Mantenibilidad y Seguridad).
- **ISO/IEC 12207**: Calidad en los procesos del ciclo de vida del software.
- **ISO 27001**: Gestión de la seguridad de la información y ciberseguridad.
- **ISO 30415**: Gestión de la diversidad e inclusión en entornos laborales.
- **ISO 9999**: Productos de apoyo para personas con discapacidad.
- **Ley N.º 29733 & Ley N.º 29973**: Normativa legal peruana de protección de datos y discapacidad.

## Credenciales de Prueba (Testing Accounts)

Para facilitar el testeo por parte de evaluadores o personal de QA, estas cuentas están pre-configuradas en la base de datos de Firebase:

| Rol | Correo Electrónico | Contraseña |
| :--- | :--- | :--- |
| **Administrador** | `admin@talentoinclusivo.com` | `admin123` |
| **Empresa (Demo)** | `empresa@talentoinclusivo.com` | `empresa123` |
| **Usuario (Demo)** | `usuario@talentoinclusivo.com` | `usuario123` |

## Tecnologías utilizadas

- HTML5, CSS3, JavaScript (Vanilla JS & ES6+)
- Bootstrap 5.3.3 (Framework CSS UIUX)
- FontAwesome 6.5.1
- Chart.js (Analíticas y Reportes)
- **Firebase Firestore** (Base de datos NoSQL de tiempo real)
- **Firebase Authentication** (Gestión de usuarios y cifrado de acceso)
- **Firebase Cloud Storage** (Almacenamiento en la nube de Archivos, Logotipos y CVs)
- **Firebase Hosting** (Despliegue y distribución global)

## Estructura del Proyecto

```
SILPPD
│
├── Admin/        # Módulo administrativo (Dashboards, Gestión de Roles, Validaciones)
├── User/         # Módulo de candidatos (Perfil Interactivo, Seguimiento, y Mensajería)
├── Empresa/      # Módulo de corporativo (Publicación Segura, Criba Curricular de Ofertas)
├── BD/           # Capa conectora a los servicios cloud (Data.js abstract, auth.js)
├── scratch/      # Scripts y logs (Interno QA)
├── Config/       # Configuración global del proyecto (.firebaserc, firebase.json)
└── login.html    # Punto de entrada principal y Gateway al Cloud
```

## Instalación y Uso de Desarrollo

1. Clonar el repositorio:
   `git clone https://github.com/Jose-Is-gb/SILPPD.git`
2. Si deseas desplegar en tu propio Firebase, reemplaza los datos de configuración en `BD/firebase-config.js` por las keys de tu proyecto de Firebase.
3. Desplegar usando las CLI de Firebase (Opcional):
   `firebase deploy --only hosting`

## 🌐 Demo

El aplicativo cuenta con despliegue automático configurado hacia infraestructura de nube.
[🚀 Ver aplicación en línea (Firebase Hosting)](https://silppd-4e248.web.app/login.html)

## Autor

**José Gerónimo Benavides**  
Estudiante de Ingeniería de Sistemas  
Lima, Perú
