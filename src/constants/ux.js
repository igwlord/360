/**
 * Convenciones UX transversales: botones primarios, estados de carga y mensajes.
 * Uso: importar clases o textos para mantener consistencia en modales y páginas.
 */

/** Clase base para botón primario (acento Focus 360) */
export const PRIMARY_BUTTON_CLASS =
  'bg-[#E8A631] text-black px-6 py-2 rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]';

/** Clase para botón secundario / cancelar */
export const SECONDARY_BUTTON_CLASS =
  'px-4 py-2 text-white/60 hover:text-white text-sm font-bold';

/** Texto mostrado en botón durante guardado */
export const LOADING_BUTTON_LABEL = 'Guardando...';

/** Mensajes de toast estándar (español) */
export const TOAST_MESSAGES = {
  saveError: 'Error al guardar',
  saveSuccess: 'Guardado correctamente',
  requiredField: 'Este campo es obligatorio',
  deleteConfirm: '¿Eliminar? Esta acción no se puede deshacer.',
};
