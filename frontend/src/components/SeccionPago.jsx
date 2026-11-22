import { useRef, useState } from 'react'
import { iniciarPago } from '../services/pago'
import { formatearPrecio } from '../services/productos'
import './SeccionPago.css'

// Página local que hace de formulario de la pasarela de prueba (el token del sandbox no existe en Transbank).
const ACCION_PASARELA = '/pago/pasarela-sandbox'

// Texto del botón según el estado de la orden.
const TEXTO_BOTON = {
  pendiente: 'Pagar con pasarela de prueba',
  verificando: 'Continuar pago',
  rechazada: 'Reintentar pago',
}

/**
 * Envía al cliente al formulario de la pasarela con los datos que entregó el backend.
 * Igual que una pasarela real, se hace con un formulario que lleva el token de la transacción.
 */
function enviarAFormularioPasarela(intento) {
  const formulario = document.createElement('form')
  formulario.method = 'GET'
  formulario.action = ACCION_PASARELA
  const campos = { token_ws: intento.token, pedido: intento.pedidoId }
  Object.entries(campos).forEach(([nombre, valor]) => {
    const campo = document.createElement('input')
    campo.type = 'hidden'
    campo.name = nombre
    campo.value = String(valor)
    formulario.appendChild(campo)
  })
  document.body.appendChild(formulario)
  formulario.submit()
}

/**
 * Sección de pago dentro del flujo de compra.
 * Muestra el total a pagar y el botón que crea el intento de pago de prueba en el backend.
 */
function SeccionPago({ pedido, estado }) {
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  // Bloqueo inmediato contra doble clic: el estado de React tarda un render en aplicarse, la ref no.
  const bloqueo = useRef(false)

  async function pagar() {
    if (bloqueo.current) return
    bloqueo.current = true
    setEnviando(true)
    setError('')
    try {
      const intento = await iniciarPago(pedido.id)
      // Se mantiene el bloqueo: el navegador ya está saliendo hacia la pasarela.
      enviarAFormularioPasarela(intento)
    } catch (problema) {
      setError(problema.message || 'No se pudo crear el intento de pago. Intenta de nuevo.')
      bloqueo.current = false
      setEnviando(false)
    }
  }

  return (
    <section className="compra-tarjeta seccion-pago" aria-labelledby="seccion-pago-titulo" aria-busy={enviando}>
      <h2 id="seccion-pago-titulo">Pago</h2>

      {/* Resumen de lo que se va a pagar. */}
      <dl className="seccion-pago-datos">
        <div><dt>Total a pagar</dt><dd className="seccion-pago-monto">{formatearPrecio(pedido.total, 'CLP')}</dd></div>
        <div><dt>Medio de pago</dt><dd>Pasarela de prueba (sandbox)</dd></div>
      </dl>
      <p className="seccion-pago-aviso">
        Es un entorno de prueba: no se cobra dinero real y no se piden datos de tarjeta.
        {estado === 'verificando' && ' Si no terminaste el pago en la pasarela, puedes continuarlo.'}
      </p>

      {error && <p className="compra-error" role="alert">{error}</p>}

      {/* Botón de pago con estado de carga mientras el backend crea el intento. */}
      <button type="button" className="seccion-pago-boton" onClick={pagar} disabled={enviando}>
        {enviando
          ? <><span className="seccion-pago-spinner" aria-hidden="true" />Creando intento de pago…</>
          : TEXTO_BOTON[estado] || TEXTO_BOTON.pendiente}
      </button>
      <p className="visually-hidden" role="status" aria-live="polite">
        {enviando ? 'Creando intento de pago, espera un momento.' : ''}
      </p>
    </section>
  )
}

export default SeccionPago
