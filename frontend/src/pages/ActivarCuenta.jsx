import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { confirmarActivacion, validarActivacion } from '../services/activacion'

const LARGO_MINIMO = 8

// Pantallas que se muestran cuando el enlace no se puede usar.
const AVISOS = {
  invalido: {
    titulo: 'Enlace no válido',
    clase: 'alert-danger',
    texto: 'Este enlace de activación no es válido. Puede estar incompleto o haber sido reemplazado por uno más reciente.',
    ayuda: 'Revisa que copiaste el enlace completo o pide un nuevo enlace al administrador.',
  },
  expirado: {
    titulo: 'El enlace expiró',
    clase: 'alert-warning',
    texto: 'Este enlace de activación venció. Por seguridad, los enlaces solo son válidos por un tiempo limitado.',
    ayuda: 'Pide al administrador que te envíe un nuevo enlace de activación.',
  },
  usado: {
    titulo: 'Este enlace ya fue utilizado',
    clase: 'alert-info',
    texto: 'Tu cuenta ya se activó con este enlace, así que no puede volver a usarse.',
    ayuda: 'Si ya definiste tu contraseña, inicia sesión con ella.',
  },
}

/** Requisitos que se muestran al usuario mientras escribe la contraseña. */
function requisitosContrasena(password) {
  return [
    { texto: `Al menos ${LARGO_MINIMO} caracteres`, cumple: password.length >= LARGO_MINIMO },
    { texto: 'No puede ser solo números', cumple: password.length > 0 && !/^\d+$/.test(password) },
  ]
}

function Tarjeta({ titulo, children }) {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-7 col-lg-6">
          <h1 className="mb-3">{titulo}</h1>
          {children}
        </div>
      </div>
    </div>
  )
}

function ActivarCuenta() {
  const { token } = useParams()
  // cargando | valido | invalido | expirado | usado | activado | error
  const [estado, setEstado] = useState('cargando')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    const controlador = new AbortController()
    validarActivacion(token, controlador.signal)
      .then(respuesta => {
        if (respuesta?.vigente) {
          setEmail(respuesta.email || '')
          setEstado('valido')
        } else {
          setEstado(AVISOS[respuesta?.motivo] ? respuesta.motivo : 'invalido')
        }
      })
      .catch(error => {
        if (error.name === 'AbortError') return
        setErrorServidor(error.message)
        setEstado('error')
      })
    return () => controlador.abort()
  }, [token, intento])

  function validar() {
    const nuevos = {}
    if (requisitosContrasena(password).some(requisito => !requisito.cumple)) {
      nuevos.password = 'La contraseña no cumple los requisitos.'
    }
    if (!confirmar) nuevos.confirmar = 'Repite la contraseña.'
    else if (confirmar !== password) nuevos.confirmar = 'Las contraseñas no coinciden.'
    return nuevos
  }

  async function enviar(evento) {
    evento.preventDefault()
    setErrorServidor('')

    const nuevos = validar()
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    setEnviando(true)
    try {
      const respuesta = await confirmarActivacion(token, password)
      if (respuesta?.email) setEmail(respuesta.email)
      setEstado('activado')
    } catch (error) {
      if (AVISOS[error.motivo]) {
        setEstado(error.motivo)
      } else if (error.erroresPorCampo?.password) {
        const lista = error.erroresPorCampo.password
        setErrores({ password: Array.isArray(lista) ? lista.join(' ') : String(lista) })
      } else {
        setErrorServidor(error.message)
      }
    } finally {
      setEnviando(false)
    }
  }

  if (estado === 'cargando') {
    return (
      <div className="container py-5 text-center" role="status" aria-live="polite">
        <div className="spinner-border" aria-hidden="true" />
        <p className="mt-3">Validando tu enlace de activación…</p>
      </div>
    )
  }

  if (estado === 'error') {
    return (
      <Tarjeta titulo="No pudimos validar el enlace">
        <div className="alert alert-danger" role="alert">{errorServidor}</div>
        <button type="button" className="btn btn-primary" onClick={() => { setEstado('cargando'); setIntento(actual => actual + 1) }}>
          Reintentar
        </button>
      </Tarjeta>
    )
  }

  if (AVISOS[estado]) {
    const aviso = AVISOS[estado]
    return (
      <Tarjeta titulo={aviso.titulo}>
        <div className={`alert ${aviso.clase}`} role="alert">{aviso.texto}</div>
        <p>{aviso.ayuda}</p>
        <div className="d-flex flex-wrap gap-2">
          <Link className="btn btn-primary" to="/login">Ir a iniciar sesión</Link>
          <Link className="btn btn-outline-secondary" to="/contacto">Contactar a la cafetería</Link>
        </div>
      </Tarjeta>
    )
  }

  if (estado === 'activado') {
    return (
      <Tarjeta titulo="¡Cuenta activada!">
        <div className="alert alert-success" role="status">
          {email ? <>La cuenta <strong>{email}</strong> quedó activa.</> : 'Tu cuenta quedó activa.'} Tu contraseña se guardó de forma segura.
        </div>
        <p>Ya puedes iniciar sesión con tu correo y la contraseña que acabas de definir.</p>
        <Link className="btn btn-primary" to="/login">Iniciar sesión</Link>
      </Tarjeta>
    )
  }

  const requisitos = requisitosContrasena(password)
  return (
    <Tarjeta titulo="Activar cuenta">
      <p className="mb-3">
        {email ? <>Define una contraseña para <strong>{email}</strong> y tu cuenta quedará activa.</> : 'Define una contraseña para activar tu cuenta.'}
      </p>
      {errorServidor && <div className="alert alert-danger" role="alert">{errorServidor}</div>}

      <form onSubmit={enviar} noValidate>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Nueva contraseña</label>
          <div className="input-group has-validation">
            <input
              id="password"
              name="password"
              type={mostrar ? 'text' : 'password'}
              autoComplete="new-password"
              aria-describedby="requisitos-password"
              aria-invalid={Boolean(errores.password)}
              className={`form-control ${errores.password ? 'is-invalid' : ''}`}
              value={password}
              onChange={evento => setPassword(evento.target.value)}
            />
            <button type="button" className="btn btn-outline-secondary" onClick={() => setMostrar(actual => !actual)} aria-pressed={mostrar}>
              {mostrar ? 'Ocultar' : 'Mostrar'}
            </button>
            {errores.password && <div className="invalid-feedback">{errores.password}</div>}
          </div>
          <ul id="requisitos-password" className="list-unstyled small mt-2 mb-0">
            {requisitos.map(requisito => (
              <li key={requisito.texto} className={requisito.cumple ? 'text-success' : 'text-muted'}>
                <span aria-hidden="true">{requisito.cumple ? '✓' : '•'}</span> {requisito.texto}
                <span className="visually-hidden">{requisito.cumple ? ' (cumplido)' : ' (pendiente)'}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-4">
          <label htmlFor="confirmar" className="form-label">Repetir contraseña</label>
          <input
            id="confirmar"
            name="confirmar"
            type={mostrar ? 'text' : 'password'}
            autoComplete="new-password"
            aria-invalid={Boolean(errores.confirmar)}
            className={`form-control ${errores.confirmar ? 'is-invalid' : ''}`}
            value={confirmar}
            onChange={evento => setConfirmar(evento.target.value)}
          />
          {errores.confirmar && <div className="invalid-feedback">{errores.confirmar}</div>}
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
          {enviando ? 'Activando cuenta…' : 'Activar cuenta'}
        </button>
      </form>
    </Tarjeta>
  )
}

export default ActivarCuenta
