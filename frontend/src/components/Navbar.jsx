import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { API_URL } from '../api'
import './Navbar.css'

const TEMAS = [
  { valor: 'claro', nombre: 'Claro' },
  { valor: 'oscuro', nombre: 'Oscuro' },
  { valor: 'vintage', nombre: 'Vintage' },
  { valor: 'pastel', nombre: 'Pastel' },
]

function Navbar({ tema, onTemaChange }) {
  const navigate = useNavigate()
  useLocation()
  const usuario = JSON.parse(localStorage.getItem('usuario'))

  const [temasAbierto, setTemasAbierto] = useState(false)
  const temasRef = useRef(null)

  useEffect(() => {
    if (!temasAbierto) return
    function alHacerClic(evento) {
      if (temasRef.current && !temasRef.current.contains(evento.target)) setTemasAbierto(false)
    }
    function alPresionarTecla(evento) {
      if (evento.key === 'Escape') setTemasAbierto(false)
    }
    document.addEventListener('mousedown', alHacerClic)
    document.addEventListener('keydown', alPresionarTecla)
    return () => {
      document.removeEventListener('mousedown', alHacerClic)
      document.removeEventListener('keydown', alPresionarTecla)
    }
  }, [temasAbierto])

  function elegirTema(valor) {
    onTemaChange(valor)
    setTemasAbierto(false)
  }

  async function cerrarSesion() {
    const token = localStorage.getItem('token')
    try {
      if (token && !usuario?.demo) await fetch(`${API_URL}/logout/`, {
        method: 'POST',
        headers: { Authorization: `Token ${token}` }
      })
    } catch {
    }
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    navigate('/')
  }

  return (
    <nav className="site-nav" aria-label="Navegación principal">
      <div className="nav-grupo nav-izquierda">
        <Link to="/">Inicio</Link>
        <Link to="/catalogo">Catálogo</Link>
        <Link to="/contacto">Contacto</Link>
      </div>

      <div className="nav-centro">
        <Link to="/quienes-somos">Quiénes somos</Link>
      </div>

      <div className="nav-grupo nav-derecha">
        {!usuario?.es_admin && (
          <Link to="/carrito" className="btn-nav btn-nav-secundario" aria-label="Carrito" title="Carrito">
            <svg className="nav-icono" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5M3.102 4l1.313 7h8.17l1.313-7zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4m7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4m-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2m7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2" />
            </svg>
          </Link>
        )}
        {usuario?.es_admin && (
          <Link to="/admin" className="btn-nav btn-nav-secundario">Panel</Link>
        )}

        {usuario ? (
          <div className="nav-auth">
            <span className="nav-saludo">Hola, {usuario.nombre}</span>
            <button type="button" className="btn-nav btn-nav-secundario" onClick={cerrarSesion}>
              Cerrar sesión
            </button>
          </div>
        ) : (
          <div className="nav-auth">
            <Link to="/login" className="btn-nav btn-nav-secundario">Iniciar sesión</Link>
            <Link to="/registro" className="btn-nav btn-nav-primario">Registrar</Link>
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
              {TEMAS.map(opcion => (
                <li key={opcion.valor} role="none">
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={tema === opcion.valor}
                    className={tema === opcion.valor ? 'activo' : undefined}
                    onClick={() => elegirTema(opcion.valor)}
                  >
                    {opcion.nombre}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar