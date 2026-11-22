import { solicitar } from '../api'
import { categoriaCanonica, imagenPorProducto } from '../productos'

/** Avisa a la aplicación que el inventario cambió tras un pedido. */
export const EVENTO_PRODUCTOS = 'productos:actualizados'

// Convierte la lista de imágenes del backend (strings u objetos { url } / { imagen_url })
// en un arreglo de URLs únicas, incluyendo la imagen principal en primer lugar.
function normalizarImagenes(producto) {
  const extras = Array.isArray(producto?.imagenes) ? producto.imagenes : []
  const urls = [producto?.imagen_url, ...extras, producto?.imagen]
    .map(item => (typeof item === 'string' ? item : item?.url || item?.imagen_url || item?.imagen || ''))
    .map(url => String(url || '').trim())
    .filter(Boolean)
  return [...new Set(urls)]
}

export function normalizarProducto(producto) {
  const imagenes = normalizarImagenes(producto)
  const principal = imagenes[0] || ''
  return {
    id: String(producto?.id ?? producto?.identificador ?? ''),
    nombre: producto?.nombre || '',
    descripcion: producto?.descripcion || '',
    categoria: categoriaCanonica(producto?.categoria),
    precio: Number(producto?.precio) || 0,
    stock: Number(producto?.stock) || 0,
    imagen: principal || imagenPorProducto(producto),
    imagenes: imagenes.length ? imagenes : [imagenPorProducto(producto)],
    moneda: producto?.moneda || 'CLP',
    stock_reservado: Number(producto?.stock_reservado) || 0,
    estado: producto?.estado || '',
    activo: producto?.activo ?? producto?.is_active,
    disponible: producto?.disponible,
    disponibilidad: producto?.disponibilidad ||
      (producto?.disponible === false || !(Number(producto?.stock) > 0) ? 'agotado' : 'disponible'),
    formato: producto?.formato || '',
    destacado: Boolean(producto?.destacado),
  }
}

export async function listarProductos(signal) {
  const resultado = await solicitar('/productos/?limit=50', { signal, auth: false })
  if (!Array.isArray(resultado?.data)) throw new Error('La respuesta del backend no tiene el formato esperado.')
  return resultado.data.map(normalizarProducto)
}

const TAMANO_PAGINA_CATALOGO = 50

function paginaCatalogo(pagina, signal) {
  return solicitar(`/catalogo/productos/?page=${pagina}&page_size=${TAMANO_PAGINA_CATALOGO}`, { signal, auth: false })
}

/**
 * Catálogo público: solo productos activos (el backend excluye los inactivos).
 * Pide la primera página y luego el resto en paralelo para no encadenar peticiones.
 */
export async function listarCatalogo(signal) {
  const primera = await paginaCatalogo(1, signal)
  if (!Array.isArray(primera?.data)) throw new Error('La respuesta del catálogo no tiene el formato esperado.')
  const totalPaginas = Number(primera.total_paginas) || 1
  const restantes = await Promise.all(
    Array.from({ length: totalPaginas - 1 }, (_, indice) => paginaCatalogo(indice + 2, signal)),
  )
  const vistos = new Set()
  return [primera, ...restantes]
    .flatMap(resultado => (Array.isArray(resultado?.data) ? resultado.data : []))
    .map(normalizarProducto)
    .filter(producto => producto.estado !== 'inactivo' && !vistos.has(producto.id) && vistos.add(producto.id))
}

const formateadores = new Map()

/** Formatea un precio con su moneda, por ejemplo "$3.800 CLP". */
export function formatearPrecio(precio, moneda = 'CLP') {
  const codigo = String(moneda || 'CLP').toUpperCase()
  if (!formateadores.has(codigo)) {
    try {
      formateadores.set(codigo, new Intl.NumberFormat('es-CL', { style: 'currency', currency: codigo }))
    } catch {
      formateadores.set(codigo, new Intl.NumberFormat('es-CL'))
    }
  }
  return `${formateadores.get(codigo).format(Number(precio) || 0)} ${codigo}`
}

export async function crearProducto(datos) {
  const resultado = await solicitar('/productos/', { method: 'POST', datos })
  if (!resultado?.producto) throw new Error('El backend no devolvió el producto creado.')
  return normalizarProducto(resultado.producto)
}

export async function actualizarProducto(id, datos) {
  const resultado = await solicitar(`/productos/${encodeURIComponent(id)}/`, { method: 'PATCH', datos })
  if (!resultado?.producto) throw new Error('El backend no devolvió el producto actualizado.')
  const producto = normalizarProducto(resultado.producto)
  return {
    ...producto,
    categoria: producto.categoria || datos.categoria || '',
    imagen: producto.imagen || datos.imagen_url || '',
  }
}

export async function eliminarProducto(id) {
  return solicitar(`/productos/${encodeURIComponent(id)}/`, { method: 'DELETE' })
}

export async function subirImagen(archivo) {
  const datos = new FormData()
  datos.append('archivo', archivo)
  const resultado = await solicitar('/subir-imagen/', { method: 'POST', datos })
  return resultado.imagen_url
}
