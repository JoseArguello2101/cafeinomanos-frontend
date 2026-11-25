import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import CamposContrasena from '../components/CamposContrasena'
import { registrarCliente } from '../services/auth'
import {
  combinarCarrito,
  EVENTO_CARRITO,
  guardarRutaRetorno,
  limpiarRutaRetorno,
  obtenerRutaRetorno,
} from '../services/carrito'
import { validarCamposContrasena } from '../utils/contrasena'

function unirErrorCampo(valor) {
  if (Array.isArray(valor)) return valor.join(' ')
  return typeof valor === 'string' ? valor : ''
}

function Registro() {
  const navigate = useNavigate()
  const location = useLocation()
  const volverParam = new URLSearchParams(location.search).get('volver')
  const desde = obtenerRutaRetorno(location.state?.desde || volverParam)

  useEffect(() => {
    if (desde !== '/') guardarRutaRetorno(desde)
  }, [desde])

  const [datos, setDatos] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmar: '',
  })
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [enviando, setEnviando] = useState(false)

  function cambiarCampo(campo, valor) {
    setDatos(actual => ({ ...actual, [campo]: valor }))
    setErrores(actual => {
      if (!actual[campo]) return actual
      const copia = { ...actual }
      delete copia[campo]
      return copia
    })
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
    return {
      ...nuevos,
      ...validarCamposContrasena(datos.password, datos.confirmar),
    }
  }

  async function enviar(e) {
    e.preventDefault()
    setErrorServidor('')

    const nuevos = validar()
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    setEnviando(true)
    try {
      await registrarCliente({
        nombre: datos.nombre,
        apellido: datos.apellido,
        email: datos.email,
        password: datos.password,
      })

      // Si tenía un carrito anónimo (visitante), lo combina con su nueva cuenta
      // y lo retorna al carrito (RB-02 / RF-26), nunca a administración.
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
    } catch (error) {
      const porCampo = error.erroresPorCampo || {}
      const erroresBackend = {}
      if (porCampo.nombre) erroresBackend.nombre = unirErrorCampo(porCampo.nombre)
      if (porCampo.apellido) erroresBackend.apellido = unirErrorCampo(porCampo.apellido)
      if (porCampo.email) erroresBackend.email = unirErrorCampo(porCampo.email)
      if (porCampo.password) erroresBackend.password = unirErrorCampo(porCampo.password)

      if (Object.keys(erroresBackend).length > 0) {
        setErrores(erroresBackend)
      } else {
        setErrorServidor(error.message || 'No se pudo crear la cuenta. Intenta de nuevo.')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <h1 className="mb-4">Crear cuenta</h1>
          <p className="text-muted">
            Completa tus datos y define tu contraseña para comprar en Paraíso del Café.
          </p>

          {errorServidor && <div className="alert alert-danger" role="alert">{errorServidor}</div>}

          <form onSubmit={enviar} noValidate>
            <div className="mb-3">
              <label htmlFor="nombre" className="form-label">Nombre</label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                autoComplete="given-name"
                disabled={enviando}
                aria-invalid={Boolean(errores.nombre)}
                className={`form-control ${errores.nombre ? 'is-invalid' : ''}`}
                value={datos.nombre}
                onChange={e => cambiarCampo('nombre', e.target.value)}
              />
              {errores.nombre && <div className="invalid-feedback">{errores.nombre}</div>}
            </div>

            <div className="mb-3">
              <label htmlFor="apellido" className="form-label">Apellido</label>
              <input
                id="apellido"
                name="apellido"
                type="text"
                autoComplete="family-name"
                disabled={enviando}
                aria-invalid={Boolean(errores.apellido)}
                className={`form-control ${errores.apellido ? 'is-invalid' : ''}`}
                value={datos.apellido}
                onChange={e => cambiarCampo('apellido', e.target.value)}
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
                disabled={enviando}
                aria-invalid={Boolean(errores.email)}
                className={`form-control ${errores.email ? 'is-invalid' : ''}`}
                value={datos.email}
                onChange={e => cambiarCampo('email', e.target.value)}
              />
              {errores.email && <div className="invalid-feedback">{errores.email}</div>}
            </div>

            <CamposContrasena
              password={datos.password}
              confirmar={datos.confirmar}
              onPasswordChange={valor => cambiarCampo('password', valor)}
              onConfirmarChange={valor => cambiarCampo('confirmar', valor)}
              errores={errores}
              disabled={enviando}
            />

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