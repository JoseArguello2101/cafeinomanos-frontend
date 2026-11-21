import { useContenidos } from '../contenidos'
import DatosContacto from '../components/DatosContacto'
import FormularioContacto from '../components/FormularioContacto' // 1. Importar el componente
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

      {/* 1. Formulario interactivo de envío de mensajes */}
      <FormularioContacto />

      {/* 2. Datos informativos de contacto (Teléfono, Horario, etc.) */}
      <DatosContacto contenido={contenido} />


    </section>
  )
}

export default Contacto