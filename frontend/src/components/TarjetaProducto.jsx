import { Link } from 'react-router-dom'
import { imagenPorProducto } from '../productos'
import { formatearPrecio } from '../services/productos'
import AgregarAlCarrito from './AgregarAlCarrito'

/**
 * Tarjeta de un producto del catálogo público.
 * Muestra imagen principal, nombre, precio con moneda y disponibilidad.
 * Si el producto está agotado, la tarjeta se ve distinta y no permite agregarlo al carrito.
 */
function TarjetaProducto({ producto, esAdmin = false }) {
  // El backend marca como "agotado" a los productos con stock cero.
  const agotado = producto.disponibilidad === 'agotado'
  const ruta = `/producto/${producto.id}`

  return (
    // La clase "--agotada" pone la imagen en gris y el borde discontinuo.
    <article className={`catalogo-tarjeta${agotado ? ' catalogo-tarjeta--agotada' : ''}`}>
      <Link className="catalogo-tarjeta-imagen" to={ruta} aria-label={`Consultar ${producto.nombre}${agotado ? ' (agotado)' : ''}`}>
        {/* Si la imagen del backend no carga, se reemplaza por una imagen local según el nombre del producto. */}
        <img
          src={producto.imagen}
          alt={producto.nombre}
          loading="lazy"
          onError={evento => { evento.currentTarget.onerror = null; evento.currentTarget.src = imagenPorProducto(producto) }}
        />
        {/* Sello "Agotado" sobre la imagen (decorativo: el texto accesible va en el aria-label del enlace). */}
        {agotado && <span className="catalogo-sello" aria-hidden="true">Agotado</span>}
      </Link>
      <div className="catalogo-tarjeta-cuerpo">
        {/* Categoría y etiqueta de disponibilidad (texto + color). */}
        <div className="catalogo-tarjeta-meta">
          {producto.categoria && <span className="eyebrow">{producto.categoria}</span>}
          <span className={`catalogo-badge catalogo-badge--${agotado ? 'agotado' : 'disponible'}`}>
            {agotado ? 'Agotado' : 'Disponible'}
          </span>
        </div>
        <h2>{producto.nombre}</h2>
        {producto.descripcion && <p>{producto.descripcion}</p>}
        {/* Precio con su moneda (ej. "$3.800 CLP") y unidades disponibles. */}
        <div className="catalogo-precio">
          <strong>{formatearPrecio(producto.precio, producto.moneda)}</strong>
          <span>{agotado ? 'Sin stock por ahora' : `${producto.stock} disponibles`}</span>
        </div>
        {/* "Editar" solo aparece para administradores. */}
        <div className="catalogo-acciones">
          <Link to={ruta}>Ver detalles</Link>
          {esAdmin && <Link to={`/admin/productos?editar=${encodeURIComponent(producto.id)}`} aria-label={`Editar producto ${producto.nombre}`}>Editar</Link>}
        </div>
        {/* AgregarAlCarrito se desactiva solo cuando el producto no tiene stock. */}
        <AgregarAlCarrito producto={producto} compacto />
      </div>
    </article>
  )
}

export default TarjetaProducto
