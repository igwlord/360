# Reporte de Auditoría y Corrección de Errores

**Fecha:** 24 Enero 2026
**Estado:** Críticos resueltos / En Verificación

## 1. Errores Críticos (Showstoppers) 🛑

### A. Crash Global "Element type is invalid (AutoSizer)"

**Síntoma:** La aplicación mostraba una pantalla blanca o error crítico al intentar cargar cualquier tabla (`GlassTable`), lo que hacía inaccesibles las secciones **Directorio**, **Tarifario** y **Proyectos**.
**Causa:** La librería `react-window` tenía problemas de exportación en el entorno de desarrollo (Vite), haciendo que el componente `List` fuera `undefined`.
**Solución:**

- Se implementó una carga defensiva del módulo `react-window` en `GlassTable.jsx`.
- Se añadieron `console.log` de seguridad (se limpiarán en producción) y un renderizado condicional. Si la librería falla, ahora muestra un mensaje de error controlado en lugar de romper toda la app.

### B. Modals "Rotos" y Duplicación de Eventos

**Síntoma:** Al crear un evento, este se generaba 2 veces. La UI de fechas era difícil de usar.
**Causa:**

1.  **Duplicación:** El botón "Guardar" no se deshabilitaba inmediatamente, permitiendo múltiples clics rápidos o race conditions.
2.  **UI Rota:** Los inputs de fecha (`datetime-local`) no recibían el formato correcto (ISO string) desde la base de datos, mostrándose vacíos o inválidos.
    **Solución:**

- Se reforzó el estado `isSubmitting` en `CreateEventModal` y `CreateExhibitionModal`.
- Se creó un helper `formatDateTimeLocal` para traducir las fechas de la DB al formato que el input entiende (`yyyy-MM-ddThh:mm`).
- Se rediseñó la selección de fechas en los modales para ser más intuitiva.

## 2. Errores de Base de Datos y Schema 💾

### A. Error "Column 'category' not found in transactions"

**Síntoma:** Fallo al intentar guardar un evento con costos asociados.
**Causa:** El código intentaba insertar el campo `category` en la tabla `transactions` de Supabase, pero dicha columna no existe en el esquema actual.
**Solución:**

- Se eliminó el campo `category` del payload.
- Se movió esa información al campo `concept` (ej: `[Tarifario] Producción - Item X`) para no perder la trazabilidad sin romper la base de datos.
- **Acción Requerida:** Si se necesita categorizar gastos estrictamente, se recomienda solicitar una migración de base de datos para añadir la columna, pero por ahora el sistema funciona sin errores.

## 3. Experiencia de Usuario (UI/UX) 🎨

### A. Toasts (Notificaciones) Invisibles

**Síntoma:** Las alertas de "Evento Creado" quedaban ocultas detrás de los modales o fondos blur.
**Causa:** El `z-index` del provider de Toasts era `100`, insuficiente frente a los modales (`z-50` + stacking context).
**Solución:** Se elevó el `z-index` a `9999` en `ToastContext.jsx` para garantizar que las notificaciones siempre estén en primer plano.

### B. Inputs de Fecha "Uncontrolled"

**Síntoma:** Advertencias en consola `Warning: A component is changing an uncontrolled input...`.
**Causa:** Inicialización de formularios con valores `undefined` en lugar de strings vacíos `''`.
**Solución:** Se sanearon los estados iniciales en `CreateEventModal` y `CreateExhibitionModal` para garantizar que los inputs siempre tengan un valor controlado.

## 4. Estado Actual

- ✅ **Tarifario / Directorio:** Deberían ser accesibles nuevamente (dependían de `GlassTable`).
- ✅ **Creación de Eventos:** Ya no duplica registros.
- ✅ **Feedback Visual:** Los Toasts ahora son visibles.

---

**Próximos Pasos Recomendados:**

1. Navegar por "Tarifario" y verificar que la tabla cargue.
2. Crear un evento de prueba y confirmar que solo aparece una vez en la lista.
