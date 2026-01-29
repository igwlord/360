ODO global – Implementar mejoras y arreglos Focus 360
1. Facturación
F1 – Arreglar creación de transacciones (CRÍTICO)
Revisar handler de “Crear transacción” (front).
Verificar payload hacia backend y validar que la API responda 2xx.
Al éxito: cerrar modal y refrescar lista/resumen.
Al error: mostrar mensaje claro al usuario y loguear error.
F2 – Simplificar formularios de Nueva Transacción
Ingreso: eliminar campos Categoría y Estado.
Egreso: eliminar campos Categoría, Estado y Proveedor.
Ajustar validaciones y tipos para que backend no requiera esos campos.
F3 – Optimizar resumen mensual
Implementar endpoint/resumen que devuelva:
Total Facturado, Costo de Producción, Objetivo mensual.
Mostrar este resumen primero y cargar detalle de transacciones de forma diferida/paginada.
2. Planificación y Campañas
C1 – Reparar schema de campaigns (CRÍTICO)
Auditar migraciones/BD:
Confirmar si columnas type y transactions deben existir.
Corregir:
O bien crear/ajustar columnas en BD,
O eliminar su uso en código si están obsoletas.
Invalidar/regenerar cache de schema en el ORM/cliente.
C2 – Manejo de errores y navegación
En capturas de error de BD:
Mostrar mensaje controlado en UI.
Permitir seguir navegando entre paneles aunque la carga de una vista falle.
Añadir fallback UI para listas/paneles con error.
C3 – Flujo “Proyecto Nuevo” desde campaña
Revisar payload de creación de proyecto/campaña desde el modal.
Separar claramente:
Creación de campaña/proyecto.
Asociación de transacciones (si aplica).
Probar creación, edición y borrado sin errores en BD.
3. Calendario
K1 – Reordenar filtros/leyenda lateral
Ajustar orden y jerarquía:
PROYECTO
Promociones
Eventos comerciales
Especiales
Exhibiciones/temporada
Campañas
K2 – Hacer editables/eliminables los ítems
Conectar ítems “de ejemplo” a entidades reales o tabla editable.
Implementar endpoints (o conectarlos) para:
Editar evento.
Eliminar evento.
Permitir crear nuevo proyecto de campaña desde el calendario, enlazado al módulo de campañas.
K3 – Añadir botón “Guardar” al modal
Agregar botones Guardar y Cancelar.
Implementar lógica de guardado:
Validación de campos.
Llamada a API.
Feedback de “guardando” y “guardado”.
Cerrar modal y refrescar evento tras éxito.
4. Tarifario
T1 – Actualizar menú de categorías
Reemplazar opciones actuales por:
TODOS
OFF LINE / PUNTO DE VENTA
DIGITAL
WEB SITE & LANDING
REDES SOCIALES
EMAIL
REPORTING
PANTALLAS
AGENCIA/PRODUCTORA
ACTIVACIONES
Alinear los valores en BD con esta lista.
T2 – Revisar filtros
Asegurar que selección de categoría filtra correctamente ítems.
Ajustar consultas/queries según nueva taxonomía.
5. Directorio
D1 – Normalizar categorías
Reasignar ítems de Frescos a Perecederos y eliminar Frescos.
Crear categoría Nonfood y actualizar sus ítems.
Integrar Limpieza dentro de Perfumería & Limpieza (ajustar BD y UI).
D2 – Implementar borrado masivo
Añadir checkbox por fila y “Seleccionar todo”.
Crear botón Eliminar que se habilite con selección.
Implementar endpoint de borrado múltiple (lista de IDs).
D3 – Arreglar integración con Microsoft Teams
Revisar formato de URL/deep link a Teams.
Probar en entorno real (navegador + app).
Manejar fallo de apertura con mensaje comprensible.
6. Transversal (para todos los módulos)
X1 – Logging y observabilidad
Centralizar logs de errores críticos (Facturación, Campañas, Calendario).
Añadir trazas mínimas para depurar sin impactar rendimiento.
X2 – Consistencia de UX
Unificar:
Nombres y posiciones de botones (Guardar, Cancelar, Eliminar).
Mensajes de error y confirmación.
Revisar tiempos de carga y, si superan umbrales, añadir loaders/indicadores.
