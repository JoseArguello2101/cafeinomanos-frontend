import { useEffect, useRef, useState } from 'react'
import { ajustarStockProducto, obtenerHistorialStock } from '../services/productos'

const formatoFecha = new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
})

/**
 * Modal administrativo para ajustar el stock físico de un producto (RF-19)
 * sin requerir edición de ficha ni imágenes, mostrando su historial de cambios.
 */
export default function ModalAjusteStock({ producto, demo = false, onGuardado, onCerrar }) {
    const dialogoRef = useRef(null)
    const [nuevoStock, setNuevoStock] = useState(() => String(producto.stock ?? 0))
    const [motivo, setMotivo] = useState('')
    const [errorCampo, setErrorCampo] = useState('')
    const [errorServidor, setErrorServidor] = useState('')
    const [guardando, setGuardando] = useState(false)
    const [historial, setHistorial] = useState([])
    const [cargandoHistorial, setCargandoHistorial] = useState(!demo)

    useEffect(() => {
        const dialogo = dialogoRef.current
        if (dialogo && !dialogo.open) dialogo.showModal()

        if (demo) return undefined
        const controlador = new AbortController()
        obtenerHistorialStock(producto.id, controlador.signal)
            .then(setHistorial)
            .catch(() => { })
            .finally(() => {
                if (!controlador.signal.aborted) setCargandoHistorial(false)
            })
        return () => controlador.abort()
    }, [producto.id, demo])

    async function enviar(evento) {
        evento.preventDefault()
        if (guardando) return

        const texto = String(nuevoStock).trim()
        if (!/^\d+$/.test(texto)) {
            setErrorCampo('Ingresa un número entero mayor o igual a cero.')
            return
        }

        const valorEntero = Number(texto)
        const reservado = Number(producto.stock_reservado) || 0
        if (valorEntero < reservado) {
            setErrorCampo(`El stock no puede ser menor al stock reservado (${reservado} u.).`)
            return
        }

        setErrorCampo('')
        setErrorServidor('')
        setGuardando(true)
        try {
            if (demo) {
                onGuardado({
                    producto: {
                        id: producto.id,
                        nombre: producto.nombre,
                        stock_anterior: producto.stock,
                        stock_nuevo: valorEntero,
                        stock_reservado: reservado,
                        stock_disponible: Math.max(0, valorEntero - reservado),
                        disponible: valorEntero > 0,
                    },
                    message: `Stock de '${producto.nombre}' actualizado a ${valorEntero} en la demostración.`,
                })
            } else {
                const respuesta = await ajustarStockProducto(producto.id, valorEntero, motivo)
                onGuardado(respuesta)
            }
            dialogoRef.current?.close()
        } catch (error) {
            setErrorServidor(error.message || 'No se pudo ajustar el stock.')
        } finally {
            setGuardando(false)
        }
    }

    return (
        <dialog
            ref={dialogoRef}
            className="admin-dialogo ajuste-stock-dialogo"
            aria-labelledby="ajuste-stock-titulo"
            onCancel={evento => { if (guardando) evento.preventDefault() }}
            onClose={onCerrar}
        >
            <form onSubmit={enviar} noValidate>
                <p className="admin-etiqueta">Inventario · RF-19</p>
                <h2 id="ajuste-stock-titulo">Ajustar stock: {producto.nombre}</h2>

                <p className="producto-ayuda">
                    Stock actual: <strong>{producto.stock}</strong> u. · Reservado:{' '}
                    <strong>{producto.stock_reservado || 0}</strong> u.
                </p>

                {errorServidor && <p className="alert alert-danger" role="alert">{errorServidor}</p>}

                <div className="producto-campo">
                    <label htmlFor="ajuste-nuevo-stock">Nuevo stock físico (unidades)</label>
                    <input
                        id="ajuste-nuevo-stock"
                        name="nuevo_stock"
                        type="number"
                        min={producto.stock_reservado || 0}
                        step="1"
                        required
                        disabled={guardando}
                        aria-invalid={Boolean(errorCampo)}
                        aria-describedby={errorCampo ? 'ajuste-error-stock' : undefined}
                        value={nuevoStock}
                        onChange={e => { setNuevoStock(e.target.value); setErrorCampo('') }}
                    />
                    {errorCampo && (
                        <span id="ajuste-error-stock" className="producto-error" role="alert">{errorCampo}</span>
                    )}
                </div>

                <div className="producto-campo">
                    <label htmlFor="ajuste-motivo">Motivo del ajuste (opcional)</label>
                    <input
                        id="ajuste-motivo"
                        name="motivo"
                        type="text"
                        maxLength={200}
                        placeholder="Ej: Reposición de bodega, merma, conteo físico"
                        disabled={guardando}
                        value={motivo}
                        onChange={e => setMotivo(e.target.value)}
                    />
                </div>

                <div className="admin-dialogo-acciones">
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        disabled={guardando}
                        onClick={() => dialogoRef.current?.close()}
                    >
                        Cancelar
                    </button>
                    <button type="submit" className="btn admin-guardar" disabled={guardando}>
                        {guardando ? 'Guardando…' : 'Guardar stock'}
                    </button>
                </div>
            </form>

            <div className="ajuste-historial">
                <h3>Historial reciente de ajustes</h3>
                {cargandoHistorial && <p className="producto-ayuda" role="status">Cargando historial…</p>}
                {!cargandoHistorial && historial.length === 0 && (
                    <p className="producto-ayuda">Sin ajustes registrados para este producto.</p>
                )}
                {!cargandoHistorial && historial.length > 0 && (
                    <ul className="ajuste-historial-lista">
                        {historial.slice(0, 5).map((item, idx) => (
                            <li key={item._id || idx}>
                                <strong>{item.valor_anterior} → {item.valor_nuevo} u.</strong>
                                <span> · {item.administrador}</span>
                                {item.motivo && <span> · {item.motivo}</span>}
                                {item.fecha && (
                                    <small> ({formatoFecha.format(new Date(item.fecha))})</small>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </dialog>
    )
}