import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { solicitar, limpiarSesion } from '../api'
import { obtenerCarrito, EVENTO_CARRITO, guardarRutaRetorno } from '../services/carrito'
import logoCafe from '../assets/logo-cafe.png'
import logoBlanco from '../assets/logo-blanco.png'
import { TEMAS, guardarTemaSitio } from '../services/tema'
import './Navbar.css'

// tema: el que se ve (para el logo); temaSitio: el que eligió la administración;
// preferencia: el personal de este navegador (o null).
function Navbar({ tema, temaSitio, preferencia, onPreferenciaChange, onTemaSitioChange }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const retornoCompra = pathname === '/carrito' || pathname === '/pago' ? '/carrito' : undefined
  const usuario = JSON.parse(localStorage.getItem('usuario'))
  // un administrador real (no la demo) cambia con este menú el tema predeterminado de todo el sitio
  const esAdmin = Boolean(usuario?.es_admin && !usuario?.demo && localStorage.getItem('token'))
  const [unidadesCarrito, setUnidadesCarrito] = useState(0)
  const [temasAbierto, setTemasAbierto] = useState(false)
  const [guardandoTema, setGuardandoTema] = useState(false)
  const [errorTema, setErrorTema] = useState('')
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

  // Visitante: valor = tema personal solo en este navegador (null = volver al tema del sitio).
  function elegirTema(valor) {
    onPreferenciaChange(valor)
    setTemasAbierto(false)
  }

  // Administrador: guarda el tema en el servidor como predeterminado para todos; se mantiene
  // aunque cierre sesión. Se quita su tema personal para que vea el mismo que los visitantes.
  async function elegirTemaSitio(valor) {
    if (guardandoTema) return
    setGuardandoTema(true)
    setErrorTema('')
    try {
      const guardado = await guardarTemaSitio(valor)
      onTemaSitioChange(guardado)
      onPreferenciaChange(null)
      setTemasAbierto(false)
    } catch (problema) {
      setErrorTema(problema.message || 'No se pudo guardar el tema.')
    } finally {
      setGuardandoTema(false)
    }
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
            <ul
              className="nav-temas-lista"
              role="menu"
              aria-label={esAdmin ? 'Tema predeterminado del sitio' : 'Tema de la página'}
            >
              {/*
                Los cuatro temas. El que eligió la administración lleva "(Predeterminado)".
                - Administrador: elegir uno lo guarda como predeterminado para todos.
                - Visitante: elegir uno lo usa solo en su navegador; elegir el predeterminado
                  vuelve a seguir el tema del sitio (quita su tema personal).
              */}
              {TEMAS.map(opcion => {
                const predeterminado = temaSitio === opcion.valor
                const elegido = esAdmin ? predeterminado : (preferencia || temaSitio) === opcion.valor
                return (
                  <li key={opcion.valor} role="none">
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={elegido}
                      className={elegido ? 'activo' : undefined}
                      disabled={esAdmin && guardandoTema}
                      onClick={() => {
                        if (esAdmin) elegirTemaSitio(opcion.valor)
                        else elegirTema(predeterminado ? null : opcion.valor)
                      }}
                    >
                      <span className="nav-tema-nombre">
                        {opcion.nombre}{predeterminado && ' (Predeterminado)'}
                      </span>
                      {/* círculo con la paleta del tema: fondo y color de acento */}
                      <span className={`nav-tema-paleta nav-tema-paleta--${opcion.valor}`} aria-hidden="true" />
                    </button>
                  </li>
                )
              })}
              {guardandoTema && <li role="none" className="nav-temas-estado" aria-live="polite">Guardando…</li>}
              {errorTema && <li className="nav-temas-estado" role="alert">{errorTema}</li>}
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