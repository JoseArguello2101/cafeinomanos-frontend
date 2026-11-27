import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { categorias, priorizarProductosIniciales } from '../productos'
import { EVENTO_PRODUCTOS, listarCatalogo } from '../services/productos'
import TarjetaProducto from '../components/TarjetaProducto'
import './Catalogo.css'

// Cantidad de tarjetas que se muestran por página del catálogo.
const POR_PAGINA = 6
// Valor del selector que representa "ver todas" sin confundirse con una categoría real.
const TODAS_CATEGORIAS = '__todas__'

// Quita tildes y pasa a minúsculas para que la búsqueda no distinga "Café" de "cafe".
const normalizar = texto => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Carga los productos activos del catálogo público y se recarga cuando cambia el inventario. */
function useCatalogo() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  // Cada vez que cambia "revision" se vuelve a pedir el catálogo al backend.
  const [revision, setRevision] = useState(0)

  // Pide los productos activos; si el usuario sale de la página, la petición se cancela.
  useEffect(() => {
    const controlador = new AbortController()
    listarCatalogo(controlador.signal)
      .then(lista => { setProductos(lista); setError('') })
      .catch(motivo => { if (motivo.name !== 'AbortError') setError(motivo.message) })
      .finally(() => { if (!controlador.signal.aborted) setCargando(false) })
    return () => controlador.abort()
  }, [revision])

  // Recarga el catálogo cuando otra parte de la app avisa que cambió el inventario (por ejemplo, tras una compra).
  useEffect(() => {
    const actualizar = () => setRevision(actual => actual + 1)
    window.addEventListener(EVENTO_PRODUCTOS, actualizar)
    return () => window.removeEventListener(EVENTO_PRODUCTOS, actualizar)
  }, [])

  // Usado por el botón "Reintentar" cuando falla la carga.
  const recargar = () => { setCargando(true); setRevision(actual => actual + 1) }
  return { productos, cargando, error, recargar }
}

/** Página pública del catálogo: filtros, conteo, tarjetas de productos y paginación. */
function Catalogo() {
  const { productos, cargando, error, recargar } = useCatalogo()
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState(TODAS_CATEGORIAS)
  const [categoriaAbierta, setCategoriaAbierta] = useState(false)
  const [disponibles, setDisponibles] = useState(false)
  const [pagina, setPagina] = useState(1)
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null')
  const etiquetaCategoria = categoria === TODAS_CATEGORIAS ? 'Todas las categorías' : categoria

  // Categorías del filtro: las fijas de la tienda más las que traen los productos reales, sin repetir.
  const opcionesCategoria = useMemo(
    () => [...new Set([...categorias, ...productos.map(producto => producto.categoria).filter(Boolean)])],
    [productos],
  )
  // Cuántos productos están agotados (stock cero), para mostrarlo en el conteo.
  const agotados = productos.filter(producto => producto.disponibilidad === 'agotado').length
  // Aplica búsqueda, categoría y "Solo disponibles" sobre los productos activos.
  const termino = normalizar(busqueda.trim())
  const visibles = priorizarProductosIniciales(productos).filter(producto =>
    (!categoria || categoria === TODAS_CATEGORIAS || producto.categoria === categoria) &&
    (!disponibles || producto.disponibilidad === 'disponible') &&
    normalizar(`${producto.nombre} ${producto.descripcion}`).includes(termino))

  // Paginación: calcula la página válida y corta solo las tarjetas que le corresponden.
  const totalPaginas = Math.ceil(visibles.length / POR_PAGINA) || 1
  const paginaActual = Math.min(Math.max(1, pagina), totalPaginas)
  const inicio = (paginaActual - 1) * POR_PAGINA
  const productosPaginados = visibles.slice(inicio, inicio + POR_PAGINA)

  // Restablece todos los filtros y vuelve a la primera página.
  function limpiar() {
    setBusqueda('')
    setCategoria(TODAS_CATEGORIAS)
    setDisponibles(false)
    setPagina(1)
  }

  // Cambia de página (si existe) y sube al inicio para ver las nuevas tarjetas.
  function cambiarPagina(nueva) {
    if (nueva >= 1 && nueva <= totalPaginas) {
      setPagina(nueva)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return <section className="catalogo" aria-labelledby="catalogo-titulo">
    <header className="catalogo-cabecera">
      <h1 id="catalogo-titulo">Encuentra tu propio paraíso en nuestros productos</h1>
      {usuario?.es_admin && <Link className="catalogo-primario" to="/admin/productos">Registrar producto</Link>}
    </header>
    {/* Filtros: al cambiar cualquiera se vuelve a la página 1. */}
    <div className="catalogo-filtros" role="search" aria-label="Buscar productos">
      <div
        className="dropdown catalogo-categoria"
        onBlur={evento => { if (!evento.currentTarget.contains(evento.relatedTarget)) setCategoriaAbierta(false) }}
        onKeyDown={evento => { if (evento.key === 'Escape') setCategoriaAbierta(false) }}
      >
        <button
          type="button"
          className={`btn catalogo-categoria-boton dropdown-toggle ${categoriaAbierta ? 'show' : ''}`}
          aria-expanded={categoriaAbierta}
          onClick={() => setCategoriaAbierta(actual => !actual)}
        >
          {etiquetaCategoria}
        </button>
        <ul className={`dropdown-menu catalogo-categoria-menu ${categoriaAbierta ? 'show' : ''}`}>
          <li><button type="button" className={`dropdown-item ${categoria === TODAS_CATEGORIAS ? 'active' : ''}`} onClick={() => { setCategoria(TODAS_CATEGORIAS); setPagina(1); setCategoriaAbierta(false) }}>Todas las categorías</button></li>
          {opcionesCategoria.map(item => <li key={item}><button type="button" className={`dropdown-item ${categoria === item ? 'active' : ''}`} onClick={() => { setCategoria(item); setPagina(1); setCategoriaAbierta(false) }}>{item}</button></li>)}
        </ul>
      </div>
      <div className="catalogo-buscar">
        <svg className="catalogo-lupa" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
        </svg>
        <input id="catalogo-busqueda" aria-label="Buscar producto" type="search" placeholder="Busca tus productos..." value={busqueda} onChange={evento => { setBusqueda(evento.target.value); setPagina(1) }} />
      </div>
      <label className="catalogo-disponibles"><input type="checkbox" checked={disponibles} onChange={evento => { setDisponibles(evento.target.checked); setPagina(1) }} />Solo disponibles</label>
      <button type="button" className="catalogo-limpiar" onClick={limpiar}>Limpiar filtros</button>
    </div>
    <p className="catalogo-conteo" role="status" aria-live="polite">
      {cargando ? 'Cargando productos…' : `${visibles.length} de ${productos.length} productos${agotados ? ` · ${agotados} agotado${agotados === 1 ? '' : 's'}` : ''}`}
    </p>
    {/* Si falla la carga: mensaje de error con opción de reintentar. Si no: tarjetas + paginación, o aviso de "sin resultados". */}
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
