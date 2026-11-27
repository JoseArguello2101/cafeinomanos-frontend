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

// Direcciones de la red local (localhost, 127.x, 10.x, 192.168.x, 172.16-31.x).
const HOSTS_RED_LOCAL = /^(localhost|127\.\d+\.\d+\.\d+|\[::1\]|0\.0\.0\.0|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/

/**
 * Indica si una imagen apunta a la red local mientras el sitio está publicado (p. ej. una imagen
 * subida con el backend local que quedó guardada como http://127.0.0.1:8000/media/...).
 * Firefox bloquea esas peticiones y Chrome pide permiso al visitante; además nunca existen en su equipo.
 * En desarrollo (sitio en localhost) sí se cargan normalmente.
 */
export function esImagenDeRedLocal(url) {
  if (!url || typeof window === 'undefined' || HOSTS_RED_LOCAL.test(window.location.hostname)) return false
  try {
    return HOSTS_RED_LOCAL.test(new URL(url, window.location.href).hostname)
  } catch {
    return false
  }
}

/** Devuelve la URL si el navegador puede cargarla; si apunta a la red local, la imagen de respaldo. */
export function imagenSegura(url, producto) {
  return url && !esImagenDeRedLocal(url) ? url : imagenPorProducto(producto)
}

export function imagenPorProducto(producto) {
  const texto = `${producto?.nombre || producto?.name || ''} ${producto?.descripcion || ''}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  const cat = normalizarTexto(producto?.categoria)

  if (cat === 'reposteria') {
    if (/croissant|pain|roll|medialuna|berlines|palmerita|scone/.test(texto)) return '/productos/croissant_panaderia.jpg'
    if (/tarta|pie|kuchen|tartaleta|strudel|macarons|eclair|tiramisu/.test(texto)) return '/productos/pie_tarta.jpg'
    return '/productos/torta_pastel.jpg'
  }
  if (cat === 'accesorios') {
    return '/productos/molinillo_tazas.jpg'
  }
  if (/grano|molido|blend|colombia|brasil|guatemala|costa rica|peru|kenya|sumatra|descafeinado|salvador|honduras|ruanda|panama|etiopia/.test(texto)) {
    return '/productos/cafe_grano.jpg'
  }
  if (/cold brew|iced|frappe|tonic|nitro|carajillo/.test(texto)) return '/productos/cafe_frio.jpg'
  if (texto.includes('capuccino') || texto.includes('cappuccino')) return capuccino
  if (texto.includes('mocha')) return mocha
  if (texto.includes('macchiato')) return macchiato
  if (cat === 'cafe' || cat === 'cafes de especialidad') return capuccino
  return imagenRespaldo
}

export const ProductosContext = createContext(null)
export const useProductos = () => useContext(ProductosContext)
