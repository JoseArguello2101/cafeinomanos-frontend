import { solicitar } from '../api'

// Valida si el enlace de activacion sigue vigente (publico, sin token de sesion).
export function validarActivacion(token, signal) {
  return solicitar(`/activacion/validar/?token=${encodeURIComponent(token)}`, { auth: false, signal })
}

// Define la contrasena y activa la cuenta (publico, sin token de sesion).
export function confirmarActivacion(token, password) {
  return solicitar('/activacion/confirmar/', {
    auth: false,
    method: 'POST',
    datos: { token, password },
  })
}
