import { solicitar } from '../api'

/** Lista los correos de compra registrados (cliente y administración), solo para administradores. */
export async function listarNotificaciones(signal) {
  const resultado = await solicitar('/admin/notificaciones/', { signal })
  return Array.isArray(resultado?.notificaciones) ? resultado.notificaciones : []
}

/**
 * Reintenta un correo. Devuelve siempre { resultado, mensaje, notificacion } para mostrarlo en el panel:
 * - enviado / fallido / incierto: hubo un intento y `notificacion` trae el registro actualizado.
 * - ya_enviado / requiere_confirmacion: el backend no envió nada (evita duplicados).
 * `confirmarIncierto` se usa cuando el último envío quedó incierto y el administrador acepta reenviarlo.
 */
export async function reintentarNotificacion(id, confirmarIncierto = false) {
  try {
    const respuesta = await solicitar(`/admin/notificaciones/${encodeURIComponent(id)}/reintentar/`, {
      method: 'POST',
      datos: confirmarIncierto ? { confirmar_incierto: true } : {},
    })
    return { resultado: respuesta.resultado, mensaje: respuesta.message, notificacion: respuesta.notificacion }
  } catch (error) {
    // 400 (ya enviado) y 409 (requiere confirmación) son respuestas esperadas: traen el registro y un motivo
    if (error.data?.resultado) {
      return { resultado: error.data.resultado, mensaje: error.message, notificacion: error.data.notificacion }
    }
    throw error
  }
}
