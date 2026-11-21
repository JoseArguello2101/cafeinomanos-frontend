import { solicitar } from '../api'

/**
 * Envía los datos del formulario de contacto al backend de Django.
 * Los errores por campo del backend quedan en error.erroresPorCampo.
 */
export async function enviarMensajeContacto({ nombre, correo, mensaje }) {
  return solicitar('/contacto/', {
    method: 'POST',
    auth: false,
    datos: {
      nombre: nombre.trim(),
      correo: correo.trim(),
      mensaje: mensaje.trim(),
    },
  })
}
