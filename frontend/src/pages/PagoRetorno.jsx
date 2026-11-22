import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import EstadoOrden from '../components/EstadoOrden'
import { borrarIntentoPago, leerIntentoPago, verificarRetornoPago } from '../services/pago'
import { leerUltimoPedido, obtenerPedido } from '../services/pedido'

// Textos de la vista según el resultado de la verificación.
const RESULTADOS = {
  verificando: {
    titulo: 'Estamos verificando tu pago',
    descripcion: 'Volviste de la pasarela. Estamos confirmando el resultado con el backend; no cierres esta página.',
    acciones: [],
  },
  confirmada: {
    titulo: '¡Pago aprobado!',
    descripcion: 'El pago fue verificado y tu orden quedó confirmada.',
    acciones: ['pedido', 'seguir'],
  },
  anulado: {
    titulo: 'Pago anulado',
    descripcion: 'Anulaste el pago en la pasarela. No se realizó ningún cobro; puedes intentarlo de nuevo desde tu pedido.',
    acciones: ['pedido', 'carrito'],
  },
}

/**
 * Vista de retorno desde la pasarela.
 *
 * La pasarela devuelve al cliente con token_ws (pago terminado) o TBK_TOKEN (pago anulado).
 * Con token_ws se muestra "Verificando" y se pide al backend que confirme el resultado;
 * luego se muestra si el pago quedó aprobado o rechazado.
 */
function PagoRetorno() {
  const [parametros] = useSearchParams()
  const tokenPago = parametros.get('token_ws') || ''
  const tokenAnulado = parametros.get('TBK_TOKEN') || ''
  // El pedido viene en la URL; si falta, se usa el del intento guardado antes de ir a la pasarela.
  const pedidoId = parametros.get('pedido') || leerIntentoPago()?.pedidoId || ''

  // verificando | confirmada | rechazada | anulado | error
  const [resultado, setResultado] = useState(tokenPago ? 'verificando' : 'anulado')
  const [mensaje, setMensaje] = useState('')
  const [intento, setIntento] = useState(0)
  // Evita mandar la verificación dos veces (React en desarrollo ejecuta los efectos dos veces).
  const enviado = useRef(-1)

  // Si el cliente anuló en la pasarela no hay nada que verificar: se limpia el intento guardado.
  useEffect(() => {
    if (!tokenPago) borrarIntentoPago()
  }, [tokenPago])

  // Con token_ws, pide al backend verificar el pago una sola vez por intento.
  useEffect(() => {
    if (!tokenPago || !pedidoId || enviado.current === intento) return
    enviado.current = intento
    verificarRetornoPago(pedidoId, tokenPago)
      .then(async () => {
        // Actualiza la copia del pedido en la sesión para que Confirmación muestre el estado nuevo.
        if (String(leerUltimoPedido()?.id) === String(pedidoId)) {
          await obtenerPedido(pedidoId).catch(() => null)
        }
        borrarIntentoPago()
        setResultado('confirmada')
      })
      .catch(problema => {
        if (problema.status >= 400 && problema.status < 500) {
          // El backend respondió con un rechazo (pago rechazado, monto o pedido que no coinciden…).
          setMensaje(problema.message)
          setResultado('rechazada')
          borrarIntentoPago()
        } else {
          // Sin conexión o error interno del servidor (5xx): no es un rechazo del pago,
          // así que se mantiene "Verificando" con opción de reintentar.
          setMensaje(problema.message)
          setResultado('error')
        }
      })
  }, [tokenPago, pedidoId, intento])

  // Vuelve a intentar la verificación tras un error de conexión.
  function reintentar() {
    setMensaje('')
    setResultado('verificando')
    setIntento(actual => actual + 1)
  }

  if (!pedidoId || (!tokenPago && !tokenAnulado)) {
    return (
      <section className="compra">
        <h1>Retorno de pago</h1>
        <div className="compra-vacio" role="alert">
          <h2>No encontramos la transacción</h2>
          <p>El enlace de retorno no trae los datos del pago. Revisa el estado desde tu pedido.</p>
          <a href="/confirmacion">Ver mi pedido</a>
        </div>
      </section>
    )
  }

  // Elige qué estado visual y qué textos mostrar según el resultado.
  let panel
  if (resultado === 'rechazada') {
    panel = { estado: 'rechazada', titulo: 'Pago rechazado', descripcion: `${mensaje} No se realizó ningún cobro.`, acciones: ['pedido', 'carrito', 'contacto'] }
  } else if (resultado === 'error') {
    panel = { estado: 'verificando', titulo: 'No pudimos terminar la verificación', descripcion: `${mensaje} Tu pago no se pierde: vuelve a intentarlo.`, acciones: ['reintentar', 'pedido'] }
  } else if (resultado === 'anulado') {
    panel = { estado: 'rechazada', ...RESULTADOS.anulado }
  } else {
    panel = { estado: resultado, ...RESULTADOS[resultado] }
  }

  return (
    <section className="compra" aria-labelledby="retorno-titulo">
      <h1 id="retorno-titulo">{panel.titulo}</h1>
      <EstadoOrden
        estado={panel.estado}
        titulo={`Orden PED-${String(pedidoId).padStart(6, '0')}`}
        descripcion={panel.descripcion}
        acciones={panel.acciones}
        alAccionar={reintentar}
      />
      {/* Mientras se verifica, un indicador de carga deja claro que la página sigue trabajando. */}
      {resultado === 'verificando' && <p className="compra-aviso" aria-hidden="true">Verificando con el servidor…</p>}
    </section>
  )
}

export default PagoRetorno
