import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { pesos } from '../productos'
import { borrarUltimoPedido, leerUltimoPedido, obtenerPedido } from '../services/pedido'
import { estadoDeOrden } from '../estadosOrden'
import EstadoOrden from '../components/EstadoOrden'
import SeccionPago from '../components/SeccionPago'
import './Confirmacion.css'

// Cada cuántos segundos se vuelve a consultar el pedido mientras el pago se está verificando.
const SEGUNDOS_REFRESCO_VERIFICANDO = 10

// Título principal de la página según el estado de la orden.
const TITULOS = {
  pendiente: '¡Pedido registrado!',
  verificando: 'Estamos verificando tu pago',
  confirmada: '¡Pedido confirmado!',
  rechazada: 'El pago no fue aprobado',
  vencida: 'Tu pedido venció',
}

/**
 * Página de confirmación: muestra el último pedido del cliente con su estado real
 * (consultado al backend) y las acciones disponibles en ese estado.
 */
function Confirmacion() {
  const navigate = useNavigate()
  // Parte con el pedido guardado en la sesión y luego se reemplaza por el que devuelve el backend.
  const [pedido, setPedido] = useState(() => leerUltimoPedido())
  const [consultando, setConsultando] = useState(() => Boolean(leerUltimoPedido()))
  const [errorConsulta, setErrorConsulta] = useState('')
  // Al incrementarse, se vuelve a consultar el pedido.
  const [revision, setRevision] = useState(0)
  // Hora de referencia para calcular si la orden ya venció.
  const [ahora, setAhora] = useState(() => new Date())
  const idPedido = pedido?.id

  // Consulta el estado real del pedido al entrar y cada vez que se pide actualizar.
  useEffect(() => {
    if (!idPedido) return undefined
    const controlador = new AbortController()
    obtenerPedido(idPedido, controlador.signal)
      .then(actual => { setPedido(actual); setErrorConsulta(''); setAhora(new Date()) })
      .catch(problema => { if (problema.name !== 'AbortError') setErrorConsulta(problema.message) })
      .finally(() => { if (!controlador.signal.aborted) setConsultando(false) })
    return () => controlador.abort()
  }, [idPedido, revision])

  // Traduce el estado del backend a uno de los 5 estados visuales (pendiente, verificando, confirmada, rechazada, vencida).
  const estado = pedido ? estadoDeOrden(pedido, ahora) : null

  // Mientras el pago se verifica, vuelve a consultar sola cada pocos segundos.
  useEffect(() => {
    if (estado !== 'verificando') return undefined
    const temporizador = setInterval(() => setRevision(actual => actual + 1), SEGUNDOS_REFRESCO_VERIFICANDO * 1000)
    return () => clearInterval(temporizador)
  }, [estado])

  // Recalcula el estado cada minuto para detectar cuando la orden vence.
  useEffect(() => {
    if (estado !== 'pendiente' && estado !== 'verificando') return undefined
    const temporizador = setInterval(() => setAhora(new Date()), 60 * 1000)
    return () => clearInterval(temporizador)
  }, [estado])

  // Botones "Actualizar estado" y "Reintentar": vuelven a consultar el pedido.
  function actualizar() {
    setConsultando(true)
    setRevision(actual => actual + 1)
  }

  // Botón "Nueva compra": olvida el pedido guardado y lleva al catálogo.
  function nuevaCompra() {
    borrarUltimoPedido()
    navigate('/catalogo')
  }

  // Recibe las acciones del panel de estado que no son enlaces.
  function alAccionar(id) {
    if (id === 'nueva') nuevaCompra()
    else actualizar()
  }

  if (!pedido) {
    return (
      <section className="compra">
        <h1>Confirmación</h1>
        <div className="compra-vacio">
          <h2>No hay un pedido reciente</h2>
          <p>Completa una compra para ver aquí el resumen registrado en el servidor.</p>
          <Link to="/catalogo">Ir al catálogo</Link>
        </div>
      </section>
    )
  }

  const fecha = new Intl.DateTimeFormat('es-CL', { dateStyle: 'long', timeStyle: 'short' })
    .format(new Date(String(pedido.fecha).replace(' ', 'T')))
  const medioPago = { tarjeta: 'Tarjeta', transferencia: 'Transferencia' }[pedido.cliente?.metodo_pago] || 'No informado'

  return (
    <section className="compra" aria-labelledby="confirmacion-titulo">
      <h1 id="confirmacion-titulo">{TITULOS[estado]}</h1>

      {/* Panel con el estado de la orden y sus acciones; si la consulta falla, se muestra el último estado conocido. */}
      <EstadoOrden estado={estado} alAccionar={alAccionar} ocupado={consultando} />
      {errorConsulta && (
        <p className="compra-error" role="alert">
          No pudimos actualizar el estado ({errorConsulta}). Se muestra el último estado conocido.
        </p>
      )}

      {/* Sección de pago: solo mientras la orden aún se puede pagar (no confirmada ni vencida). */}
      {['pendiente', 'verificando', 'rechazada'].includes(estado) && <SeccionPago pedido={pedido} estado={estado} />}

      <div className="compra-tarjeta">
        <p className="eyebrow">Número de pedido</p>
        <p className="compra-code">{pedido.codigo}</p>
        <p className="compra-nota">Generado el {fecha}</p>

        <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0 0' }}>
          {pedido.items.map(item => (
            <li className="compra-resumen" key={item.id ?? item.producto_id}>
              <span>{item.cantidad} × {item.nombre}</span>
              <span>{pesos.format(item.subtotal)}</span>
            </li>
          ))}
        </ul>
        <div className="compra-total"><span>Total ({pedido.total_unidades} unidades)</span><strong>{pesos.format(pedido.total)}</strong></div>

        <div className="compra-datos">
          <span><strong>Entrega:</strong> {pedido.cliente.direccion}</span>
          <span><strong>Contacto:</strong> {pedido.cliente.nombre} · {pedido.cliente.correo}</span>
          <span><strong>Pago solicitado:</strong> {medioPago}</span>
        </div>
      </div>
    </section>
  )
}

export default Confirmacion
