/**
 * Estados de una orden tal como los ve el cliente.
 *
 * El backend guarda el estado del pedido (PENDIENTE, PAGADO, …) y el de la
 * transacción de pago (INICIADO, AUTORIZADO, RECHAZADO, …). Este módulo los
 * traduce a cinco estados visuales con texto, ícono y acciones, para que el
 * color nunca sea la única forma de distinguirlos.
 */

/** Minutos que una orden puede seguir sin pagar antes de mostrarse como vencida. */
export const MINUTOS_VIGENCIA_PAGO = 30

const ESTADOS_PEDIDO_CONFIRMADO = ['PAGADO', 'CONFIRMADO', 'PREPARANDO', 'LISTO', 'ENTREGADO']

/** Acciones que puede ofrecer un estado. `destino` indica un enlace; sin él, la página decide qué hacer. */
export const ACCIONES = {
  actualizar: { etiqueta: 'Actualizar estado' },
  reintentar: { etiqueta: 'Reintentar' },
  nueva: { etiqueta: 'Nueva compra' },
  seguir: { etiqueta: 'Seguir comprando', destino: '/catalogo' },
  carrito: { etiqueta: 'Volver al carrito', destino: '/carrito' },
  contacto: { etiqueta: 'Contactar a la cafetería', destino: '/contacto' },
  pedido: { etiqueta: 'Ver mi pedido', destino: '/confirmacion' },
}

export const ESTADOS_ORDEN = {
  pendiente: {
    etiqueta: 'Pendiente de pago',
    icono: '⏳',
    descripcion: 'Tu orden está registrada y espera el pago. Aún no se ha realizado ningún cobro.',
    acciones: ['actualizar', 'seguir'],
  },
  verificando: {
    etiqueta: 'Verificando pago',
    icono: '↻',
    descripcion: 'Estamos confirmando el pago con la pasarela. Esto puede tardar unos segundos.',
    acciones: ['actualizar'],
  },
  confirmada: {
    etiqueta: 'Confirmada',
    icono: '✓',
    descripcion: 'El pago fue aprobado y tu orden está confirmada. Te avisaremos por correo cuando avance.',
    acciones: ['nueva', 'seguir'],
  },
  rechazada: {
    etiqueta: 'Rechazada',
    icono: '✕',
    descripcion: 'El pago no fue aprobado y no se realizó ningún cobro. Revisa tu carrito e inténtalo de nuevo.',
    acciones: ['carrito', 'reintentar', 'contacto'],
  },
  vencida: {
    etiqueta: 'Vencida',
    icono: '⌛',
    descripcion: `La orden no se pagó dentro de ${MINUTOS_VIGENCIA_PAGO} minutos y ya no está vigente. Puedes armar una nueva compra.`,
    acciones: ['carrito', 'seguir'],
  },
}

function aFecha(valor) {
  if (!valor) return null
  const fecha = new Date(String(valor).replace(' ', 'T'))
  return Number.isNaN(fecha.getTime()) ? null : fecha
}

/**
 * Calcula el estado visual de una orden.
 * @param {{estado?: string, fecha?: string, creado_en?: string, pago?: {estado?: string} | null}} pedido
 * @param {Date} ahora Momento de referencia (inyectable para pruebas).
 * @returns {'pendiente'|'verificando'|'confirmada'|'rechazada'|'vencida'}
 */
export function estadoDeOrden(pedido, ahora = new Date()) {
  const estadoPedido = String(pedido?.estado || '').toUpperCase()
  const estadoPago = String(pedido?.pago?.estado || '').toUpperCase()

  // pago aprobado pero el backend aún no consolida el inventario
  if (estadoPedido === 'CONFIRMACION_PENDIENTE') return 'verificando'
  if (ESTADOS_PEDIDO_CONFIRMADO.includes(estadoPedido) || estadoPago === 'AUTORIZADO') return 'confirmada'
  if (estadoPago === 'RECHAZADO') return 'rechazada'
  if (estadoPedido === 'CANCELADO') return 'vencida'

  const creado = aFecha(pedido?.creado_en || pedido?.fecha)
  if (creado && ahora - creado > MINUTOS_VIGENCIA_PAGO * 60 * 1000) return 'vencida'

  if (estadoPago === 'INICIADO') return 'verificando'
  return 'pendiente'
}
