export const LARGO_MINIMO_CONTRASENA = 8

/** Requisitos visuales alineados con los validadores por defecto de Django. */
export function obtenerRequisitosContrasena(password) {
    return [
        {
            texto: `Al menos ${LARGO_MINIMO_CONTRASENA} caracteres`,
            cumple: password.length >= LARGO_MINIMO_CONTRASENA,
        },
        {
            texto: 'No puede ser completamente numérica',
            cumple: password.length > 0 && !/^\d+$/.test(password),
        },
    ]
}

/** Valida contraseña y confirmación en el navegador antes de enviar al backend. */
export function validarCamposContrasena(password, confirmar) {
    const errores = {}
    if (!password) {
        errores.password = 'Ingresa una contraseña.'
    } else if (obtenerRequisitosContrasena(password).some(req => !req.cumple)) {
        errores.password = 'La contraseña no cumple los requisitos mínimos.'
    }

    if (!confirmar) {
        errores.confirmar = 'Repite la contraseña.'
    } else if (confirmar !== password) {
        errores.confirmar = 'Las contraseñas no coinciden.'
    }
    return errores
}