import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { borrarUltimoPedido, guardarUltimoPedido, leerUltimoPedido, obtenerPedido } from '../services/pedido'
import { estadoDeOrden } from '../estadosOrden'
import { formatearPrecio } from '../services/productos'
import EstadoOrden from '../components/EstadoOrden'
import SeccionPago from '../components/SeccionPago'
import './Confirmacion.css'

const SEGUNDOS_REFRESCO_PENDIENTE = 15

const TITULOS = {
  pendiente: 'Pedido pendiente de confirmación',
  verificando: 'Estamos verificando tu pago',
  confirmada: 'Pedido confirmado',
  rechazada: 'Pedido rechazado',
  vencida: 'Tu pedido venció',
}

function formatearFecha(fecha) {
  const valor = new Date(String(fecha || '').replace(' ', 'T'))
  if (Number.isNaN(valor.getTime())) return 'Fecha no disponible'
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'long', timeStyle: 'short' }).format(valor)
}

function mensajeEstado(pedido, estado) {
  if (estado === 'confirmada') {
    return 'El pago fue aprobado. Este resumen corresponde a la compra confirmada registrada en el sistema.'
  }
  if (estado === 'rechazada') {
    return 'El pago fue rechazado o la orden no fue aprobada. No se muestra como compra completada.'
  }
  if (estado === 'verificando') {
    return 'La orden está en verificación. Aún no debe considerarse completada hasta que el backend confirme el pago.'
  }
  if (estado === 'vencida') {
    return 'La orden perdió vigencia y no se considera una compra completada.'
  }
  return 'La orden fue registrada y está pendiente. No se considera completada hasta recibir confirmación de pago.'
}

function Confirmacion() {
  const navigate = useNavigate()
  const { id: idParam } = useParams()
  const ultimoPedido = useMemo(() => leerUltimoPedido(), [])
  const idPedido = idParam || ultimoPedido?.id

  const [pedido, setPedido] = useState(() => {
    if (!idParam) return ultimoPedido
    return String(ultimoPedido?.id) === String(idParam) ? ultimoPedido : null
  })
  const [cargando, setCargando] = useState(Boolean(idPedido))
  const [consultando, setConsultando] = useState(false)
  const [errorConsulta, setErrorConsulta] = useState('')
  const [errorAcceso, setErrorAcceso] = useState(null)
  const [ahora, setAhora] = useState(() => new Date())

  const cargarPedido = useCallback(async ({ silencioso = false, signal } = {}) => {
    if (!idPedido) return
    if (silencioso) setConsultando(true)
    else setCargando(true)
    setErrorConsulta('')
    try {
      const actual = await obtenerPedido(idPedido, signal)
      setPedido(actual)
      setErrorAcceso(null)
      setAhora(new Date())
      if (String(leerUltimoPedido()?.id) === String(actual.id)) guardarUltimoPedido(actual)
    } catch (problema) {
      if (problema.name === 'AbortError') return
      if (problema.status === 404) {
        setErrorAcceso({ tipo: 'no-existe', mensaje: problema.message || 'La orden no existe.' })
        setPedido(null)
      } else if (problema.status === 403) {
        setErrorAcceso({ tipo: 'no-pertenece', mensaje: problema.message || 'La orden no pertenece al cliente autenticado.' })
        setPedido(null)
      } else if (problema.status === 401) {
        setErrorAcceso({ tipo: 'auth', mensaje: 'Debes iniciar sesión para consultar esta orden.' })
        setPedido(null)
      } else {
        setErrorConsulta(problema.message || 'No se pudo consultar el estado real del pedido.')
      }
    } finally {
      if (!signal?.aborted) {
        setCargando(false)
        setConsultando(false)
      }
    }
  }, [idPedido])

  useEffect(() => {
    if (!idPedido) {
      setCargando(false)
      return undefined
    }
    const controlador = new AbortController()
    cargarPedido({ signal: controlador.signal })
    return () => controlador.abort()
  }, [idPedido, cargarPedido])

  const estado = pedido ? estadoDeOrden(pedido, ahora) : null

  useEffect(() => {
    if (!pedido || !['pendiente', 'verificando'].includes(estado)) return undefined
    const temporizador = setInterval(() => {
      cargarPedido({ silencioso: true })
    }, SEGUNDOS_REFRESCO_PENDIENTE * 1000)
    return () => clearInterval(temporizador)
  }, [pedido, estado, cargarPedido])

  useEffect(() => {
    if (!['pendiente', 'verificando'].includes(estado)) return undefined
    const temporizador = setInterval(() => setAhora(new Date()), 60 * 1000)
    return () => clearInterval(temporizador)
  }, [estado])

  function actualizar() {
    cargarPedido({ silencioso: true })
  }

  function nuevaCompra() {
    borrarUltimoPedido()
    navigate('/catalogo')
  }

  function alAccionar(id) {
    if (id === 'nueva') nuevaCompra()
    else actualizar()
  }

  if (cargando) {
    return (
      <section className="compra">
        <h1>Confirmación de compra</h1>
        <p role="status">Consultando el resumen real del pedido…</p>
      </section>
    )
  }

  if (errorAcceso) {
    const titulo = errorAcceso.tipo === 'no-existe' ? 'Orden no encontrada' : 'No puedes ver esta orden'
    return (
      <section className="compra">
        <h1>Confirmación de compra</h1>
        <div className="compra-vacio" role="alert">
          <h2>{titulo}</h2>
          <p>{errorAcceso.mensaje}</p>
          {errorAcceso.tipo === 'auth' && <Link to="/login" state={{ desde: `/confirmacion/${idPedido || ''}` }}>Iniciar sesión</Link>}
          <Link to="/catalogo">Ir al catálogo</Link>
        </div>
      </section>
    )
  }

  if (!pedido) {
    return (
      <section className="compra">
        <h1>Confirmación de compra</h1>
        <div className="compra-vacio">
          <h2>No hay una orden para mostrar</h2>
          <p>Completa una compra o abre el enlace de confirmación de una orden existente.</p>
          <Link to="/catalogo">Ir al catálogo</Link>
        </div>
      </section>
    )
  }

  const moneda = pedido.moneda || 'CLP'
  const formato = (valor) => formatearPrecio(valor, moneda)
  const fecha = formatearFecha(pedido.fecha || pedido.creado_en)
  const medioPago = { tarjeta: 'Tarjeta', transferencia: 'Transferencia' }[pedido.cliente?.metodo_pago] || 'No informado'
  const puedePagar = ['pendiente', 'verificando', 'rechazada'].includes(estado)

  return (
    <section className="compra" aria-labelledby="confirmacion-titulo">
      <div className="compra-titulo-estado">
        <h1 id="confirmacion-titulo">{TITULOS[estado] || 'Resumen de compra'}</h1>
        <EstadoOrden estado={estado} variante="insignia" />
      </div>

      <EstadoOrden
        estado={estado}
        alAccionar={alAccionar}
        ocupado={consultando}
        descripcion={mensajeEstado(pedido, estado)}
        acciones={estado === 'pendiente' || estado === 'verificando'
          ? [{ id: 'actualizar', etiqueta: consultando ? 'Consultando…' : 'Actualizar estado' }, 'seguir']
          : undefined}
      />

      {errorConsulta && (
        <p className="compra-error" role="alert">
          No pudimos actualizar el estado desde el servidor ({errorConsulta}). Se muestra el último resumen conocido.
        </p>
      )}

      {puedePagar && <SeccionPago pedido={pedido} estado={estado} />}

      <div className="compra-tarjeta">
        <p className="eyebrow">Identificador de compra</p>
        <p className="compra-code">{pedido.codigo}</p>
        <p className="compra-nota">Fecha: {fecha}</p>
        <p className="compra-nota">Estado real del pedido: <strong>{pedido.estado}</strong>{pedido.pago?.estado ? ` · Pago: ${pedido.pago.estado}` : ''}</p>

        <div className="compra-resumen-compra" aria-label="Productos comprados">
          <div className="compra-resumen compra-resumen--encabezado" aria-hidden="true">
            <span>Producto</span>
            <span>Detalle</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {pedido.items.map(item => (
              <li className="compra-resumen compra-resumen--item" key={item.id ?? `${item.producto_id}-${item.nombre}`}>
                <div>
                  <strong>{item.nombre}</strong>
                  <div className="compra-nota">Cantidad: {item.cantidad} · Precio unitario: {formato(item.precio_unitario)} {moneda}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="compra-nota">Subtotal</div>
                  <strong>{formato(item.subtotal)} {moneda}</strong>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="compra-resumen"><span>Subtotal</span><span>{formato(pedido.subtotal)} {moneda}</span></div>
        <div className="compra-resumen"><span>Costo de envío</span><span>{formato(pedido.costo_envio)} {moneda}</span></div>
        <div className="compra-total"><span>Total ({pedido.total_unidades} unidades)</span><strong>{formato(pedido.total)} {moneda}</strong></div>

        <div className="compra-datos">
          <span><strong>Moneda:</strong> {moneda}</span>
          <span><strong>Entrega:</strong> {pedido.cliente.direccion || 'No informada'}</span>
          <span><strong>Contacto:</strong> {pedido.cliente.nombre || 'Cliente'} · {pedido.cliente.correo || 'Sin correo'}</span>
          <span><strong>Pago solicitado:</strong> {medioPago}</span>
        </div>

        {estado === 'pendiente' && (
          <p className="compra-aviso" role="status">
            Esta compra sigue pendiente. Usa “Actualizar estado” para consultar el resumen real en el servidor.
          </p>
        )}
      </div>
    </section>
  )
}

export default Confirmacion
