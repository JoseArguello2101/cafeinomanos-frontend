import { createContext, useContext } from 'react'
import capuccino from './assets/capuccino.jpg'
import mocha from './assets/mocha.jpg'
import macchiato from './assets/macchiato.jpg'

export const categorias = ['Café', 'Repostería', 'Accesorios']

function normalizarTexto(texto) {
  return String(texto ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
}

/** Unifica variantes del backend (p. ej. "Cafe" o "CAFÉ") con la categoría canónica "Café". */
export function categoriaCanonica(valor) {
  const texto = String(valor ?? '').trim()
  if (!texto) return ''
  const clave = normalizarTexto(texto)
  return categorias.find(opcion => normalizarTexto(opcion) === clave) || texto
}

export const productosIniciales = [
  { id: '1', nombre: 'Capuccino', descripcion: 'Espresso con leche y una suave capa de espuma.', categoria: 'Café', precio: 3800, stock: 20, imagen: capuccino, imagenes: [capuccino, macchiato, mocha] },
  { id: '2', nombre: 'Mocha', descripcion: 'Café con chocolate y leche.', categoria: 'Café', precio: 4200, stock: 0, imagen: mocha, imagenes: [mocha, capuccino] },
  { id: '3', nombre: 'Macchiato', descripcion: 'Espresso intenso con un delicado toque de espuma de leche.', categoria: 'Café', precio: 3500, stock: 15, imagen: macchiato, imagenes: [macchiato, capuccino] },
]
export const moneda = { codigo: 'CLP', nombre: 'Pesos chilenos' }
export const pesos = new Intl.NumberFormat('es-CL', { style: 'currency', currency: moneda.codigo })

// Imagen alternativa (SVG embebido) que se muestra cuando una imagen no puede cargarse.
export const imagenRespaldo = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="440" viewBox="0 0 600 440">' +
  '<rect width="600" height="440" fill="#efe6dc"/>' +
  '<g fill="none" stroke="#8a6a52" stroke-width="10" stroke-linecap="round">' +
  '<path d="M210 190h150v70a60 60 0 0 1-60 60h-30a60 60 0 0 1-60-60z"/>' +
  '<path d="M360 210h20a30 30 0 0 1 0 60h-22"/>' +
  '<path d="M245 150c0-18 15-18 15-36M285 150c0-18 15-18 15-36"/></g>' +
  '<text x="300" y="375" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#8a6a52">Imagen no disponible</text>' +
  '</svg>'
)}`

// Un producto solo se presenta como disponible si existe, está activo y tiene stock.
export function estadoProducto(producto) {
  if (!producto) return { disponible: false, etiqueta: 'Producto inexistente', tipo: 'inactivo' }
  const estado = String(producto.estado || '').toLowerCase()
  const inactivo = producto.activo === false || producto.disponible === false || ['inactivo', 'descontinuado', 'eliminado'].includes(estado)
  if (inactivo) return { disponible: false, etiqueta: 'Producto no disponible', tipo: 'inactivo' }
  if (!(Number(producto.stock) > 0)) return { disponible: false, etiqueta: 'Sin stock', tipo: 'agotado' }
  return { disponible: true, etiqueta: `Disponible · ${producto.stock} unidades`, tipo: 'disponible' }
}

export const nombresProductosIniciales = productosIniciales.map(producto => producto.nombre)

export function priorizarProductosIniciales(lista) {
  return [
    ...nombresProductosIniciales.map(nombre => lista.find(producto => producto.nombre === nombre)).filter(Boolean),
    ...lista.filter(producto => !nombresProductosIniciales.includes(producto.nombre)),
  ]
}

export function imagenPorProducto(producto) {
  const texto = `${producto?.nombre || producto?.name || ''} ${producto?.descripcion || ''}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  if (texto.includes('capuccino') || texto.includes('cappuccino')) return capuccino
  if (texto.includes('mocha')) return mocha
  if (texto.includes('macchiato')) return macchiato
  // Un producto nuevo no debe "convertirse" en Capuccino: si no hay imagen
  // propia o falla su enlace, se muestra el neutro "Imagen no disponible".
  return imagenRespaldo
}

export const ProductosContext = createContext(null)
export const useProductos = () => useContext(ProductosContext)
