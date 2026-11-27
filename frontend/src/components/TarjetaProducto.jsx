import { Link } from 'react-router-dom'
import { imagenPorProducto } from '../productos'
import { formatearPrecio } from '../services/productos'
import AgregarAlCarrito from './AgregarAlCarrito'

/**
 * Tarjeta de un producto del catálogo público.
 * Muestra nombre, imagen y un pie compacto con precio, stock y compra.
 * Si el producto está agotado, la imagen se ve en gris y no permite agregarlo al carrito.
 */
function TarjetaProducto({ producto, esAdmin = false }) {
  // Misma condición que usa el control de compra para desactivarse.
  const sinStock = producto.stock <= 0 || producto.disponible === false
  const agotado = producto.disponibilidad === 'agotado' || sinStock
  const ruta = `/producto/${producto.id}`

  return (
    <article className={`catalogo-tarjeta${agotado ? ' catalogo-tarjeta--agotada' : ''}`}>
      <h2 className="catalogo-tarjeta-titulo">{producto.nombre}</h2>

      <Link className="catalogo-tarjeta-imagen" to={ruta} aria-label={`Consultar ${producto.nombre}${agotado ? ' (agotado)' : ''}`}>
        {/* Si la imagen del backend no carga, se reemplaza por una imagen local según el nombre del producto. */}
        <img
          src={producto.imagen}
          alt={producto.nombre}
          loading="lazy"
          onError={evento => { evento.currentTarget.onerror = null; evento.currentTarget.src = imagenPorProducto(producto) }}
        />
        {/* Sello centrado sobre la imagen (decorativo: el texto accesible va en el aria-label del enlace). */}
        {agotado && <span className="catalogo-sello" aria-hidden="true">AGOTADO</span>}
      </Link>

      <div className="catalogo-tarjeta-pie">
        <div className="catalogo-tarjeta-info">
          <strong className="catalogo-precio-valor">{formatearPrecio(producto.precio, producto.moneda)}</strong>
          <span className="catalogo-stock">{sinStock ? 'Sin stock' : `Stock: ${producto.stock}`}</span>
        </div>

        {/* El control conserva su lógica de cantidad, stock y carrito; los enlaces van en el pie. */}
        <AgregarAlCarrito producto={producto} compacto>
          <div className="catalogo-enlaces">
            <Link className="catalogo-ver-detalles" to={ruta}>Ver detalles</Link>
            {/* "Editar" solo aparece para administradores. */}
            {esAdmin && (
              <Link
                className="catalogo-editar"
                to={`/admin/productos?editar=${encodeURIComponent(producto.id)}`}
                aria-label={`Editar producto ${producto.nombre}`}
              >
                Editar
              </Link>
            )}
          </div>
        </AgregarAlCarrito>
      </div>
    </article>
  )
}

export default TarjetaProducto
