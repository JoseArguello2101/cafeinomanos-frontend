import { useNavigate } from 'react-router-dom'
import { pesos } from '../productos'
import { borrarUltimoPedido, leerUltimoPedido } from '../services/pedido'
import './Confirmacion.css'

const ETIQUETAS_ESTADO = {
  PENDIENTE: 'Pendiente de pago',
  PAGADO: 'Pagado',
  PREPARANDO: 'En preparación',
  LISTO: 'Listo para retiro / despacho',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
}

function Confirmacion() {
  const navigate = useNavigate()
  const pedido = leerUltimoPedido()

  function nuevaCompra() {
    borrarUltimoPedido()
    navigate('/catalogo')
  }

  if (!pedido) {
    return (
      <section className="compra">
        <h1>Confirmación</h1>
        <div className="compra-vacio">
          <h2>No hay un pedido reciente</h2>
          <p>Completa una compra para ver aquí el resumen registrado en el servidor.</p>
          <a href="/catalogo">Ir al catálogo</a>
        </div>
      </section>
    )
  }

  const fecha = new Intl.DateTimeFormat('es-CL', { dateStyle: 'long', timeStyle: 'short' })
    .format(new Date(String(pedido.fecha).replace(' ', 'T')))
  const medioPago = pedido.cliente.metodo_pago === 'tarjeta' ? 'Tarjeta' : 'Transferencia'

  return (
    <section className="compra" aria-labelledby="confirmacion-titulo">
      <h1 id="confirmacion-titulo">¡Pedido registrado!</h1>
      <p className="compra-aviso" role="status">
        Tu pedido quedó guardado en el servidor con estado <strong>{ETIQUETAS_ESTADO[pedido.estado] || pedido.estado}</strong>.
        No se realizó ningún cobro: el pago se registra desde el panel administrativo.
      </p>

      <div className="compra-tarjeta">
        <p className="eyebrow">Número de pedido</p>
        <p className="compra-code" role="status">{pedido.codigo}</p>
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
          <span><strong>Pago solicitado:</strong> {medioPago} (sin cobro)</span>
        </div>

        <div className="compra-acciones">
          <button type="button" onClick={nuevaCompra}>Nueva compra</button>
          <a href="/catalogo" className="compra-secundario">Seguir comprando</a>
        </div>
      </div>
    </section>
  )
}

export default Confirmacion
