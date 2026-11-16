import { useState } from 'react'
import { agregarAlCarrito } from '../services/carrito'

function AgregarAlCarrito({ producto, compacto = false }) {
    const [cantidad, setCantidad] = useState(1)
    const [cargando, setCargando] = useState(false)
    const [mensaje, setMensaje] = useState(null) // { tipo: 'exito' | 'error', texto: string }

    const sinStock = !producto || producto.stock <= 0 || producto.disponible === false

    // Punto 5: Validar que la cantidad sea un entero positivo
    const validarYCambiarCantidad = (valor) => {
        setMensaje(null)
        const numero = Number(valor)
        if (valor === '' || (Number.isInteger(numero) && numero >= 1)) {
            setCantidad(valor === '' ? '' : numero)
        }
    }

    const manejarEnvio = async (e) => {
        e.preventDefault()
        setMensaje(null)

        const cantidadFinal = Number(cantidad)

        // Validaciones del cliente
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
            // Puntos 1, 2 y 7: Agrega al backend y actualiza en la misma línea
            const respuesta = await agregarAlCarrito(producto.id, cantidadFinal)

            // Punto 6: Mostrar confirmación clara al agregar
            setMensaje({
                tipo: 'exito',
                texto: `✓ ¡${cantidadFinal}x ${producto.nombre} agregado(s) al carrito!`
            })
            setCantidad(1) // restablece el selector

            // Ocultar mensaje de confirmación tras 4 segundos
            setTimeout(() => setMensaje(null), 4000)
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

    return (
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <form onSubmit={manejarEnvio} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {/* Punto 4: Selector de cantidad */}
                <label style={{ fontSize: '12px', fontWeight: 'bold' }} htmlFor={`cant-${producto.id}`}>
                    Cant:
                </label>
                <input
                    id={`cant-${producto.id}`}
                    type="number"
                    min="1"
                    max={producto.stock}
                    value={cantidad}
                    onChange={(e) => validarYCambiarCantidad(e.target.value)}
                    disabled={cargando}
                    style={{
                        width: '56px',
                        padding: '6px',
                        textAlign: 'center',
                        borderRadius: '4px',
                        border: '1px solid var(--line)',
                        background: 'var(--surface)',
                        color: 'var(--ink)'
                    }}
                />

                {/* Punto 1 y 2: Botón para agregar */}
                <button
                    type="submit"
                    disabled={cargando || cantidad === ''}
                    style={{
                        padding: '8px 14px',
                        background: 'var(--accent)',
                        color: 'var(--button)',
                        border: '1px solid var(--accent)',
                        borderRadius: '4px',
                        cursor: cargando ? 'wait' : 'pointer',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        flex: compacto ? '1' : 'none'
                    }}
                >
                    {cargando ? 'Agregando…' : 'Agregar al carrito'}
                </button>
            </form>

            {/* Punto 6: Confirmación o error visual */}
            {mensaje && (
                <span
                    role="status"
                    style={{
                        fontSize: '12px',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        display: 'inline-block',
                        background: mensaje.tipo === 'exito' ? '#d4edda' : '#f8d7da',
                        color: mensaje.tipo === 'exito' ? '#155724' : '#721c24',
                        border: `1px solid ${mensaje.tipo === 'exito' ? '#c3e6cb' : '#f5c6cb'}`
                    }}
                >
                    {mensaje.texto}
                </span>
            )}
        </div>
    )
}

export default AgregarAlCarrito