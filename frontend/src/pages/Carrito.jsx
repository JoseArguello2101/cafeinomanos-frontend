import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { pesos, imagenPorProducto } from '../productos'
import {
  actualizarCantidad,
  eliminarDelCarrito,
  EVENTO_CARRITO,
  guardarRutaRetorno,
  obtenerCarrito,
} from '../services/carrito'
import { EVENTO_PRODUCTOS } from '../services/productos'
import './Carrito.css'

function Carrito() {
  const location = useLocation()
  const mensajeRetorno = location.state?.mensajeCarrito || ''
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null')
  const autenticado = Boolean(localStorage.getItem('token') && usuario)
  const [carrito, setCarrito] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [errorAccion, setErrorAccion] = useState('')
  const [revision, setRevision] = useState(0)
  const [eliminando, setEliminando] = useState(null)
  const [actualizando, setActualizando] = useState(null)
  const [borradores, setBorradores] = useState({})

  useEffect(() => {
    const controlador = new AbortController()
    obtenerCarrito(controlador.signal)
      .then(datos => {
        setCarrito(datos)
        setError('')
        setErrorAccion('')
        setBorradores(actual => {
          const siguientes = {}
          datos.items.forEach(item => {
            siguientes[item.id] = actual[item.id] ?? item.cantidad
          })
          return siguientes
        })
      })
      .catch(problema => { if (problema.name !== 'AbortError') setError(problema.message) })
      .finally(() => { if (!controlador.signal.aborted) setCargando(false) })
    return () => controlador.abort()
  }, [revision])

  async function cambiarCantidad(item, valor) {
    const cantidad = Number(valor)
    setErrorAccion('')
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      setBorradores(actual => ({ ...actual, [item.id]: item.cantidad }))
      setErrorAccion('La cantidad debe ser un número entero mayor a 0.')
      return
    }
    if (item.stock && cantidad > item.stock) {
      setBorradores(actual => ({ ...actual, [item.id]: item.cantidad }))
      setErrorAccion(`Solo hay ${item.stock} unidades disponibles de ${item.nombre}.`)
      return
    }
    if (cantidad === item.cantidad) {
      setBorradores(actual => ({ ...actual, [item.id]: cantidad }))
      return
    }

    setActualizando(item.id)
    try {
      await actualizarCantidad(item.id, cantidad)
      setBorradores(actual => ({ ...actual, [item.id]: cantidad }))
      setRevision(actual => actual + 1)
      window.dispatchEvent(new Event(EVENTO_CARRITO))
    } catch (problema) {
      setBorradores(actual => ({ ...actual, [item.id]: item.cantidad }))
      setErrorAccion(problema.message)
    } finally {
      setActualizando(null)
    }
  }

  async function eliminar(item) {
    setEliminando(item.id)
    setErrorAccion('')
    try {
      const resultado = await eliminarDelCarrito(item.id)
      setRevision(actual => actual + 1)
      window.dispatchEvent(new Event(EVENTO_CARRITO))
      if (resultado?.stock_devuelto) window.dispatchEvent(new Event(EVENTO_PRODUCTOS))
    } catch (problema) {
      setErrorAccion(problema.message)
    } finally {
      setEliminando(null)
    }
  }

  if (cargando) return <section className="compra"><h1>Tu carrito</h1><p role="status">Cargando carrito…</p></section>

  if (error) {
    return (
      <section className="compra">
        <h1>Tu carrito</h1>
        <div className="compra-vacio" role="alert">
          <h2>No pudimos cargar tu carrito</h2>
          <p>{error}</p>
          <button type="button" onClick={() => { setCargando(true); setRevision(actual => actual + 1) }}>Reintentar</button>
        </div>
      </section>
    )
  }

  const items = carrito?.items || []
  const inconsistencias = carrito?.inconsistencias || []
  const requiereRevision = Boolean(carrito?.requiere_revision || inconsistencias.length > 0)

  return (
    <section className="compra" aria-labelledby="carrito-titulo">
      <h1 id="carrito-titulo">Tu carrito</h1>
      <p className="compra-aviso">
        Los productos se obtienen del carrito guardado en el backend. Al confirmar, el pedido se registra en el servidor; el pago se confirma después sin cobros en línea.
      </p>

      {mensajeRetorno && !requiereRevision && (
        <p className="compra-aviso-exito" role="status">{mensajeRetorno}</p>
      )}

      {items.length > 0 && !autenticado && (
        <div className="compra-auth-banner" role="region" aria-label="Acceso de cliente">
          <p>¿Ya tienes cuenta? Inicia sesión o regístrate para conservar tu carrito y volver aquí automáticamente.</p>
          <div className="compra-auth-acciones">
            <Link to="/login" state={{ desde: '/carrito' }} onClick={() => guardarRutaRetorno('/carrito')}>
              Iniciar sesión
            </Link>
            <Link
              to="/registro"
              state={{ desde: '/carrito' }}
              className="compra-secundario"
              onClick={() => guardarRutaRetorno('/carrito')}
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="compra-vacio">
          <h2>Tu carrito está vacío</h2>
          <p>Agrega productos desde el catálogo para comenzar.</p>
          <Link to="/catalogo">Ir al catálogo</Link>
        </div>
      ) : (
        <div className="compra-tarjeta">
          {requiereRevision && (
            <div className="compra-revision" role="alert">
              <strong>Revisa tu carrito antes de continuar al pago:</strong>
              <ul>
                {inconsistencias.map(inc => (
                  <li key={`${inc.producto_id}-${inc.motivo}`}>{inc.mensaje}</li>
                ))}
              </ul>
            </div>
          )}
          {errorAccion && <p className="compra-error" role="alert">{errorAccion}</p>}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {items.map(item => (
              <li className="compra-item" key={item.id ?? item.producto_id}>
                <img
                  src={item.imagen_url}
                  alt={item.nombre}
                  onError={evento => { evento.currentTarget.onerror = null; evento.currentTarget.src = imagenPorProducto({ nombre: item.nombre }) }}
                />
                <div>
                  <h2>{item.nombre}</h2>
                  <p>{item.cantidad} × {pesos.format(item.precio_unitario)}</p>
                  <div className="compra-cantidad">
                    <button
                      type="button"
                      onClick={() => cambiarCantidad(item, Number(borradores[item.id] ?? item.cantidad) - 1)}
                      disabled={actualizando === item.id || Number(borradores[item.id] ?? item.cantidad) <= 1}
                      aria-label={`Quitar una unidad de ${item.nombre}`}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={item.stock || undefined}
                      value={borradores[item.id] ?? item.cantidad}
                      onChange={evento => setBorradores(actual => ({ ...actual, [item.id]: evento.target.value }))}
                      onBlur={evento => cambiarCantidad(item, evento.target.value)}
                      onKeyDown={evento => { if (evento.key === 'Enter') evento.currentTarget.blur() }}
                      disabled={actualizando === item.id}
                      aria-label={`Cantidad de ${item.nombre}`}
                    />
                    <button
                      type="button"
                      onClick={() => cambiarCantidad(item, Number(borradores[item.id] ?? item.cantidad) + 1)}
                      disabled={actualizando === item.id || Boolean(item.stock && Number(borradores[item.id] ?? item.cantidad) >= item.stock)}
                      aria-label={`Agregar una unidad de ${item.nombre}`}
                    >
                      +
                    </button>
                  </div>
                </div>
                <strong>{pesos.format(item.subtotal)}</strong>
                <button
                  type="button"
                  className="compra-eliminar"
                  disabled={eliminando === item.id}
                  onClick={() => eliminar(item)}
                  aria-label={`Eliminar ${item.nombre} del carrito`}
                  title="Eliminar del carrito"
                >
                  {eliminando === item.id ? 'Eliminando…' : 'Eliminar'}
                </button>
              </li>
            ))}
          </ul>

          <div className="compra-resumen"><span>Productos</span><span>{carrito.total_unidades} unidades</span></div>
          <div className="compra-total"><span>Total</span><strong>{pesos.format(carrito.total)}</strong></div>
          <p className="compra-nota">
            Puedes cambiar la cantidad o eliminar un producto si te equivocaste. El stock solo se descuenta al confirmar el pedido.
          </p>

          <div className="compra-acciones">
            {requiereRevision ? (
              <button type="button" className="compra-bloqueado" disabled>
                Corrige tu carrito para pagar
              </button>
            ) : (
              <Link to="/pago">Continuar al pago</Link>
            )}
            <Link to="/catalogo" className="compra-secundario">Seguir comprando</Link>
          </div>
        </div>
      )}
    </section>
  )
}

export default Carrito
