import { useState } from 'react'
import { imagenRespaldo } from '../productos'

// Galería de imágenes del detalle de producto: imagen principal + miniaturas seleccionables.
function GaleriaProducto({ producto }) {
  const imagenes = producto.imagenes?.length ? producto.imagenes : [producto.imagen].filter(Boolean)
  const [activa, setActiva] = useState(0)
  const [fallidas, setFallidas] = useState(() => new Set())

  const fuente = url => (!url || fallidas.has(url) ? imagenRespaldo : url)
  const marcarFallida = url => setFallidas(actual => (actual.has(url) ? actual : new Set(actual).add(url)))
  const principal = imagenes[activa] || ''

  return (
    <div className="galeria" aria-label={`Galería de imágenes de ${producto.nombre}`}>
      <img
        className="galeria-principal"
        src={fuente(principal)}
        alt={`${producto.nombre} — imagen ${imagenes.length ? activa + 1 : 1} de ${imagenes.length || 1}`}
        onError={() => principal && marcarFallida(principal)}
      />
      {imagenes.length > 1 && (
        <ul className="galeria-miniaturas">
          {imagenes.map((url, indice) => (
            <li key={url}>
              <button
                type="button"
                className={indice === activa ? 'miniatura-activa' : undefined}
                aria-label={`Ver imagen ${indice + 1} de ${imagenes.length}`}
                aria-pressed={indice === activa}
                onClick={() => setActiva(indice)}
              >
                <img src={fuente(url)} alt="" onError={() => marcarFallida(url)} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default GaleriaProducto

