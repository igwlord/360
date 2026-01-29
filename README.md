# 360 Retail Media Command Center

Plataforma integral de gestión Retail Media con capacidades offline-first y PWA.

## 🚀 Características

- **Dashboard Estratégico y Operacional**: Visualización de métricas, ROI, y KPIs
- **Gestión de Campañas**: Creación, edición y seguimiento de campañas
- **Calendario de Eventos**: Planificación y gestión de eventos especiales
- **Directorio de Proveedores**: Base de datos de contactos y proveedores
- **Tarifario**: Gestión de tarifas y recursos
- **Facturación**: Control de facturación y transacciones
- **Reportes**: Generación de reportes en PDF y Excel
- **PWA**: Instalable como aplicación nativa con soporte offline

## 🛠️ Stack Tecnológico

### Frontend
- **React 19.2.0** - Framework UI
- **Vite 7.2.4** - Build tool y dev server
- **React Router 7.12.0** - Enrutamiento
- **TanStack Query 5.90.19** - Estado del servidor y caché
- **Tailwind CSS 4.1.18** - Estilos
- **Lucide React** - Iconos
- **Recharts** - Gráficos y visualizaciones
- **jsPDF** - Generación de PDFs

### Backend
- **Supabase** - Backend as a Service
  - Autenticación
  - Base de datos PostgreSQL
  - Real-time subscriptions

### Testing
- **Cypress 15.9.0** - Tests E2E

### PWA
- **Vite PWA Plugin** - Service Workers y Workbox
- **IndexedDB** - Persistencia offline

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Ejecutar linter
npm run lint

# Ejecutar tests E2E
npx cypress open
```

## 🏗️ Arquitectura

```
src/
├── components/        # Componentes reutilizables
│   ├── common/       # Componentes comunes
│   ├── dashboard/    # Componentes del dashboard
│   └── projects/     # Componentes de proyectos
├── context/          # Context providers (Auth, Theme, etc.)
├── hooks/            # Custom hooks
├── layout/           # Layouts de la aplicación
├── pages/            # Páginas principales
├── services/         # Servicios y repositorios
├── supabase/         # Configuración de Supabase
├── utils/             # Utilidades
└── lib/              # Librerías y configuraciones
```

## 🎨 Temas

La aplicación soporta 3 temas personalizables:

- **Tilo**: Tema claro con acentos verdes
- **Deep**: Tema oscuro con acentos naranjas
- **Lirio**: Tema de alto contraste

## 🔐 Autenticación

La aplicación utiliza Supabase Auth para la autenticación. Los usuarios deben iniciar sesión para acceder a las funcionalidades.

## 📱 PWA

La aplicación es una Progressive Web App (PWA) que puede:
- Instalarse en dispositivos móviles y desktop
- Funcionar offline con sincronización automática
- Cachear recursos para mejor performance

## 🧪 Testing

Los tests E2E están configurados con Cypress. Para ejecutarlos:

```bash
# Modo interactivo
npx cypress open

# Modo headless
npx cypress run
```

## 📝 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Crea el build de producción
- `npm run preview` - Preview del build de producción
- `npm run lint` - Ejecuta el linter

## 🔧 Configuración

### Variables de Entorno

Crear un archivo `.env` con las siguientes variables:

```
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima
```

## 📄 Licencia

Privado - Todos los derechos reservados

## 👥 Contribución

Este es un proyecto privado. Para contribuciones, contactar al equipo de desarrollo.
