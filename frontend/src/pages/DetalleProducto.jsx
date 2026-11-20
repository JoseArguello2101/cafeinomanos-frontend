import { Link, useParams } from 'react-router-dom'
import { useProductos, pesos, imagenPorProducto } from '../productos'
import AgregarAlCarrito from '../components/AgregarAlCarrito'
import './Catalogo.css'

function DetalleProducto() {
  const { id } = useParams()
  const { productos, cargando, error, recargar } = useProductos()
  const producto = productos.find(item => String(item.id) === String(id))
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null')

  if (cargando) return <section className="catalogo catalogo-vacio"><h1>Cargando producto…</h1></section>
  if (error) return <section className="catalogo catalogo-vacio"><h1>No pudimos cargar el producto</h1><p>{error}</p><button type="button" onClick={recargar}>Reintentar</button><Link to="/catalogo">Volver al catálogo</Link></section>
  if (!producto) return <section className="catalogo catalogo-vacio"><h1>Producto no encontrado</h1><p>El producto solicitado no está disponible en este catálogo.</p><Link to="/catalogo">Volver al catálogo</Link></section>

  return (
    <section className="catalogo" aria-labelledby="detalle-titulo">
      <Link to="/catalogo">← Volver al catálogo</Link>

      <article className="catalogo-detalle">
        <img src={producto.imagen} alt={producto.nombre} onError={evento => { evento.currentTarget.onerror = null; evento.currentTarget.src = imagenPorProducto(producto) }} />
        <div>
          <p className="eyebrow">{producto.categoria}</p>
          <h1 id="detalle-titulo">{producto.nombre}</h1>
          <p>{producto.descripcion}</p>
          <strong className="detalle-precio">{pesos.format(producto.precio)}</strong>
          <p>{producto.stock ? `${producto.stock} unidades disponibles` : 'Sin stock'}</p>

          <AgregarAlCarrito producto={producto} />

          {/* Enlace para administradores */}
          {usuario?.es_admin && (
            <Link
              className="catalogo-primario"
              to={`/admin/productos?editar=${encodeURIComponent(producto.id)}`}
            >
              Editar producto
            </Link>
          )}

          <p className="catalogo-demo">Precio expresado en pesos chilenos.</p>
        </div>
      </article>
    </section>
  )
}

export default DetalleProducto