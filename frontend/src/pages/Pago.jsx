import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { pesos } from '../productos'
import { EVENTO_CARRITO, obtenerCarrito } from '../services/carrito'
import { crearPedido } from '../services/pedido'
import { EVENTO_PRODUCTOS } from '../services/productos'
import './Pago.css'

function Pago() {
  const navigate = useNavigate()
  const [carrito, setCarrito] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [errorCarrito, setErrorCarrito] = useState('')
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [errores, setErrores] = useState({})
  const [formulario, setFormulario] = useState({
    nombre: '', correo: '', direccion: '', comuna: '', metodo_pago: 'tarjeta',
  })

  useEffect(() => {
    const controlador = new AbortController()
    obtenerCarrito(controlador.signal)
      .then(setCarrito)
      .catch(problema => { if (problema.name !== 'AbortError') setErrorCarrito(problema.message) })
      .finally(() => { if (!controlador.signal.aborted) setCargando(false) })
    return () => controlador.abort()
  }, [])

  function cambiar(evento) {
    const { name, value } = evento.target
    setFormulario(actual => ({ ...actual, [name]: value }))
    setErrores(actual => ({ ...actual, [name]: undefined }))
  }

  function validar() {
    const nuevos = {}
    if (!formulario.nombre.trim()) nuevos.nombre = 'Ingresa tu nombre.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.correo.trim())) {
      nuevos.correo = 'Ingresa un correo válido.'
    }
    if (formulario.direccion.trim().length < 5) nuevos.direccion = 'Ingresa una dirección válida.'
    if (formulario.comuna.trim().length < 2) nuevos.comuna = 'Ingresa una comuna válida.'
    if (!['tarjeta', 'transferencia'].includes(formulario.metodo_pago)) {
      nuevos.metodo_pago = 'Selecciona un medio de pago.'
    }
    return nuevos
  }

  async function enviar(evento) {
    evento.preventDefault()
    setErrorGeneral('')
    const nuevos = validar()
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return
    if (!carrito || carrito.items.length === 0) {
      setErrorGeneral('No hay productos en el carrito para confirmar.')
      return
    }

    setEnviando(true)
    try {
      await crearPedido(formulario)
      window.dispatchEvent(new Event(EVENTO_CARRITO))
      window.dispatchEvent(new Event(EVENTO_PRODUCTOS))
      navigate('/confirmacion')
    } catch (problema) {
      setErrorGeneral(problema.message || 'No se pudo registrar el pedido. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  if (cargando) return <section className="compra"><h1>Finalizar compra</h1><p role="status">Cargando carrito…</p></section>

  if (errorCarrito || !carrito) {
    return (
      <section className="compra">
        <h1>Finalizar compra</h1>
        <div className="compra-vacio" role="alert">
          <h2>No pudimos cargar el carrito</h2>
          <p>{errorCarrito || 'No se recibió información del carrito.'}</p>
          <Link to="/carrito">Volver al carrito</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="compra" aria-labelledby="pago-titulo">
      <h1 id="pago-titulo">Finalizar compra</h1>
      <p className="compra-aviso" role="status">
        El pedido se registra en el servidor y queda <strong>pendiente de pago</strong>. No se realiza ningún cobro
        ni se solicitan datos de tarjeta; el pago se confirma desde el panel administrativo.
      </p>

      <div className="compra-tarjeta">
        <h2>Resumen del pedido</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {carrito.items.map(item => (
            <li className="compra-resumen" key={item.id ?? item.producto_id}>
              <span>{item.cantidad} × {item.nombre}</span>
              <span>{pesos.format(item.subtotal)}</span>
            </li>
          ))}
        </ul>
        <div className="compra-total"><span>Total ({carrito.total_unidades} unidades)</span><strong>{pesos.format(carrito.total)}</strong></div>
      </div>

      <form className="compra-formulario" onSubmit={enviar} noValidate>
        <h2>Datos de entrega</h2>
        <label>
          Nombre completo
          <input name="nombre" type="text" autoComplete="name" value={formulario.nombre} onChange={cambiar} className={errores.nombre ? 'input-error' : ''} />
          {errores.nombre && <span className="compra-error" role="alert">{errores.nombre}</span>}
        </label>
        <label>
          Correo electrónico
          <input name="correo" type="email" autoComplete="email" value={formulario.correo} onChange={cambiar} className={errores.correo ? 'input-error' : ''} />
          {errores.correo && <span className="compra-error" role="alert">{errores.correo}</span>}
        </label>
        <div className="campo-doble">
          <label>
            Dirección
            <input name="direccion" type="text" autoComplete="street-address" value={formulario.direccion} onChange={cambiar} className={errores.direccion ? 'input-error' : ''} />
            {errores.direccion && <span className="compra-error" role="alert">{errores.direccion}</span>}
          </label>
          <label>
            Comuna
            <input name="comuna" type="text" autoComplete="address-level2" value={formulario.comuna} onChange={cambiar} className={errores.comuna ? 'input-error' : ''} />
            {errores.comuna && <span className="compra-error" role="alert">{errores.comuna}</span>}
          </label>
        </div>
        <label>
          Medio de pago deseado
          <select name="metodo_pago" value={formulario.metodo_pago} onChange={cambiar}>
            <option value="tarjeta">Tarjeta (sin datos de tarjeta)</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </label>

        {errorGeneral && <p className="compra-error" role="alert">{errorGeneral}</p>}

        <div className="compra-acciones">
          <button type="submit" disabled={enviando}>
            {enviando ? 'Registrando pedido…' : 'Confirmar pedido'}
          </button>
          <Link to="/carrito" className="compra-secundario">Volver al carrito</Link>
        </div>
      </form>
    </section>
  )
}

export default Pago
