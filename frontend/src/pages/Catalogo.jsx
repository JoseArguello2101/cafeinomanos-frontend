import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useProductos, categorias, pesos, imagenPorProducto, priorizarProductosIniciales } from '../productos'
import './Catalogo.css'
import AgregarAlCarrito from '../components/AgregarAlCarrito'

function Catalogo() {
  const { productos, cargando, error, recargar } = useProductos()
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('')
  const [disponibles, setDisponibles] = useState(false)
  const [pagina, setPagina] = useState(1)
  const porPagina = 6

  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null')
  const normalizar = texto => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const visibles = priorizarProductosIniciales(productos).filter(producto => (!categoria || producto.categoria === categoria) && (!disponibles || producto.stock > 0) && normalizar(`${producto.nombre} ${producto.descripcion}`).includes(normalizar(busqueda.trim())))

  const totalPaginas = Math.ceil(visibles.length / porPagina) || 1
  const paginaActual = Math.min(Math.max(1, pagina), totalPaginas)
  const inicio = (paginaActual - 1) * porPagina
  const productosPaginados = visibles.slice(inicio, inicio + porPagina)

  function limpiar() {
    setBusqueda('')
    setCategoria('')
    setDisponibles(false)
    setPagina(1)
  }

  function cambiarPagina(nueva) {
    if (nueva >= 1 && nueva <= totalPaginas) {
      setPagina(nueva)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return <section className="catalogo" aria-labelledby="catalogo-titulo">
    <header className="catalogo-cabecera"><div><p className="eyebrow">Paraíso del Café</p><h1 id="catalogo-titulo">Nuestro catálogo</h1><p>Café, sabores y detalles para disfrutar tu próxima pausa.</p></div>{usuario?.es_admin && <Link className="catalogo-primario" to="/admin/productos">Registrar producto</Link>}</header>
    <p className="catalogo-demo">Catálogo conectado al backend. Los precios se expresan en pesos chilenos.</p>
    <div className="catalogo-filtros" role="search" aria-label="Buscar productos">
      <div><label htmlFor="catalogo-busqueda">Buscar producto</label><input id="catalogo-busqueda" type="search" placeholder="Nombre o descripción" value={busqueda} onChange={evento => { setBusqueda(evento.target.value); setPagina(1) }} /></div>
      <div><label htmlFor="catalogo-categoria">Categoría</label><select id="catalogo-categoria" value={categoria} onChange={evento => { setCategoria(evento.target.value); setPagina(1) }}><option value="">Todas las categorías</option>{categorias.map(item => <option key={item}>{item}</option>)}</select></div>
      <label className="catalogo-disponibles"><input type="checkbox" checked={disponibles} onChange={evento => { setDisponibles(evento.target.checked); setPagina(1) }} />Solo disponibles</label>
      <button type="button" onClick={limpiar}>Limpiar filtros</button>
    </div>
    <p className="catalogo-conteo" role="status" aria-live="polite">{cargando ? 'Cargando productos…' : `${visibles.length} de ${productos.length} productos`}</p>
    {error && <div className="catalogo-vacio" role="alert"><h2>No pudimos cargar el catálogo</h2><p>{error}</p><button type="button" onClick={recargar}>Reintentar</button></div>}
    {!error && !cargando && (visibles.length ? <>
      <div className="catalogo-grid">{productosPaginados.map(producto => <article className="catalogo-tarjeta" key={producto.id}>
        <Link to={`/producto/${producto.id}`} aria-label={`Consultar ${producto.nombre}`}><img src={producto.imagen} alt={producto.nombre} onError={evento => { evento.currentTarget.onerror = null; evento.currentTarget.src = imagenPorProducto(producto) }} /></Link>
        <div className="catalogo-tarjeta-cuerpo"><span className="eyebrow">{producto.categoria}</span><h2>{producto.nombre}</h2><p>{producto.descripcion}</p><div className="catalogo-precio"><strong>{pesos.format(producto.precio)}</strong><span>{producto.stock ? `${producto.stock} disponibles` : 'Sin stock'}</span></div><div className="catalogo-acciones"><Link to={`/producto/${producto.id}`}>Ver detalles</Link>{usuario?.es_admin && <Link to={`/admin/productos?editar=${encodeURIComponent(producto.id)}`} aria-label={`Editar producto ${producto.nombre}`}>Editar</Link>}</div><AgregarAlCarrito producto={producto} compacto /></div>
      </article>)}</div>
      <div className="catalogo-paginacion">
        <button type="button" className="paginacion-btn" onClick={() => cambiarPagina(paginaActual - 1)} disabled={paginaActual <= 1}>anterior</button>
        <div className="paginacion-numeros">
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
            <button key={num} type="button" className={`paginacion-btn ${num === paginaActual ? 'activo' : ''}`} onClick={() => cambiarPagina(num)}>{num}</button>
          ))}
        </div>
        <button type="button" className="paginacion-btn" onClick={() => cambiarPagina(paginaActual + 1)} disabled={paginaActual >= totalPaginas}>siguiente</button>
      </div>
    </> : <div className="catalogo-vacio"><h2>No encontramos productos</h2><p>Prueba con otro nombre o cambia los filtros.</p><button type="button" onClick={limpiar}>Mostrar todos los productos</button></div>)}
  </section>
}

export default Catalogo
