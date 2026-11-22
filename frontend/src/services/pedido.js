import { solicitar } from '../api'
import { obtenerSesionCarrito } from './carrito'

const CLAVE_ULTIMO_PEDIDO = 'ultimo_pedido'

/**
 * Confirma el carrito en el backend. No envía datos de tarjeta ni realiza cobros:
 * el pedido queda PENDIENTE hasta que un administrador registre el pago.
 */
export async function crearPedido(cliente) {
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
    },
  })

  const pedido = normalizarPedido(resultado.pedido, cliente.metodo_pago)
  sessionStorage.setItem(CLAVE_ULTIMO_PEDIDO, JSON.stringify(pedido))
  return pedido
}

/** Convierte el pedido del backend (PedidoSerializer) al formato que usa la interfaz. */
export function normalizarPedido(datos, metodoPago = '') {
  const detalles = Array.isArray(datos?.detalles) ? datos.detalles : []
  return {
    id: datos.id,
    codigo: `PED-${String(datos.id).padStart(6, '0')}`,
    fecha: datos.creado_en,
    estado: datos.estado,
    pago: datos.pago ? { estado: datos.pago.estado, fecha_confirmacion: datos.pago.fecha_confirmacion } : null,
    cliente: {
      nombre: datos.cliente_nombre,
      correo: datos.cliente_email,
      direccion: datos.direccion_entrega,
      metodo_pago: metodoPago,
    },
    items: detalles.map(detalle => ({
      id: detalle.id,
      producto_id: detalle.producto_id,
      nombre: detalle.producto_nombre,
      cantidad: detalle.cantidad,
      precio_unitario: Number(detalle.precio_unitario),
      subtotal: Number(detalle.subtotal),
    })),
    total_unidades: detalles.reduce((total, detalle) => total + Number(detalle.cantidad), 0),
    total: Number(datos.total),
  }
}

/**
 * Consulta el estado actual de un pedido del cliente autenticado y actualiza
 * la copia guardada en la sesión, conservando el medio de pago elegido.
 */
export async function obtenerPedido(id, signal) {
  const resultado = await solicitar(`/pedidos/${encodeURIComponent(id)}/`, { signal })
  const guardado = leerUltimoPedido()
  const metodoPago = guardado?.id === resultado.pedido.id ? guardado.cliente?.metodo_pago : ''
  const pedido = normalizarPedido(resultado.pedido, metodoPago)
  if (guardado?.id === pedido.id) sessionStorage.setItem(CLAVE_ULTIMO_PEDIDO, JSON.stringify(pedido))
  return pedido
}

export function leerUltimoPedido() {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE_ULTIMO_PEDIDO))
  } catch {
    return null
  }
}

export function borrarUltimoPedido() {
  sessionStorage.removeItem(CLAVE_ULTIMO_PEDIDO)
}
