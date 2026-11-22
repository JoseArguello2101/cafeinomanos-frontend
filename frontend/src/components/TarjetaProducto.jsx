import { Link } from 'react-router-dom'
import { imagenPorProducto } from '../productos'
import { formatearPrecio } from '../services/productos'
import AgregarAlCarrito from './AgregarAlCarrito'

/** Tarjeta de un producto del catálogo público. */
function TarjetaProducto({ producto, esAdmin = false }) {
  const agotado = producto.disponibilidad === 'agotado'
  const ruta = `/producto/${producto.id}`

  return (
    <article className={`catalogo-tarjeta${agotado ? ' catalogo-tarjeta--agotada' : ''}`}>
      <Link className="catalogo-tarjeta-imagen" to={ruta} aria-label={`Consultar ${producto.nombre}${agotado ? ' (agotado)' : ''}`}>
        <img
          src={producto.imagen}
          alt={producto.nombre}
          loading="lazy"
          onError={evento => { evento.currentTarget.onerror = null; evento.currentTarget.src = imagenPorProducto(producto) }}
        />
        {agotado && <span className="catalogo-sello" aria-hidden="true">Agotado</span>}
      </Link>
      <div className="catalogo-tarjeta-cuerpo">
        <div className="catalogo-tarjeta-meta">
          {producto.categoria && <span className="eyebrow">{producto.categoria}</span>}
          <span className={`catalogo-badge catalogo-badge--${agotado ? 'agotado' : 'disponible'}`}>
            {agotado ? 'Agotado' : 'Disponible'}
          </span>
        </div>
        <h2>{producto.nombre}</h2>
        {producto.descripcion && <p>{producto.descripcion}</p>}
        <div className="catalogo-precio">
          <strong>{formatearPrecio(producto.precio, producto.moneda)}</strong>
          <span>{agotado ? 'Sin stock por ahora' : `${producto.stock} disponibles`}</span>
        </div>
        <div className="catalogo-acciones">
          <Link to={ruta}>Ver detalles</Link>
          {esAdmin && <Link to={`/admin/productos?editar=${encodeURIComponent(producto.id)}`} aria-label={`Editar producto ${producto.nombre}`}>Editar</Link>}
        </div>
        <AgregarAlCarrito producto={producto} compacto />
      </div>
    </article>
  )
}

export default TarjetaProducto
