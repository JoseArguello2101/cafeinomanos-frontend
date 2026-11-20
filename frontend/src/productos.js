import { createContext, useContext } from 'react'
import capuccino from './assets/capuccino.jpg'
import mocha from './assets/mocha.jpg'
import macchiato from './assets/macchiato.jpg'

export const categorias = ['Café', 'Repostería', 'Accesorios']
export const productosIniciales = [
  { id: '1', nombre: 'Capuccino', descripcion: 'Espresso con leche y una suave capa de espuma.', categoria: 'Café', precio: 3800, stock: 20, imagen: capuccino },
  { id: '2', nombre: 'Mocha', descripcion: 'Café con chocolate y leche.', categoria: 'Café', precio: 4200, stock: 0, imagen: mocha },
  { id: '3', nombre: 'Macchiato', descripcion: 'Espresso intenso con un delicado toque de espuma de leche.', categoria: 'Café', precio: 3500, stock: 15, imagen: macchiato },
]
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
  return capuccino
}

export const pesos = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' })
export const ProductosContext = createContext(null)
export const useProductos = () => useContext(ProductosContext)
