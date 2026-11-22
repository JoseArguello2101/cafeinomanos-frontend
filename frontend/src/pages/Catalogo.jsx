import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { categorias, priorizarProductosIniciales } from '../productos'
import { EVENTO_PRODUCTOS, listarCatalogo } from '../services/productos'
import TarjetaProducto from '../components/TarjetaProducto'
import './Catalogo.css'

const POR_PAGINA = 6

const normalizar = texto => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Carga los productos activos del catálogo público y se recarga cuando cambia el inventario. */
function useCatalogo() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    const controlador = new AbortController()
    listarCatalogo(controlador.signal)
      .then(lista => { setProductos(lista); setError('') })
      .catch(motivo => { if (motivo.name !== 'AbortError') setError(motivo.message) })
      .finally(() => { if (!controlador.signal.aborted) setCargando(false) })
    return () => controlador.abort()
  }, [revision])

  useEffect(() => {
    const actualizar = () => setRevision(actual => actual + 1)
    window.addEventListener(EVENTO_PRODUCTOS, actualizar)
    return () => window.removeEventListener(EVENTO_PRODUCTOS, actualizar)
  }, [])

  const recargar = () => { setCargando(true); setRevision(actual => actual + 1) }
  return { productos, cargando, error, recargar }
}

function Catalogo() {
  const { productos, cargando, error, recargar } = useCatalogo()
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('')
  const [disponibles, setDisponibles] = useState(false)
  const [pagina, setPagina] = useState(1)
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null')

  const opcionesCategoria = useMemo(
    () => [...new Set([...categorias, ...productos.map(producto => producto.categoria).filter(Boolean)])],
    [productos],
  )
  const agotados = productos.filter(producto => producto.disponibilidad === 'agotado').length
  const termino = normalizar(busqueda.trim())
  const visibles = priorizarProductosIniciales(productos).filter(producto =>
    (!categoria || producto.categoria === categoria) &&
    (!disponibles || producto.disponibilidad === 'disponible') &&
    normalizar(`${producto.nombre} ${producto.descripcion}`).includes(termino))

  const totalPaginas = Math.ceil(visibles.length / POR_PAGINA) || 1
  const paginaActual = Math.min(Math.max(1, pagina), totalPaginas)
  const inicio = (paginaActual - 1) * POR_PAGINA
  const productosPaginados = visibles.slice(inicio, inicio + POR_PAGINA)

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
    <header className="catalogo-cabecera">
      <div>
        <p className="eyebrow">Paraíso del Café</p>
        <h1 id="catalogo-titulo">Nuestro catálogo</h1>
        <p>Café, sabores y detalles para disfrutar tu próxima pausa.</p>
      </div>
      {usuario?.es_admin && <Link className="catalogo-primario" to="/admin/productos">Registrar producto</Link>}
    </header>
    <p className="catalogo-demo">Mostramos solo los productos activos. Los agotados aparecen marcados y no se pueden agregar al carrito.</p>
    <div className="catalogo-filtros" role="search" aria-label="Buscar productos">
      <div><label htmlFor="catalogo-busqueda">Buscar producto</label><input id="catalogo-busqueda" type="search" placeholder="Nombre o descripción" value={busqueda} onChange={evento => { setBusqueda(evento.target.value); setPagina(1) }} /></div>
      <div><label htmlFor="catalogo-categoria">Categoría</label><select id="catalogo-categoria" value={categoria} onChange={evento => { setCategoria(evento.target.value); setPagina(1) }}><option value="">Todas las categorías</option>{opcionesCategoria.map(item => <option key={item}>{item}</option>)}</select></div>
      <label className="catalogo-disponibles"><input type="checkbox" checked={disponibles} onChange={evento => { setDisponibles(evento.target.checked); setPagina(1) }} />Solo disponibles</label>
      <button type="button" onClick={limpiar}>Limpiar filtros</button>
    </div>
    <p className="catalogo-conteo" role="status" aria-live="polite">
      {cargando ? 'Cargando productos…' : `${visibles.length} de ${productos.length} productos${agotados ? ` · ${agotados} agotado${agotados === 1 ? '' : 's'}` : ''}`}
    </p>
    {error && <div className="catalogo-vacio" role="alert"><h2>No pudimos cargar el catálogo</h2><p>{error}</p><button type="button" onClick={recargar}>Reintentar</button></div>}
    {!error && !cargando && (visibles.length ? <>
      <div className="catalogo-grid">{productosPaginados.map(producto => <TarjetaProducto key={producto.id} producto={producto} esAdmin={Boolean(usuario?.es_admin)} />)}</div>
      <nav className="catalogo-paginacion" aria-label="Páginas del catálogo">
        <button type="button" className="paginacion-btn" onClick={() => cambiarPagina(paginaActual - 1)} disabled={paginaActual <= 1}>anterior</button>
        <div className="paginacion-numeros">
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
            <button key={num} type="button" className={`paginacion-btn ${num === paginaActual ? 'activo' : ''}`} aria-current={num === paginaActual ? 'page' : undefined} onClick={() => cambiarPagina(num)}>{num}</button>
          ))}
        </div>
        <button type="button" className="paginacion-btn" onClick={() => cambiarPagina(paginaActual + 1)} disabled={paginaActual >= totalPaginas}>siguiente</button>
      </nav>
    </> : <div className="catalogo-vacio"><h2>No encontramos productos</h2><p>Prueba con otro nombre o cambia los filtros.</p><button type="button" onClick={limpiar}>Mostrar todos los productos</button></div>)}
  </section>
}

export default Catalogo
