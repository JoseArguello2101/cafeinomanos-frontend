import { useEffect, useRef, useState } from 'react'
import { agregarAlCarrito, EVENTO_CARRITO } from '../services/carrito'

function Mensaje({ mensaje }) {
  if (!mensaje) return null
  const exito = mensaje.tipo === 'exito'
  return (
    <span
      role={exito ? 'status' : 'alert'}
      style={{
        fontSize: '12px',
        padding: '6px 10px',
        borderRadius: '4px',
        display: 'inline-block',
        background: exito ? '#d4edda' : '#f8d7da',
        color: exito ? '#155724' : '#721c24',
        border: `1px solid ${exito ? '#c3e6cb' : '#f5c6cb'}`,
      }}
    >
      {mensaje.texto}
    </span>
  )
}

function AgregarAlCarrito({ producto, compacto = false, rapido = false }) {
  const [cantidad, setCantidad] = useState(1)
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const temporizador = useRef(null)

  useEffect(() => () => clearTimeout(temporizador.current), [])

  const sinStock = !producto || producto.stock <= 0 || producto.disponible === false

  function validarYCambiarCantidad(valor) {
    setMensaje(null)
    const numero = Number(valor)
    if (valor === '' || (Number.isInteger(numero) && numero >= 1)) {
      setCantidad(valor === '' ? '' : numero)
    }
  }

  async function manejarEnvio(evento) {
    evento.preventDefault()
    setMensaje(null)
    const cantidadFinal = rapido ? 1 : Number(cantidad)

    if (!Number.isInteger(cantidadFinal) || cantidadFinal < 1) {
      setMensaje({ tipo: 'error', texto: 'La cantidad debe ser un número entero mayor a 0.' })
      return
    }
    if (cantidadFinal > producto.stock) {
      setMensaje({ tipo: 'error', texto: `Solo hay ${producto.stock} unidades disponibles.` })
      return
    }

    setCargando(true)
    try {
      await agregarAlCarrito(producto.id, cantidadFinal)
      setMensaje({
        tipo: 'exito',
        texto: `${cantidadFinal}x ${producto.nombre} agregado(s) al carrito.`,
      })
      setCantidad(1)
      window.dispatchEvent(new Event(EVENTO_CARRITO))
      clearTimeout(temporizador.current)
      temporizador.current = setTimeout(() => setMensaje(null), 4000)
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message })
    } finally {
      setCargando(false)
    }
  }

  if (sinStock) {
    return (
      <div style={{ marginTop: '12px' }}>
        <button type="button" disabled style={{ padding: '8px 14px', opacity: 0.6, cursor: 'not-allowed', width: compacto ? '100%' : 'auto' }}>
          Agotado
        </button>
      </div>
    )
  }

  const estiloBoton = {
    padding: '8px 14px',
    background: 'var(--accent)',
    color: 'var(--button)',
    border: '1px solid var(--accent)',
    borderRadius: '4px',
    cursor: cargando ? 'wait' : 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
    flex: compacto ? '1' : 'none',
  }

  return (
    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <form onSubmit={manejarEnvio} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {!rapido && (
          <>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }} htmlFor={`cant-${producto.id}`}>
              Cant:
            </label>
            <input
              id={`cant-${producto.id}`}
              type="number"
              min="1"
              max={producto.stock}
              value={cantidad}
              onChange={evento => validarYCambiarCantidad(evento.target.value)}
              disabled={cargando}
              style={{
                width: '56px',
                padding: '6px',
                textAlign: 'center',
                borderRadius: '4px',
                border: '1px solid var(--line)',
                background: 'var(--surface)',
                color: 'var(--ink)',
              }}
            />
          </>
        )}
        <button type="submit" disabled={cargando || (!rapido && cantidad === '')} style={estiloBoton}>
          {cargando ? 'Agregando…' : rapido ? 'Añadir a carrito' : 'Agregar al carrito'}
        </button>
      </form>
      <Mensaje mensaje={mensaje} />
    </div>
  )
}

export default AgregarAlCarrito
