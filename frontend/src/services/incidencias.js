import { solicitar } from '../api'

/** Estados del pedido que el panel considera abiertos (pendientes o en revisión). */
export const ESTADOS_ABIERTOS = ['PENDIENTE', 'PAGADO', 'CONFIRMACION_PENDIENTE', 'REVISION_REQUERIDA']

/** Una orden sigue siendo incidencia si su estado está abierto o su pago sigue sin respuesta. */
export function sigueAbierta(incidencia) {
  return ESTADOS_ABIERTOS.includes(incidencia.estado) || incidencia.pago?.estado === 'INICIADO'
}

/** Lista las órdenes pendientes o en revisión con su pago, reserva e inventario (solo admin). */
export async function listarIncidencias(signal) {
  const resultado = await solicitar('/admin/incidencias/', { signal })
  return Array.isArray(resultado?.data) ? resultado.data : []
}

/**
 * Pide al backend una nueva conciliación de la orden.
 * Devuelve { conciliacion, incidencia }: el resultado y la orden ya actualizada.
 */
export async function conciliarIncidencia(id) {
  const resultado = await solicitar(`/admin/incidencias/${encodeURIComponent(id)}/conciliar/`, { method: 'POST' })
  return { conciliacion: resultado?.conciliacion || {}, incidencia: resultado?.incidencia || null }
}
