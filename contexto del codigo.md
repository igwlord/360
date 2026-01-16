📑 CTO DESIGN BRIEF: 360 HUB (Production Ready)

Proyecto: 360 Hub - Plataforma de Gestión de Trade Marketing

Versión: 1.0.0 (Candidate for Release)

Fecha: 15 Enero 2026

Objetivo: Migración de Prototipo "Single-File" a Arquitectura de Producción Escalable, Repositorio Git y Despliegue en Netlify.

1. 🏗️ Arquitectura del Sistema

Stack Tecnológico

Core: React 18+ (Vite recomendado para el build).

Lenguaje: JavaScript (ES6+) / Opción a TypeScript si se prefiere tipado estricto.

Estilos: Tailwind CSS (Uso extensivo de utilidades, opacidad y colores custom).

Iconografía: lucide-react.

Estado: React Context API (para manejo de Temas y Datos Globales) o Zustand.

Enrutamiento: react-router-dom (v6+).

Estilo Visual (Design System)

El sistema utiliza un lenguaje de diseño "Botanical Modern" con fuerte uso de Glassmorphism.

Motor de Temas: El sistema debe soportar cambio de temas en caliente (Hot-swap).

Tilo (Default): Fondos Salvia (#AEB8A8), Tarjetas Oliva (#80917D/40), Acentos Dorados (#EEA83B).

Deep (Dark Mode): Fondos Azul Noche (#0f172a), Tarjetas Pizarra (#1e293b/60), Acentos Oro Intenso (#FCA311).

Lirio (High Contrast): Fondos Tierra (#E6DCD3), Tarjetas Borravino (#58181F/80), Acentos Oro Clásico (#D4AF37).

2. 🧩 Estructura de Componentes (Refactoring Plan)

El código actual reside en un solo archivo App.jsx. Para producción, debe dividirse en la siguiente estructura de directorios:

/src
/assets (Fuentes, imágenes estáticas)
/components
/common (Button, Input, Modal, Tooltip, ContextMenu, Toast)
/layout (Sidebar/NavDock, MainLayout)
/dashboard (BentoGrid, BudgetWidget, CampaignWidget)
/calendar (CalendarGrid, FilterBar)
/directory (ContactCard, GroupAccordion)
/ratecard (RateCardGrid, RateItemModal)
/context (ThemeContext, DataContext)
/hooks (useTheme, useContextMenu, useLocalStorage)
/data (initialData.js - Migrado de los CSVs)
/pages (Home, Calendar, Users, RateCard, Reports, Settings)
App.jsx (Router Setup)
main.jsx (Entry Point)

3. 🚀 Especificación Funcional por Módulo

A. Navegación (Layout)

Dock Flotante: Barra lateral izquierda con efecto glass, responsiva.

Rutas: Dashboard (/), Calendario (/calendar), Proveedores (/directory), Tarifario (/rates), Reportes (/reports), Configuración (/settings).

B. Dashboard (Home)

Layout: Bento Grid responsivo (CSS Grid).

Widgets Interactivos:

Finanzas: Gráfico de anillo (SVG) animado.

Timeline: Barras de progreso por estado (Color-coded).

Top Partners: Lista priorizada por "Favoritos" (Estrella).

Acceso Rápido: Trigger para acciones globales.

Personalización: Menú "Vista & Filtros" para mostrar/ocultar widgets y filtrar campañas.

C. Calendario

Visualización: Grilla mensual (ej. Febrero 2026).

Filtro Híbrido: Control segmentado (Todo / Campañas / Marketing).

Renderizado:

Campañas: Barras de rango continuo (StartDay -> EndDay).

Marketing: Hitos puntuales con iconos (Emojis/Iconos).

D. Directorio de Proveedores

Estructura UI: Acordeón por categorías (Perfumería, Bebidas, etc.). Estado inicial: Plegado para reducir carga cognitiva.

Tarjeta de Contacto:

Acción Teléfono: Clic revela el número (no llama automáticamente).

Acción Mail: Enlace mailto: directo.

Context Menu (Clic Derecho):

Agregar/Quitar Favorito (⭐).

Mover a... (Submenú con lista de grupos).

Eliminar Contacto.

Gestión: Modales para "Nueva Categoría" y "Nuevo Contacto" con validación simple.

E. Tarifario (Rate Card) - High Priority

Vista: Catálogo visual (Grid de tarjetas) con Pestañas de Categoría superiores (Tabs).

Búsqueda: Input en tiempo real por nombre de activo.

Tarjeta de Activo:

Icono Dinámico: Asignado según categoría (Digital, Señalética, etc.).

Micro-interacción (Notas): Al hacer hover, mostrar tooltip flotante con "Notas Internas" si existen.

Edición: Clic izquierdo abre modal de edición completo.

Context Menu (Clic Derecho): Editar, Mover a categoría, Eliminar.

CRUD: Estado persistente para agregar items, editar precios/specs y borrar.

F. Configuración (Settings)

Selector de Temas: Tarjetas de previsualización para Tilo, Deep y Lirio. Cambio de variables CSS/Tailwind inmediato.

4. 💾 Datos & Persistencia

Estado Inicial: Hidratación desde src/data/initialData.js (basado en los CSVs provistos).

Persistencia Local: Hook useLocalStorage para mantener cambios (nuevos contactos, ediciones de tarifas, tema elegido) entre recargas de página.

5. 🛠️ Instrucciones de Despliegue (DevOps)

Para el Agente de IA (Antigravity):

Inicialización: npm create vite@latest (React + JS/TS).

Dependencias: npm install lucide-react react-router-dom clsx tailwind-merge.

Configuración Tailwind: Definir colores semánticos en tailwind.config.js para soportar los temas.

Netlify:

Crear netlify.toml para manejo de rutas SPA:

[build]
command = "npm run build"
publish = "dist"

[[redirects]]
from = "/\*"
to = "/index.html"
status = 200

Nota Final: Este reporte especifica la lógica de negocio completa, reglas de UI (micro-interacciones, tooltips, menús contextuales) y estructura necesaria para replicar el prototipo "360 Hub" con fidelidad del 100%.
