import { solicitar } from '../api'

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
  return {
    id: String(producto?.id ?? producto?.identificador ?? ''),
    nombre: producto?.nombre || '',
    descripcion: producto?.descripcion || '',
    categoria: producto?.categoria || '',
    precio: Number(producto?.precio) || 0,
    stock: Number(producto?.stock) || 0,
    imagen: producto?.imagen_url || imagenes[0] || producto?.imagen || '',
    imagenes,
    estado: producto?.estado || '',
    activo: producto?.activo ?? producto?.is_active,
    disponible: producto?.disponible,
    formato: producto?.formato || '',
    destacado: Boolean(producto?.destacado),
  }
}

export async function listarProductos(signal) {
  const resultado = await solicitar('/productos/', { signal, auth: false })
  if (!Array.isArray(resultado?.data)) throw new Error('La respuesta del backend no tiene el formato esperado.')
  return resultado.data.map(normalizarProducto)
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
