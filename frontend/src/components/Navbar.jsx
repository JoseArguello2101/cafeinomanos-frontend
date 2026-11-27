import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { solicitar, limpiarSesion } from '../api'
import { obtenerCarrito, EVENTO_CARRITO, guardarRutaRetorno } from '../services/carrito'
<<<<<<< HEAD
import logoCafe from '../assets/logo-cafe.png'
import logoBlanco from '../assets/logo-blanco.png'
import { TEMAS, nombreTema } from '../services/tema'
import './Navbar.css'

// tema: el que se ve (para el logo); temaSitio: el que eligió la administración;
// preferencia: el personal de este navegador (o null).
function Navbar({ tema, temaSitio, preferencia, onPreferenciaChange }) {
=======
import { TEMAS, nombreTema } from '../services/tema'
import './Navbar.css'

// temaSitio: el que eligió la administración; preferencia: el personal de este navegador (o null).
function Navbar({ temaSitio, preferencia, onPreferenciaChange }) {
>>>>>>> origin/master
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const retornoCompra = pathname === '/carrito' || pathname === '/pago' ? '/carrito' : undefined
  const usuario = JSON.parse(localStorage.getItem('usuario'))
  const [unidadesCarrito, setUnidadesCarrito] = useState(0)
  const [temasAbierto, setTemasAbierto] = useState(false)
  const temasRef = useRef(null)

  useEffect(() => {
    if (!temasAbierto) return
    function alHacerClic(evento) {
      if (temasRef.current && !temasRef.current.contains(evento.target)) setTemasAbierto(false)
    }
    function alPresionarTecla(evento) {
      if (evento.key === 'Escape') {
        setTemasAbierto(false)
        return
      }
      if (evento.key !== 'ArrowDown' && evento.key !== 'ArrowUp') return
      const opciones = temasRef.current?.querySelectorAll('[role="menuitemradio"]')
      if (!opciones?.length) return
      evento.preventDefault()
      const actual = Array.from(opciones).indexOf(document.activeElement)
      const siguiente = evento.key === 'ArrowDown'
        ? (actual + 1) % opciones.length
        : (actual - 1 + opciones.length) % opciones.length
      opciones[siguiente].focus()
    }
    document.addEventListener('mousedown', alHacerClic)
    document.addEventListener('keydown', alPresionarTecla)
    return () => {
      document.removeEventListener('mousedown', alHacerClic)
      document.removeEventListener('keydown', alPresionarTecla)
    }
  }, [temasAbierto])

  useEffect(() => {
    const controlador = new AbortController()
    function actualizar() {
      obtenerCarrito(controlador.signal)
        .then(carrito => setUnidadesCarrito(carrito.total_unidades))
        .catch(() => {})
    }
    // Evita crear un carrito vacío en el backend para visitantes nuevos.
    const hayCarrito = Boolean(localStorage.getItem('cart_session_id') || localStorage.getItem('token'))
    if (hayCarrito) actualizar()
    window.addEventListener(EVENTO_CARRITO, actualizar)
    return () => {
      controlador.abort()
      window.removeEventListener(EVENTO_CARRITO, actualizar)
    }
  }, [])

  // valor null = volver al tema del sitio
  function elegirTema(valor) {
    onPreferenciaChange(valor)
    setTemasAbierto(false)
  }

  async function cerrarSesion() {
    const token = localStorage.getItem('token')
    try {
      if (token && !usuario?.demo) {
        await solicitar('/logout/', { method: 'POST' })
      }
    } catch {
      // El cierre local se realiza aunque el backend no responda.
    }
    limpiarSesion()
    window.dispatchEvent(new Event(EVENTO_CARRITO))
    navigate('/')
  }

  return (
    <nav className="site-nav" aria-label="Navegación principal">
      <Link to="/" className="nav-logo">
        <img src={tema === 'oscuro' ? logoBlanco : logoCafe} alt="Paraíso del Café" />
      </Link>

      <div className="nav-grupo nav-izquierda">
        <Link to="/">Inicio</Link>
        <Link to="/catalogo">Catálogo</Link>
        <Link to="/contacto">Contacto</Link>
      </div>

      <div className="nav-centro">
        <Link to="/quienes-somos">Quiénes somos</Link>
      </div>

      <div className="nav-grupo nav-derecha">
        {usuario ? (
          <div className="nav-auth">
            {usuario?.es_admin ? (
              <Link to={usuario?.demo ? '/demo/admin' : '/admin'} className="btn-nav btn-nav-secundario">Panel</Link>
            ) : (
              <span className="nav-saludo">Hola, {usuario.nombre}</span>
            )}
            <button type="button" className="btn-nav btn-nav-secundario" onClick={cerrarSesion}>
              Cerrar sesión
            </button>
          </div>
        ) : (
          <div className="nav-auth">
            <Link
              to="/login"
              state={retornoCompra ? { desde: retornoCompra } : undefined}
              onClick={() => retornoCompra && guardarRutaRetorno(retornoCompra)}
              className="btn-nav btn-nav-secundario"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/registro"
              state={retornoCompra ? { desde: retornoCompra } : undefined}
              onClick={() => retornoCompra && guardarRutaRetorno(retornoCompra)}
              className="btn-nav btn-nav-primario"
            >
              Registrar
            </Link>
          </div>
        )}

        <div className="nav-temas" ref={temasRef}>
          <button
            type="button"
            className="nav-temas-boton btn-nav btn-nav-secundario"
            aria-haspopup="true"
            aria-expanded={temasAbierto}
            onClick={() => setTemasAbierto(abierto => !abierto)}
          >
            Temas <span aria-hidden="true">▾</span>
          </button>
          {temasAbierto && (
            <ul className="nav-temas-lista" role="menu">
              {/* Primera opción: seguir el tema que eligió la administración */}
              <li role="none">
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={!preferencia}
                  className={!preferencia ? 'activo' : undefined}
                  onClick={() => elegirTema(null)}
                >
                  Tema del sitio ({nombreTema(temaSitio)})
                </button>
              </li>
              {/* Resto: tema personal, guardado solo en este navegador */}
              {TEMAS.map(opcion => (
                <li key={opcion.valor} role="none">
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={preferencia === opcion.valor}
                    className={preferencia === opcion.valor ? 'activo' : undefined}
                    onClick={() => elegirTema(opcion.valor)}
                  >
                    {opcion.nombre}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link to="/carrito" className="btn-nav btn-nav-secundario nav-carrito" aria-label={`Carrito, ${unidadesCarrito} unidades`} title="Carrito">
          <svg className="nav-icono" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5M3.102 4l1.313 7h8.17l1.313-7zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4m7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4m-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2m7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2" />
          </svg>
          {unidadesCarrito > 0 && <span className="nav-carrito-badge" aria-hidden="true">{unidadesCarrito}</span>}
        </Link>
      </div>
    </nav>
  )
}

export default Navbar
