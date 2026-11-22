export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '')

/** Elimina los datos de sesión guardados en el navegador. */
export function limpiarSesion() {
  localStorage.removeItem('token')
  localStorage.removeItem('usuario')
  localStorage.removeItem('cart_session_id')
}

function primerMensaje(valor) {
  if (Array.isArray(valor)) return valor.map(primerMensaje).join(' ')
  if (valor && typeof valor === 'object') {
    const primeraClave = Object.keys(valor)[0]
    return primeraClave ? primerMensaje(valor[primeraClave]) : ''
  }
  return typeof valor === 'string' ? valor : ''
}

function mensajeDeError(resultado, respuesta) {
  const mensaje = primerMensaje(resultado?.message) ||
    primerMensaje(resultado?.error) ||
    primerMensaje(resultado?.detail) ||
    primerMensaje(resultado?.errores)
  if (mensaje) return mensaje
  if (respuesta.status === 401) return 'Tu sesión no es válida o expiró. Vuelve a iniciar sesión.'
  if (respuesta.status === 403) return 'No tienes permisos para realizar esta acción.'
  return `No se pudo completar la operación (${respuesta.status}).`
}

/**
 * Cliente HTTP único de la aplicación.
 *
 * @param {string} ruta Ruta relativa a API_URL (por ejemplo '/productos/').
 * @param {object} opciones
 * @param {string} opciones.method Método HTTP.
 * @param {any} opciones.datos Cuerpo JSON o FormData.
 * @param {AbortSignal} opciones.signal Señal para cancelar la petición.
 * @param {boolean} opciones.auth true exige token y lo envía; false no lo envía.
 * @param {boolean} opciones.conToken Envía el token si existe aunque auth sea false
 *        (útil para el carrito: identifica al usuario cuando está autenticado).
 */
export async function solicitar(ruta, {
  method = 'GET', datos, signal, auth = true, conToken = false,
} = {}) {
  const token = localStorage.getItem('token')
  if (auth && !token) {
    throw new Error('Inicia sesión con una cuenta administradora del backend para realizar esta acción.')
  }
  const enviarToken = Boolean(token) && (auth || conToken)
  const esFormData = typeof FormData !== 'undefined' && datos instanceof FormData
  let respuesta
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method,
      signal,
      headers: {
        ...(enviarToken ? { Authorization: `Token ${token}` } : {}),
        ...(datos && !esFormData ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(datos ? { body: esFormData ? datos : JSON.stringify(datos) } : {}),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('No se pudo conectar con el backend. Comprueba que esté iniciado e intenta de nuevo.', { cause: error })
  }
  const resultado = await respuesta.json().catch(() => null)
  if (!respuesta.ok) {
    const error = new Error(mensajeDeError(resultado, respuesta))
    error.status = respuesta.status
    error.erroresPorCampo = resultado?.errores || {}
    // Motivo del rechazo que envían algunos endpoints (ej. activación: invalido, expirado o usado).
    error.motivo = resultado?.motivo || ''
    error.data = resultado
    throw error
  }
  return resultado
}
