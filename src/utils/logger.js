/**
 * Logging centralizado para errores críticos y observabilidad.
 * Permite enviar a consola y, en el futuro, a un servicio externo (Sentry, etc.).
 */

const PREFIX = '[Focus360]';

/** En producción se puede cambiar a false para no loguear en consola */
const logToConsole = typeof window !== 'undefined';

/**
 * Registra un error crítico (API, sync, runtime).
 * @param {string} context - Módulo o contexto (ej: 'Sync', 'Campaigns', 'ErrorBoundary')
 * @param {Error|string} error - Error o mensaje
 * @param {Record<string, unknown>} [meta] - Datos adicionales para diagnóstico
 */
export function logError(context, error, meta = {}) {
  const payload = {
    level: 'error',
    context,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...meta,
    ts: new Date().toISOString(),
  };
  if (logToConsole) {
    console.error(`${PREFIX} [${context}]`, error, meta);
  }
  // Punto de extensión: enviar a Sentry, backend, etc.
  if (typeof window !== 'undefined' && window.__focus360_logError) {
    window.__focus360_logError(payload);
  }
}

/**
 * Registra una advertencia (datos inesperados, fallbacks).
 * @param {string} context - Módulo o contexto
 * @param {string} message - Mensaje
 * @param {Record<string, unknown>} [meta]
 */
export function logWarn(context, message, meta = {}) {
  if (logToConsole) {
    console.warn(`${PREFIX} [${context}]`, message, meta);
  }
}

/**
 * Registra información para diagnóstico (solo en desarrollo).
 * @param {string} context - Módulo
 * @param {string} message - Mensaje
 * @param {Record<string, unknown>} [meta]
 */
export function logInfo(context, message, meta = {}) {
  if (logToConsole && (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV)) {
    console.info(`${PREFIX} [${context}]`, message, meta);
  }
}

export default { logError, logWarn, logInfo };
