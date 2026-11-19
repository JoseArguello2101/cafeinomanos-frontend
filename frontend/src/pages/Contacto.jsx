import { useContenidos } from '../contenidos'
import DatosContacto from '../components/DatosContacto'
import './PaginasContenido.css'

function Contacto() {
  const { contenidos } = useContenidos()
  const contenido = contenidos.contacto

  return (
    <section className="pagina-contenido" aria-labelledby="contacto-titulo">
      <header>
        <h1 id="contacto-titulo">{contenido.titulo}</h1>
        {contenido.subtitulo && <p className="pagina-subtitulo">{contenido.subtitulo}</p>}
      </header>
      {contenido.imagen_url && (
        <img className="pagina-imagen" src={contenido.imagen_url} alt={contenido.imagen_alt || contenido.titulo} />
      )}
      <p>{contenido.texto}</p>
      {contenido.texto_secundario && <p>{contenido.texto_secundario}</p>}
      <DatosContacto contenido={contenido} />
    </section>
  )
}

export default Contacto
