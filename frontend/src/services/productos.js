import { solicitar } from '../api'
import { imagenPorProducto } from '../productos'

export function normalizarProducto(producto) {
  const imagenes = Array.isArray(producto?.imagenes) ? producto.imagenes.filter(Boolean) : []
  const principal = producto?.imagen_url || imagenes[0] || producto?.imagen || ''
  return {
    id: String(producto?.id ?? producto?.identificador ?? ''),
    nombre: producto?.nombre || '',
    descripcion: producto?.descripcion || '',
    categoria: producto?.categoria || '',
    precio: Number(producto?.precio) || 0,
    stock: Number(producto?.stock) || 0,
    imagen: principal || imagenPorProducto(producto),
    imagenes: imagenes.length ? imagenes : [imagenPorProducto(producto)],
    moneda: producto?.moneda || 'CLP',
    stock_reservado: Number(producto?.stock_reservado) || 0,
    estado: producto?.estado || '',
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

export async function subirImagen(archivo) {
  const datos = new FormData()
  datos.append('archivo', archivo)
  const resultado = await solicitar('/subir-imagen/', { method: 'POST', datos })
  return resultado.imagen_url
}
