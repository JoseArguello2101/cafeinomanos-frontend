import { solicitar } from '../api'

/** Guarda el token y el perfil del usuario en el navegador. */
export function guardarSesion(token, usuario) {
    localStorage.setItem('token', token)
    localStorage.setItem('usuario', JSON.stringify(usuario))
}

/** Registra una nueva cuenta de cliente activo y guarda su sesión. */
export async function registrarCliente({ nombre, apellido, email, password }) {
    const resultado = await solicitar('/registro/', {
        method: 'POST',
        auth: false,
        datos: {
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            email: email.trim().toLowerCase(),
            password,
        },
    })

    if (!resultado?.token || !resultado?.usuario) {
        throw new Error('El servidor no devolvió una sesión válida al registrar la cuenta.')
    }

    guardarSesion(resultado.token, resultado.usuario)
    return resultado
}