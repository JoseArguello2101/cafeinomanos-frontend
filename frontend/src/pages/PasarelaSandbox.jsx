import { useSearchParams } from 'react-router-dom'
import { leerIntentoPago } from '../services/pago'
import { formatearPrecio } from '../services/productos'
import './PasarelaSandbox.css'

// Página de la tienda a la que la pasarela devuelve al cliente al terminar.
const URL_RETORNO = '/pago/retorno'

/**
 * Pasarela de pago simulada (solo entorno de prueba).
 *
 * Reemplaza al formulario real de la pasarela, porque el token del sandbox del backend
 * no existe en el proveedor. Recibe el token de la transacción y devuelve al cliente
 * a la tienda igual que lo haría una pasarela real: aprobado (token_ws) o anulado (TBK_TOKEN).
 * No pide ni guarda datos de tarjeta.
 */
function PasarelaSandbox() {
  const [parametros] = useSearchParams()
  const token = parametros.get('token_ws') || ''
  const pedidoId = parametros.get('pedido') || ''
  // Datos del intento creados por el backend (monto y moneda) guardados antes de salir de la tienda.
  const intento = leerIntentoPago()
  const datos = intento?.token === token ? intento : null

  // Vuelve a la tienda con el resultado, como una redirección real de la pasarela.
  function volverATienda(aprobado) {
    const destino = new URLSearchParams({ pedido: pedidoId })
    destino.set(aprobado ? 'token_ws' : 'TBK_TOKEN', token)
    window.location.assign(`${URL_RETORNO}?${destino}`)
  }

  if (!token || !pedidoId) {
    return (
      <section className="compra">
        <div className="compra-vacio" role="alert">
          <h1>Transacción no encontrada</h1>
          <p>Falta el token de la transacción. Vuelve a tu pedido e inicia el pago otra vez.</p>
          <a href="/confirmacion">Volver a mi pedido</a>
        </div>
      </section>
    )
  }

  return (
    <section className="pasarela" aria-labelledby="pasarela-titulo">
      <div className="pasarela-tarjeta">
        <p className="pasarela-entorno">Entorno de prueba · sandbox</p>
        <h1 id="pasarela-titulo">Pasarela de pago de prueba</h1>

        {/* Datos de la transacción entregados por el backend. */}
        <dl className="pasarela-datos">
          <div><dt>Comercio</dt><dd>Paraíso del Café</dd></div>
          <div><dt>Orden</dt><dd>PED-{String(pedidoId).padStart(6, '0')}</dd></div>
          <div><dt>Monto</dt><dd className="pasarela-monto">{datos ? formatearPrecio(datos.monto, datos.moneda) : 'Calculado por el comercio'}</dd></div>
          <div><dt>Token</dt><dd className="pasarela-token" title={token}>{token.slice(0, 14)}…</dd></div>
        </dl>

        <p className="pasarela-aviso">
          Esta pantalla simula la pasarela: no se cobra dinero real ni se piden datos de tarjeta.
        </p>

        <div className="pasarela-acciones">
          <button type="button" className="pasarela-boton pasarela-boton--primario" onClick={() => volverATienda(true)}>
            Aprobar pago de prueba
          </button>
          <button type="button" className="pasarela-boton" onClick={() => volverATienda(false)}>
            Anular y volver a la tienda
          </button>
        </div>
      </div>
    </section>
  )
}

export default PasarelaSandbox
