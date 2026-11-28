import { solicitar } from '../api'
import { obtenerSesionCarrito } from './carrito'

const CLAVE_ULTIMO_PEDIDO = 'ultimo_pedido'
// Claves de las compras como invitado: { idPedido: clave }. Con ellas el invitado consulta su orden.
const CLAVE_PEDIDOS_INVITADO = 'pedidos_invitado'
// Marca de que el cliente eligió "Continuar como invitado" en esta sesión del navegador.
const CLAVE_MODO_INVITADO = 'compra_invitado'

function leerClavesInvitado() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_PEDIDOS_INVITADO)) || {}
  } catch {
    return {}
  }
}

/** Guarda la clave que entregó el backend para una orden creada como invitado. */
function guardarClaveInvitado(pedidoId, clave) {
  if (!pedidoId || !clave) return
  const claves = leerClavesInvitado()
  claves[pedidoId] = clave
  localStorage.setItem(CLAVE_PEDIDOS_INVITADO, JSON.stringify(claves))
}

/** Cabecera con la clave del invitado para una orden, si la tiene guardada. */
function cabeceraInvitado(pedidoId) {
  const clave = leerClavesInvitado()[pedidoId]
  return clave ? { 'X-Pedido-Token': clave } : {}
}

/** El cliente eligió comprar sin cuenta (dura mientras la pestaña siga abierta). */
export function activarModoInvitado() {
  sessionStorage.setItem(CLAVE_MODO_INVITADO, '1')
}

export function esModoInvitado() {
  return sessionStorage.getItem(CLAVE_MODO_INVITADO) === '1'
}

export function desactivarModoInvitado() {
  sessionStorage.removeItem(CLAVE_MODO_INVITADO)
}

/**
 * Confirma el carrito en el backend. No envía datos de tarjeta ni realiza cobros:
 * el pedido queda PENDIENTE hasta que se complete el flujo de pago.
 */
export async function crearPedido(cliente, operacionId) {
  const resultado = await solicitar('/pedidos/', {
    method: 'POST',
    auth: false,
    conToken: true,
    datos: {
      session_id: obtenerSesionCarrito(),
      cliente_nombre: cliente.nombre.trim(),
      cliente_email: cliente.correo.trim(),
      tipo_entrega: 'despacho',
      direccion_entrega: `${cliente.direccion.trim()}, ${cliente.comuna.trim()}`,
      notas: `Medio de pago solicitado: ${cliente.metodo_pago}. Sin datos de tarjeta.`,
      // mismo identificador en cada reintento para que el backend no cree otra orden
      operacion_id: operacionId,      
    },
  })

  const pedido = normalizarPedido(resultado.pedido, cliente.metodo_pago)
  // compra como invitado: el backend entrega una clave para poder consultar la orden sin cuenta
  guardarClaveInvitado(pedido.id, resultado.token_invitado)
  sessionStorage.setItem(CLAVE_ULTIMO_PEDIDO, JSON.stringify(pedido))
  return pedido
}

/** Convierte el pedido del backend (PedidoSerializer) al formato que usa la interfaz. */
export function normalizarPedido(datos, metodoPago = '') {
  const detalles = Array.isArray(datos?.detalles) ? datos.detalles : []
  const items = detalles.map(detalle => {
    const cantidad = Number(detalle.cantidad) || 0
    const precioUnitario = Number(detalle.precio_unitario) || 0
    const subtotal = Number(detalle.subtotal ?? cantidad * precioUnitario) || 0
    return {
      id: detalle.id,
      producto_id: detalle.producto_id,
      nombre: detalle.producto_nombre || 'Producto',
      cantidad,
      precio_unitario: precioUnitario,
      subtotal,
    }
  })
  const totalCalculado = items.reduce((total, item) => total + item.subtotal, 0)

  return {
    id: datos.id,
    codigo: datos.numero_pedido || `PED-${String(datos.id).padStart(6, '0')}`,
    fecha: datos.fecha || datos.creado_en,
    creado_en: datos.creado_en || datos.fecha,
    actualizado_en: datos.actualizado_en,
    estado: datos.estado,
    moneda: datos.moneda || 'CLP',
    pago: datos.pago ? {
      estado: datos.pago.estado,
      fecha_confirmacion: datos.pago.fecha_confirmacion,
      pasarela: datos.pago.pasarela,
      monto: Number(datos.pago.monto) || 0,
    } : null,
    cliente: {
      nombre: datos.cliente_nombre || '',
      correo: datos.cliente_email || '',
      direccion: datos.direccion_entrega || '',
      metodo_pago: metodoPago,
    },
    items,
    total_unidades: items.reduce((total, item) => total + item.cantidad, 0),
    subtotal: Number(datos.subtotal ?? totalCalculado) || 0,
    costo_envio: Number(datos.costo_envio) || 0,
    total: Number(datos.total ?? totalCalculado) || 0,
  }
}

/**
 * Consulta el estado/resumen real de un pedido desde el backend.
 * Conserva datos locales no persistidos por backend (medio de pago solicitado).
 */
export async function obtenerPedido(id, signal) {
  // con sesión se usa el token de la cuenta; sin sesión, la clave de invitado de esa orden
  const resultado = await solicitar(`/pedidos/${encodeURIComponent(id)}/`, {
    signal,
    auth: false,
    conToken: true,
    cabeceras: cabeceraInvitado(id),
  })
  const guardado = leerUltimoPedido()
  const metodoPago = String(guardado?.id) === String(resultado.pedido?.id)
    ? (guardado?.cliente?.metodo_pago || '')
    : ''
  const pedido = normalizarPedido(resultado.pedido, metodoPago)
  if (String(guardado?.id) === String(pedido.id)) {
    sessionStorage.setItem(CLAVE_ULTIMO_PEDIDO, JSON.stringify(pedido))
  }
  return pedido
}

export function leerUltimoPedido() {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE_ULTIMO_PEDIDO))
  } catch {
    return null
  }
}

export function guardarUltimoPedido(pedido) {
  sessionStorage.setItem(CLAVE_ULTIMO_PEDIDO, JSON.stringify(pedido))
}

export function borrarUltimoPedido() {
  sessionStorage.removeItem(CLAVE_ULTIMO_PEDIDO)
}
