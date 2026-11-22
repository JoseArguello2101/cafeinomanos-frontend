import { solicitar } from '../api'

// Clave de sessionStorage donde se guarda el intento de pago en curso (para la pasarela y el retorno).
const CLAVE_INTENTO_PAGO = 'intento_pago'

/**
 * Pide al backend crear (o recuperar) el intento de pago de prueba de un pedido.
 * El monto y la moneda los calcula el backend; el front solo envía el id del pedido.
 * Devuelve { pedidoId, token, url, monto, moneda, reutilizado }.
 */
export async function iniciarPago(pedidoId) {
  const resultado = await solicitar(`/pedidos/${encodeURIComponent(pedidoId)}/pago/iniciar/`, {
    method: 'POST',
    auth: false,
    conToken: true,
  })
  const intento = {
    pedidoId,
    token: resultado.token,
    url: resultado.url,
    monto: Number(resultado.monto) || 0,
    moneda: resultado.moneda || 'CLP',
    reutilizado: Boolean(resultado.reutilizado),
  }
  sessionStorage.setItem(CLAVE_INTENTO_PAGO, JSON.stringify(intento))
  return intento
}

/**
 * Envía al backend el token que devolvió la pasarela para que verifique el resultado del pago.
 * Si el pago fue rechazado o no coincide con el pedido, el backend responde 400 y se lanza un error.
 */
export function verificarRetornoPago(pedidoId, token) {
  return solicitar(`/pedidos/${encodeURIComponent(pedidoId)}/pago/retorno/`, {
    method: 'POST',
    auth: false,
    conToken: true,
    datos: { token_ws: token },
  })
}

/** Lee el intento de pago guardado en la sesión (o null si no hay). */
export function leerIntentoPago() {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE_INTENTO_PAGO))
  } catch {
    return null
  }
}

/** Borra el intento de pago guardado (al terminar la verificación). */
export function borrarIntentoPago() {
  sessionStorage.removeItem(CLAVE_INTENTO_PAGO)
}
