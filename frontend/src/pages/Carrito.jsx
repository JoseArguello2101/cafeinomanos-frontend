import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { pesos, imagenPorProducto } from '../productos'
import { eliminarDelCarrito, EVENTO_CARRITO, obtenerCarrito } from '../services/carrito'
import { EVENTO_PRODUCTOS } from '../services/productos'
import './Carrito.css'

function Carrito() {
  const [carrito, setCarrito] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [eliminando, setEliminando] = useState(null)

  useEffect(() => {
    const controlador = new AbortController()
    obtenerCarrito(controlador.signal)
      .then(datos => { setCarrito(datos); setError('') })
      .catch(problema => { if (problema.name !== 'AbortError') setError(problema.message) })
      .finally(() => { if (!controlador.signal.aborted) setCargando(false) })
    return () => controlador.abort()
  }, [revision])

  async function eliminar(item) {
    setEliminando(item.id)
    setError('')
    try {
      const resultado = await eliminarDelCarrito(item.id)
      setRevision(actual => actual + 1)
      window.dispatchEvent(new Event(EVENTO_CARRITO))
      if (resultado?.stock_devuelto) window.dispatchEvent(new Event(EVENTO_PRODUCTOS))
    } catch (problema) {
      setError(problema.message)
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

  return (
    <section className="compra" aria-labelledby="carrito-titulo">
      <h1 id="carrito-titulo">Tu carrito</h1>
      <p className="compra-aviso">
        Los productos se obtienen del carrito guardado en el backend. Al confirmar, el pedido se registra en el servidor; el pago se confirma después sin cobros en línea.
      </p>

      {items.length === 0 ? (
        <div className="compra-vacio">
          <h2>Tu carrito está vacío</h2>
          <p>Agrega productos desde el catálogo para comenzar.</p>
          <Link to="/catalogo">Ir al catálogo</Link>
        </div>
      ) : (
        <div className="compra-tarjeta">
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
            Puedes eliminar un producto si te equivocaste o ya no lo quieres. El stock solo se descuenta al confirmar el pedido.
          </p>

          <div className="compra-acciones">
            <Link to="/pago">Continuar al pago</Link>
            <Link to="/catalogo" className="compra-secundario">Seguir comprando</Link>
          </div>
        </div>
      )}
    </section>
  )
}

export default Carrito
