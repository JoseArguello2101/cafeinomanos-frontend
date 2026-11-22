import { solicitar } from '../api'
import { imagenPorProducto } from '../productos'

const CLAVE_SESION = 'cart_session_id'
const CLAVE_RETORNO = 'retorno_post_login'

/** Evento global para avisar a la navbar que el carrito cambió. */
export const EVENTO_CARRITO = 'carrito:actualizado'

function recordarSesion(sessionId) {
  if (sessionId) localStorage.setItem(CLAVE_SESION, sessionId)
}

/** Token firmado por el backend que identifica el carrito anónimo. */
export function obtenerSesionCarrito() {
  return localStorage.getItem(CLAVE_SESION) || undefined
}

/**
 * Valida que una ruta de retorno tras el login sea interna y nunca apunte a
 * páginas de administración ni de autenticación.
 */
export function rutaRetornoSegura(ruta) {
  if (typeof ruta !== 'string') return ''
  const limpia = ruta.trim()
  if (!limpia.startsWith('/') || limpia.startsWith('//')) return ''
  const path = limpia.split('?')[0].split('#')[0].toLowerCase()
  if (
    path === '/admin' ||
    path.startsWith('/admin/') ||
    path === '/demo/admin' ||
    path.startsWith('/demo/admin/') ||
    path === '/login' ||
    path === '/registro' ||
    path === '/activar' ||
    path.startsWith('/activar/')
  ) {
    return ''
  }
  return limpia
}

export function guardarRutaRetorno(ruta) {
  const segura = rutaRetornoSegura(ruta)
  if (segura && segura !== '/') sessionStorage.setItem(CLAVE_RETORNO, segura)
}

export function obtenerRutaRetorno(candidata) {
  const directa = rutaRetornoSegura(candidata)
  if (directa) return directa
  const guardada = rutaRetornoSegura(sessionStorage.getItem(CLAVE_RETORNO))
  return guardada || '/'
}

export function limpiarRutaRetorno() {
  sessionStorage.removeItem(CLAVE_RETORNO)
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
    stock: Number(item?.stock) || 0,
    disponible: item?.disponible !== false,
    imagen_url: item?.imagen_url || imagenPorProducto({ nombre }),
  }
}

function formatearRespuestaCarrito(resultado) {
  const carrito = resultado?.carrito
  if (!carrito || !Array.isArray(carrito.items)) {
    throw new Error('El backend no devolvió un carrito válido.')
  }
  const items = carrito.items.map(normalizarItem)
  const inconsistencias = Array.isArray(carrito.inconsistencias)
    ? carrito.inconsistencias
    : (Array.isArray(resultado?.inconsistencias) ? resultado.inconsistencias : [])
  const requiereRevision = Boolean(carrito.requiere_revision ?? resultado?.requiere_revision ?? inconsistencias.length > 0)
  const puedePagar = carrito.puede_pagar !== undefined
    ? Boolean(carrito.puede_pagar)
    : (items.length > 0 && !requiereRevision)

  return {
    session_id: resultado.session_id,
    items,
    total_unidades: Number(carrito.total_unidades) || 0,
    total: Number(carrito.total) || 0,
    actualizado_en: carrito.actualizado_en,
    inconsistencias,
    requiere_revision: requiereRevision,
    puede_pagar: puedePagar,
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

/** Cambia la cantidad de una línea del carrito sin descontar inventario. */
export async function actualizarCantidad(itemId, cantidad) {
  const resultado = await solicitar(`/carrito/actualizar/${itemId}/`, {
    method: 'PATCH',
    auth: false,
    conToken: true,
    datos: {
      cantidad: Number(cantidad),
      session_id: obtenerSesionCarrito(),
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
  return formatearRespuestaCarrito(resultado)
}

/** Valida el carrito en backend antes de pagar. Requiere sesión de cliente activo. */
export async function validarCarrito(itemsEnviados = [], signal) {
  const sessionId = obtenerSesionCarrito()
  try {
    const resultado = await solicitar('/carrito/validar/', {
      method: 'POST',
      signal,
      datos: {
        session_id: sessionId,
        ...(itemsEnviados.length ? { items: itemsEnviados } : {}),
      },
    })
    recordarSesion(resultado?.carrito?.session_id || resultado?.session_id)
    return normalizarValidacion(resultado)
  } catch (error) {
    if (error.data?.carrito) {
      recordarSesion(error.data.carrito.session_id || error.data.session_id)
      return normalizarValidacion(error.data)
    }
    throw error
  }
}

function normalizarValidacion(resultado) {
  const carrito = resultado?.carrito || {}
  return {
    aprobado: Boolean(resultado?.aprobado),
    message: resultado?.message || '',
    errores: Array.isArray(resultado?.errores) ? resultado.errores : [],
    lineas_invalidas: Array.isArray(resultado?.lineas_invalidas) ? resultado.lineas_invalidas : [],
    cambios_precio: Array.isArray(resultado?.cambios_precio) ? resultado.cambios_precio : [],
    carrito: {
      session_id: carrito.session_id,
      items: Array.isArray(carrito.items) ? carrito.items.map(normalizarItemValidado) : [],
      total_unidades: Number(carrito.total_unidades) || 0,
      total: Number(carrito.total) || 0,
    },
  }
}

function normalizarItemValidado(item) {
  const nombre = item?.nombre || 'Producto'
  return {
    id: item?.item_id ?? item?.id,
    producto_id: item?.producto_id,
    nombre,
    cantidad: Number(item?.cantidad) || 0,
    precio_unitario: Number(item?.precio_unitario) || 0,
    subtotal: Number(item?.subtotal) || 0,
    stock: Number(item?.stock_disponible ?? item?.stock) || 0,
    disponible: item?.disponible !== false,
    imagen_url: item?.imagen_url || imagenPorProducto({ nombre }),
  }
}

/** Combina el carrito anónimo (si existe) con el carrito del cliente autenticado tras el login. */
export async function combinarCarrito() {
  const sessionId = obtenerSesionCarrito()
  const resultado = await solicitar('/carrito/combinar/', {
    method: 'POST',
    auth: true,
    datos: sessionId ? { session_id: sessionId } : {},
  })
  recordarSesion(resultado?.session_id)
  return {
    ...formatearRespuestaCarrito(resultado),
    combinado: Boolean(resultado?.combinado),
    productos_combinados: Number(resultado?.productos_combinados) || 0,
    message: resultado?.message || '',
  }
}
