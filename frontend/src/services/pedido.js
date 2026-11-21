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

  const pedido = {
    id: resultado.pedido.id,
    codigo: `PED-${String(resultado.pedido.id).padStart(6, '0')}`,
    fecha: resultado.pedido.creado_en,
    estado: resultado.pedido.estado,
    cliente: {
      nombre: resultado.pedido.cliente_nombre,
      correo: resultado.pedido.cliente_email,
      direccion: resultado.pedido.direccion_entrega,
      metodo_pago: cliente.metodo_pago,
    },
    items: resultado.pedido.detalles.map(detalle => ({
      id: detalle.id,
      producto_id: detalle.producto_id,
      nombre: detalle.producto_nombre,
      cantidad: detalle.cantidad,
      precio_unitario: Number(detalle.precio_unitario),
      subtotal: Number(detalle.subtotal),
    })),
    total_unidades: resultado.pedido.detalles.reduce(
      (total, detalle) => total + Number(detalle.cantidad), 0
    ),
    total: Number(resultado.pedido.total),
  }

  sessionStorage.setItem(CLAVE_ULTIMO_PEDIDO, JSON.stringify(pedido))
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
