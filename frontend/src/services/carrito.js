import { solicitar } from '../api'
import { imagenPorProducto } from '../productos'

const CLAVE_SESION = 'cart_session_id'

/** Evento global para avisar a la navbar que el carrito cambió. */
export const EVENTO_CARRITO = 'carrito:actualizado'

function recordarSesion(sessionId) {
  if (sessionId) localStorage.setItem(CLAVE_SESION, sessionId)
}

/** Token firmado por el backend que identifica el carrito anónimo. */
export function obtenerSesionCarrito() {
  return localStorage.getItem(CLAVE_SESION) || undefined
}

function normalizarItem(item) {
  const nombre = item?.nombre || 'Producto'
  return {
    id: item?.id,
    producto_id: item?.producto_id,
    nombre,
    cantidad: Number(item?.cantidad) || 0,
    precio_unitario: Number(item?.precio_unitario) || 0,
    subtotal: Number(item?.subtotal) || 0,
    imagen_url: item?.imagen_url || imagenPorProducto({ nombre }),
  }
}

/** Agrega un producto al carrito del backend y recuerda la sesión anónima asignada. */
export async function agregarAlCarrito(productoId, cantidad = 1) {
  const sessionIdGuardado = obtenerSesionCarrito()
  const resultado = await solicitar('/carrito/agregar/', {
    method: 'POST',
    auth: false,
    conToken: true,
    datos: {
      producto_id: Number(productoId),
      cantidad: Number(cantidad),
      session_id: sessionIdGuardado,
    },
  })
  recordarSesion(resultado?.session_id)
  return resultado
}

/** Elimina una línea del carrito. Devuelve el stock solo si esa línea lo había descontado. */
export async function eliminarDelCarrito(itemId) {
  const resultado = await solicitar(`/carrito/eliminar/${itemId}/`, {
    method: 'DELETE',
    auth: false,
    conToken: true,
    datos: { session_id: obtenerSesionCarrito() },
  })
  recordarSesion(resultado?.session_id)
  return resultado
}

/** Obtiene el carrito actual del backend (por sesión anónima o por usuario autenticado). */
export async function obtenerCarrito(signal) {
  const sessionId = obtenerSesionCarrito()
  const consulta = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ''
  const resultado = await solicitar(`/carrito/${consulta}`, { signal, auth: false, conToken: true })
  recordarSesion(resultado?.session_id)

  const carrito = resultado?.carrito
  if (!carrito || !Array.isArray(carrito.items)) {
    throw new Error('El backend no devolvió un carrito válido.')
  }
  return {
    session_id: resultado.session_id,
    items: carrito.items.map(normalizarItem),
    total_unidades: Number(carrito.total_unidades) || 0,
    total: Number(carrito.total) || 0,
    actualizado_en: carrito.actualizado_en,
  }
}
