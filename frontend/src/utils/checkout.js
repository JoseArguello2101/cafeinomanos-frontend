/** Valida los datos de entrega en el navegador con las mismas reglas del backend. */
export function validarDatosEntrega(formulario) {
    const errores = {}
    const nombre = formulario.nombre.trim()
    const correo = formulario.correo.trim()
    const direccion = formulario.direccion.trim()
    const comuna = formulario.comuna.trim()

    if (nombre.length < 2) {
        errores.nombre = 'El nombre debe tener al menos 2 caracteres.'
    } else if (nombre.length > 150) {
        errores.nombre = 'El nombre no puede superar los 150 caracteres.'
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        errores.correo = 'Ingresa un correo válido.'
    }

    if (direccion.length < 5) {
        errores.direccion = 'Ingresa una dirección válida (mínimo 5 caracteres).'
    }

    if (comuna.length < 2) {
        errores.comuna = 'Ingresa una comuna válida.'
    }

    if (`${direccion}, ${comuna}`.length > 255) {
        errores.direccion = 'La dirección y comuna en conjunto no pueden superar 255 caracteres.'
    }

    if (!['tarjeta', 'transferencia'].includes(formulario.metodo_pago)) {
        errores.metodo_pago = 'Selecciona un medio de pago.'
    }

    return errores
}

function unirMensajes(valor) {
    if (Array.isArray(valor)) return valor.join(' ')
    return typeof valor === 'string' ? valor : ''
}

/** Convierte erroresPorCampo del backend (snake_case) a los nombres del formulario de Pago. */
export function mapearErroresPedidoBackend(erroresPorCampo = {}) {
    const mapa = {
        cliente_nombre: 'nombre',
        cliente_email: 'correo',
        direccion_entrega: 'direccion',
    }
    const resultado = {}

    Object.entries(mapa).forEach(([campoBackend, campoFront]) => {
        const texto = unirMensajes(erroresPorCampo[campoBackend])
        if (texto) resultado[campoFront] = texto
    })

    return resultado
}