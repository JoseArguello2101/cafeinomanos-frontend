export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '')

export async function solicitar(ruta, { method = 'GET', datos, signal, auth = true } = {}) {
  const token = localStorage.getItem('token')
  if (auth && !token) throw new Error('Inicia sesión con una cuenta administradora del backend para realizar esta acción.')
  const esFormData = typeof FormData !== 'undefined' && datos instanceof FormData
  let respuesta
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method,
      signal,
      headers: {
        ...(auth && token ? { Authorization: `Token ${token}` } : {}),
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
    const mensaje = resultado?.message || resultado?.error || resultado?.detail
    throw new Error(respuesta.status === 401 ? 'Tu sesión no es válida o expiró. Vuelve a iniciar sesión.' :
      respuesta.status === 403 ? 'No tienes permisos para realizar esta acción.' :
        (Array.isArray(mensaje) ? mensaje.join(' ') : mensaje) || `No se pudo completar la operación (${respuesta.status}).`)
  }
  return resultado
}
