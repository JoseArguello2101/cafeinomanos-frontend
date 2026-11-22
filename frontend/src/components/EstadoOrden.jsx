import { Link } from 'react-router-dom'
import { ACCIONES, ESTADOS_ORDEN } from '../estadosOrden'
import './EstadoOrden.css'

/**
 * Muestra el estado de una orden con ícono, texto y color.
 *
 * - variante "insignia": etiqueta compacta para encabezados.
 * - variante "panel": etiqueta, descripción y acciones disponibles.
 *
 * `alAccionar(id)` recibe las acciones sin destino (actualizar, reintentar, nueva).
 * `acciones` permite reemplazar las acciones por defecto del estado.
 */
function EstadoOrden({ estado, variante = 'panel', descripcion, acciones, alAccionar, ocupado = false, titulo }) {
  const definicion = ESTADOS_ORDEN[estado] || ESTADOS_ORDEN.pendiente
  const clase = `estado-orden estado-orden--${estado} estado-orden--${variante}`

  if (variante === 'insignia') {
    return (
      <span className={clase} role="status" aria-live="polite">
        <span className="estado-orden-icono" aria-hidden="true">{definicion.icono}</span>
        <span>{definicion.etiqueta}</span>
      </span>
    )
  }

  const listaAcciones = (acciones || definicion.acciones).filter(id => ACCIONES[id])
  return (
    <section className={clase} aria-label={`Estado de la orden: ${definicion.etiqueta}`}>
      <div className="estado-orden-cabecera" role="status" aria-live="polite">
        <span className="estado-orden-icono" aria-hidden="true">{definicion.icono}</span>
        <div>
          <p className="estado-orden-rotulo">{titulo || 'Estado de la orden'}</p>
          <strong className="estado-orden-etiqueta">{definicion.etiqueta}</strong>
        </div>
      </div>
      <p className="estado-orden-descripcion">{descripcion || definicion.descripcion}</p>
      {listaAcciones.length > 0 && (
        <div className="estado-orden-acciones">
          {listaAcciones.map((id, indice) => {
            const accion = ACCIONES[id]
            const claseBoton = `estado-orden-boton${indice === 0 ? ' estado-orden-boton--primario' : ''}`
            return accion.destino
              ? <Link key={id} className={claseBoton} to={accion.destino}>{accion.etiqueta}</Link>
              : <button key={id} type="button" className={claseBoton} onClick={() => alAccionar?.(id)} disabled={ocupado}>
                  {ocupado && (id === 'actualizar' || id === 'reintentar') ? 'Consultando…' : accion.etiqueta}
                </button>
          })}
        </div>
      )}
    </section>
  )
}

export default EstadoOrden
