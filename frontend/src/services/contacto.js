import { API_URL } from '../api'

/**
 * Envía los datos del formulario de contacto al backend de Django.
 * Si el backend rechaza los datos (400), extrae los errores por campo.
 * Si ocurre un fallo de servidor (500), lanza el error correspondiente.
 */
export async function enviarMensajeContacto({ nombre, correo, mensaje }) {
    try {
        const respuesta = await fetch(`${API_URL}/contacto/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nombre: nombre.trim(),
                correo: correo.trim(),
                mensaje: mensaje.trim(),
            }),
        })

        const resultado = await respuesta.json().catch(() => null)

        if (!respuesta.ok) {
            const errorPersonalizado = new Error(resultado?.message || 'Error al procesar el mensaje.')
            // Adjuntamos los errores por campo devueltos por Django REST Framework
            errorPersonalizado.erroresPorCampo = resultado?.errores || {}
            errorPersonalizado.status = respuesta.status
            throw errorPersonalizado
        }

        return resultado
    } catch (error) {
        if (error.erroresPorCampo) {
            throw error
        }
        throw new Error('No se pudo establecer conexión con el servidor backend.')
    }
}