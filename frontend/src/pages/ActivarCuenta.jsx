import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { confirmarActivacion, validarActivacion } from '../services/activacion'

function ActivarCuenta() {
  const { token } = useParams()
  // estados posibles: cargando | valido | invalido | activado
  const [estado, setEstado] = useState('cargando')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    const controlador = new AbortController()
    validarActivacion(token, controlador.signal)
      .then(respuesta => {
        if (respuesta?.vigente) {
          setEmail(respuesta.email || '')
          setEstado('valido')
        } else {
          setEstado('invalido')
        }
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          setErrorServidor(error.message)
          setEstado('invalido')
        }
      })
    return () => controlador.abort()
  }, [token])

  function validar() {
    const nuevos = {}
    if (password.length < 8) nuevos.password = 'La contraseña debe tener al menos 8 caracteres'
    if (confirmar !== password) nuevos.confirmar = 'Las contraseñas no coinciden'
    return nuevos
  }

  async function enviar(e) {
    e.preventDefault()
    setErrorServidor('')

    const nuevos = validar()
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    setEnviando(true)
    try {
      await confirmarActivacion(token, password)
      setEstado('activado')
    } catch (error) {
      setErrorServidor(error.message)
    } finally {
      setEnviando(false)
    }
  }

  if (estado === 'cargando') {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status" />
        <p className="mt-3">Validando tu enlace de activación...</p>
      </div>
    )
  }

  if (estado === 'invalido') {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <h1 className="mb-3">Enlace no válido</h1>
            <div className="alert alert-danger">
              {errorServidor || 'Este enlace no es válido, ya fue usado o venció.'}
            </div>
            <p className="mb-0">
              Solicita un nuevo enlace al administrador o vuelve al <Link to="/login">inicio de sesión</Link>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (estado === 'activado') {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <h1 className="mb-3">¡Cuenta activada!</h1>
            <div className="alert alert-success">
              Tu contraseña quedó guardada de forma segura. Ya puedes iniciar sesión.
            </div>
            <Link className="btn btn-primary" to="/login">Iniciar sesión</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <h1 className="mb-4">Activar cuenta</h1>

          {email && <p className="mb-3">Define la contraseña para <strong>{email}</strong>.</p>}
          {errorServidor && <div className="alert alert-danger">{errorServidor}</div>}

          <form onSubmit={enviar} noValidate>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                className={`form-control ${errores.password ? 'is-invalid' : ''}`}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              {errores.password && <div className="invalid-feedback">{errores.password}</div>}
            </div>

            <div className="mb-3">
              <label htmlFor="confirmar" className="form-label">Repetir contraseña</label>
              <input
                id="confirmar"
                name="confirmar"
                type="password"
                autoComplete="new-password"
                className={`form-control ${errores.confirmar ? 'is-invalid' : ''}`}
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
              />
              {errores.confirmar && <div className="invalid-feedback">{errores.confirmar}</div>}
            </div>

            <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
              {enviando ? 'Activando cuenta...' : 'Activar cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ActivarCuenta
