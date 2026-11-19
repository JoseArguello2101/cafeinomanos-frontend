import { datosContacto } from '../services/contenidos'

export default function DatosContacto({ contenido }) {
  const datos = datosContacto(contenido)
  if (!datos.length) return null

  return (
    <dl className="datos-contacto">
      {datos.map(({ etiqueta, valor, enlace }) => (
        <div key={etiqueta}>
          <dt>{etiqueta}</dt>
          <dd>{enlace ? <a href={enlace}>{valor}</a> : valor}</dd>
        </div>
      ))}
    </dl>
  )
}
