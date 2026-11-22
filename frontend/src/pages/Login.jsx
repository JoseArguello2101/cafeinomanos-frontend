import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { solicitar } from '../api'
import {
  combinarCarrito,
  EVENTO_CARRITO,
  guardarRutaRetorno,
  limpiarRutaRetorno,
  obtenerRutaRetorno,
} from '../services/carrito'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const volverParam = new URLSearchParams(location.search).get('volver')
  // Si venía del carrito o del pago, después de entrar vuelve ahí (nunca a /admin).
  const desde = obtenerRutaRetorno(location.state?.desde || volverParam)

  useEffect(() => {
    if (desde !== '/') guardarRutaRetorno(desde)
  }, [desde])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [enviando, setEnviando] = useState(false)

  function validar() {
    const nuevos = {}
    if (!email.trim()) {
      nuevos.email = 'Ingresa tu correo'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nuevos.email = 'El correo no tiene un formato válido'
    }
    if (!password) nuevos.password = 'Ingresa tu contraseña'
    return nuevos
  }

  async function enviar(e) {
    e.preventDefault()
    setErrorServidor('')

    // Acceso al prototipo, disponible únicamente en el servidor de desarrollo.
    if (import.meta.env.DEV && email.trim() === 'admin1') {
      setErrores({})
      if (password !== 'admin1') {
        setErrorServidor('Usuario o contraseña de demostración incorrectos.')
        return
      }
      localStorage.removeItem('token')
      localStorage.setItem('usuario', JSON.stringify({
        id: 'admin1-demo', nombre: 'Admin1', apellido: 'Demo',
        email: 'admin1@ejemplo.cl', es_admin: true, demo: true,
      }))
      window.dispatchEvent(new Event(EVENTO_CARRITO))
      navigate('/admin')
      return
    }

    const nuevos = validar()
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    setEnviando(true)
    try {
      const resultado = await solicitar('/login/', {
        method: 'POST',
        auth: false,
        datos: { email: email.trim(), password },
      })

      localStorage.setItem('token', resultado.token)
      localStorage.setItem('usuario', JSON.stringify(resultado.usuario))

      // El admin va a su panel; el cliente combina su carrito y vuelve a una ruta segura.
      if (resultado.usuario.es_admin) {
        limpiarRutaRetorno()
        window.dispatchEvent(new Event(EVENTO_CARRITO))
        navigate('/admin')
      } else {
        const combinado = await combinarCarrito().catch(() => null)
        window.dispatchEvent(new Event(EVENTO_CARRITO))
        const destinoSeguro = obtenerRutaRetorno(desde)
        limpiarRutaRetorno()
        const destinoFinal = destinoSeguro === '/pago' ? '/carrito' : destinoSeguro
        navigate(destinoFinal, {
          state: destinoFinal === '/carrito' && combinado?.message
            ? { mensajeCarrito: combinado.message }
            : undefined,
        })
      }
    } catch (error) {
      setErrorServidor(error.message || 'No se pudo iniciar sesión. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <h1 className="mb-4">Iniciar sesión</h1>
          {import.meta.env.DEV && <p className="mb-3">Acceso de demostración: usuario <strong>admin1</strong> y contraseña <strong>admin1</strong>.</p>}

          {errorServidor && <div className="alert alert-danger">{errorServidor}</div>}

          <form onSubmit={enviar} noValidate>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">{import.meta.env.DEV ? 'Correo o usuario' : 'Correo'}</label>
              <input
                id="email"
                type={import.meta.env.DEV ? 'text' : 'email'}
                autoComplete="username"
                className={`form-control ${errores.email ? 'is-invalid' : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errores.email && <div className="invalid-feedback">{errores.email}</div>}
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">Contraseña</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className={`form-control ${errores.password ? 'is-invalid' : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errores.password && <div className="invalid-feedback">{errores.password}</div>}
            </div>

            <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
              {enviando ? 'Entrando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="mt-3">
            ¿No tienes cuenta? <Link to="/registro" state={{ desde }}>Regístrate</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
