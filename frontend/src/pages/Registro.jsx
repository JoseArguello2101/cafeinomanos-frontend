import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { solicitar } from '../api'
import { guardarRutaRetorno, obtenerRutaRetorno } from '../services/carrito'

function Registro() {
  const location = useLocation()
  const volverParam = new URLSearchParams(location.search).get('volver')
  // Si venía del carrito o del pago, conserva el retorno para cuando inicie sesión.
  const desde = obtenerRutaRetorno(location.state?.desde || volverParam)

  useEffect(() => {
    if (desde !== '/') guardarRutaRetorno(desde)
  }, [desde])

  const [datos, setDatos] = useState({
    nombre: '',
    apellido: '',
    email: ''
  })
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [registrado, setRegistrado] = useState(false)

  function cambiar(e) {
    setDatos({ ...datos, [e.target.name]: e.target.value })
  }

  function validar() {
    const nuevos = {}
    if (!datos.nombre.trim()) nuevos.nombre = 'Ingresa tu nombre'
    if (!datos.apellido.trim()) nuevos.apellido = 'Ingresa tu apellido'
    if (!datos.email.trim()) {
      nuevos.email = 'Ingresa tu correo'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email.trim())) {
      nuevos.email = 'El correo no tiene un formato válido'
    }
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
      await solicitar('/registro/', {
        method: 'POST',
        auth: false,
        datos: {
          nombre: datos.nombre.trim(),
          apellido: datos.apellido.trim(),
          email: datos.email.trim()
        }
      })

      // la cuenta queda pendiente: se activa con el enlace enviado por correo
      setRegistrado(true)
    } catch (error) {
      setErrorServidor(error.message || 'No se pudo crear la cuenta. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  if (registrado) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <h1 className="mb-3">Revisa tu correo</h1>
            <div className="alert alert-success">
              Te enviamos un enlace de activación a <strong>{datos.email.trim()}</strong>.
              El enlace vence en 24 horas y solo puede usarse una vez.
              {desde === '/carrito' && ' Cuando inicies sesión volverás automáticamente a tu carrito.'}
            </div>
            <p className="mb-0">
              ¿Ya tienes cuenta? <Link to="/login" state={{ desde }}>Inicia sesión</Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <h1 className="mb-4">Crear cuenta</h1>
          <p className="text-muted">
            Registra tus datos y te enviaremos un enlace para activar tu cuenta y definir tu contraseña.
          </p>

          {errorServidor && <div className="alert alert-danger">{errorServidor}</div>}

          <form onSubmit={enviar} noValidate>
            <div className="mb-3">
              <label htmlFor="nombre" className="form-label">Nombre</label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                className={`form-control ${errores.nombre ? 'is-invalid' : ''}`}
                value={datos.nombre}
                onChange={cambiar}
              />
              {errores.nombre && <div className="invalid-feedback">{errores.nombre}</div>}
            </div>

            <div className="mb-3">
              <label htmlFor="apellido" className="form-label">Apellido</label>
              <input
                id="apellido"
                name="apellido"
                type="text"
                className={`form-control ${errores.apellido ? 'is-invalid' : ''}`}
                value={datos.apellido}
                onChange={cambiar}
              />
              {errores.apellido && <div className="invalid-feedback">{errores.apellido}</div>}
            </div>

            <div className="mb-3">
              <label htmlFor="email" className="form-label">Correo</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className={`form-control ${errores.email ? 'is-invalid' : ''}`}
                value={datos.email}
                onChange={cambiar}
              />
              {errores.email && <div className="invalid-feedback">{errores.email}</div>}
            </div>

            <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
              {enviando ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="mt-3">
            ¿Ya tienes cuenta? <Link to="/login" state={{ desde }}>Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Registro
