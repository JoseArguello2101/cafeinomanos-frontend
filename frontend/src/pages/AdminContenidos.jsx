import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminNav from '../components/AdminNav'
import { useContenidos } from '../contenidos'
import {
  PAGINAS_CONTENIDO,
  contenidosIniciales,
  guardarContenido,
  listarContenidos,
  normalizarContenido,
} from '../services/contenidos'
import './Admin.css'
import './AdminContenidos.css'

const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const LIMITE_IMAGEN = 5 * 1024 * 1024
const PAGINA_INICIAL = PAGINAS_CONTENIDO[0].clave

export default function AdminContenidos({ demo = false, tema = 'claro' }) {
  const [cuenta] = useState(() => JSON.parse(localStorage.getItem('usuario') || '{}'))
  const { recargar } = useContenidos() || {}
  const demostracion = demo || cuenta.demo === true
  const [pagina, setPagina] = useState(PAGINA_INICIAL)
  const [contenidos, setContenidos] = useState(contenidosIniciales)
  const [datos, setDatos] = useState(() => normalizarContenido({}, PAGINA_INICIAL))
  const [archivo, setArchivo] = useState(null)
  const [cargando, setCargando] = useState(!demostracion)
  const [guardando, setGuardando] = useState(false)
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [errorServidor, setErrorServidor] = useState('')
  const entradaImagen = useRef(null)

  function cargarEnFormulario(contenido, clave) {
    setDatos(normalizarContenido(contenido, clave))
    setArchivo(null)
    setErrores({})
    setMensaje('')
    if (entradaImagen.current) entradaImagen.current.value = ''
  }

  useEffect(() => {
    if (demostracion) return undefined
    const controlador = new AbortController()
    listarContenidos(controlador.signal)
      .then(datos => {
        setContenidos(datos)
        cargarEnFormulario(datos[PAGINA_INICIAL], PAGINA_INICIAL)
        setErrorServidor('')
      })
      .catch(error => { if (error.name !== 'AbortError') setErrorServidor(error.message) })
      .finally(() => { if (!controlador.signal.aborted) setCargando(false) })
    return () => controlador.abort()
  }, [demostracion])

  const vistaPreviaArchivo = useMemo(
    () => archivo ? URL.createObjectURL(archivo) : '',
    [archivo]
  )
  useEffect(() => () => {
    if (vistaPreviaArchivo) URL.revokeObjectURL(vistaPreviaArchivo)
  }, [vistaPreviaArchivo])

  const vistaPrevia = vistaPreviaArchivo || datos.imagen_url || ''
  const paginaActual = PAGINAS_CONTENIDO.find(opcion => opcion.clave === pagina)

  function cambiarPagina(clave) {
    setPagina(clave)
    cargarEnFormulario(contenidos[clave], clave)
  }

  function campo(nombre, etiqueta, opciones = {}) {
    const { textarea = false, tipo = 'text', ayuda = '', maximo } = opciones
    const valor = datos[nombre] ?? ''
    return <div className="contenido-campo" key={nombre}>
      <label className="form-label" htmlFor={`contenido-${nombre}`}>{etiqueta}</label>
      {textarea ? (
        <textarea
          id={`contenido-${nombre}`}
          name={nombre}
          rows={nombre.startsWith('texto') ? 5 : 2}
          className={`form-control ${errores[nombre] ? 'is-invalid' : ''}`}
          value={valor}
          maxLength={maximo}
          aria-invalid={!!errores[nombre]}
          onChange={evento => setDatos({ ...datos, [nombre]: evento.target.value })}
        />
      ) : (
        <input
          id={`contenido-${nombre}`}
          name={nombre}
          type={tipo}
          className={`form-control ${errores[nombre] ? 'is-invalid' : ''}`}
          value={valor}
          maxLength={maximo}
          aria-invalid={!!errores[nombre]}
          onChange={evento => setDatos({ ...datos, [nombre]: evento.target.value })}
        />
      )}
      {ayuda && <small className="contenido-ayuda">{ayuda}</small>}
      {errores[nombre] && <div className="invalid-feedback d-block">{errores[nombre]}</div>}
    </div>
  }

  function validar() {
    const nuevos = {}
    const titulo = datos.titulo.trim()
    if (!titulo) nuevos.titulo = 'Ingresa un título.'
    else if (titulo.length > 200) nuevos.titulo = 'El título no puede superar 200 caracteres.'
    if (!datos.texto.trim()) nuevos.texto = 'Ingresa el texto principal.'
    if (datos.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email.trim())) {
      nuevos.email = 'Ingresa un correo válido o deja el campo vacío.'
    }
    if (datos.boton_url && !/^(\/|https?:\/\/)/.test(datos.boton_url.trim())) {
      nuevos.boton_url = 'Usa una ruta que empiece con / o una URL http(s).'
    }
    if (archivo) {
      if (!TIPOS_IMAGEN.includes(archivo.type)) nuevos.imagen = 'Usa una imagen JPG, PNG, WEBP o GIF.'
      else if (archivo.size > LIMITE_IMAGEN) nuevos.imagen = 'La imagen no puede superar los 5 MB.'
    }
    setErrores(nuevos)
    return Object.keys(nuevos).length === 0
  }

  async function guardar(evento) {
    evento.preventDefault()
    if (guardando || !validar()) return
    setGuardando(true)
    setMensaje('')
    setErrorServidor('')
    try {
      let guardado
      if (demostracion) {
        guardado = { ...datos, imagen_url: archivo ? URL.createObjectURL(archivo) : datos.imagen_url }
      } else {
        guardado = await guardarContenido(pagina, { ...datos, imagen: archivo })
      }
      setContenidos(actual => ({ ...actual, [pagina]: guardado }))
      cargarEnFormulario(guardado, pagina)
      setMensaje(`Contenido de ${paginaActual.nombre} guardado${demostracion ? ' en la demostración' : ''}.`)
      if (!demostracion) recargar?.()
    } catch (error) {
      setErrorServidor(error.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="store admin-panel contenido-admin" data-theme={tema} aria-labelledby="contenidos-titulo">
      <AdminNav />
      <header className="admin-cabecera">
        <p className="admin-etiqueta">Paraíso del Café / Administración</p>
        <h1 id="contenidos-titulo">Gestión de contenidos</h1>
        <p>Edita los textos, las imágenes y los datos de contacto que se muestran en las páginas públicas.</p>
      </header>
      <div className="admin-demo">
        {demostracion
          ? <><strong>Modo demostración.</strong> Los cambios solo se ven en esta vista y se restablecen al recargar. Para guardar contenidos reales, inicia sesión con un administrador del backend.</>
          : <><strong>Contenidos conectados.</strong> Los cambios se guardan en el backend y se reflejan en las páginas públicas.</>}
      </div>

      <div className="contenido-barra">
        <div>
          <label className="form-label" htmlFor="contenido-pagina">Página a editar</label>
          <select
            id="contenido-pagina"
            className="form-select"
            value={pagina}
            disabled={cargando || guardando}
            onChange={evento => cambiarPagina(evento.target.value)}
          >
            {PAGINAS_CONTENIDO.map(opcion => <option key={opcion.clave} value={opcion.clave}>{opcion.nombre}</option>)}
          </select>
        </div>
        {paginaActual && <Link to={paginaActual.ruta}>Ver página pública</Link>}
      </div>

      <div role="status" aria-live="polite">{mensaje && <p className="alert alert-success">{mensaje}</p>}</div>
      {errorServidor && <p className="alert alert-danger" role="alert">{errorServidor}</p>}
      {cargando && <p role="status">Cargando contenidos…</p>}

      {!cargando && <form className="contenido-formulario" onSubmit={guardar} noValidate>
        <fieldset disabled={guardando}>
          <legend>Textos de {paginaActual.nombre}</legend>
          <div className="contenido-rejilla">
            {campo('titulo', 'Título')}
            {campo('subtitulo', 'Subtítulo')}
            {campo('texto', 'Texto principal', { textarea: true })}
            {campo('texto_secundario', 'Texto secundario', { textarea: true })}
            {campo('boton_texto', 'Texto del botón', { ayuda: 'Se muestra solo en Inicio.' })}
            {campo('boton_url', 'Destino del botón', { ayuda: 'Ejemplo: /catalogo o https://ejemplo.cl' })}
          </div>
        </fieldset>

        <fieldset disabled={guardando}>
          <legend>Imagen de {paginaActual.nombre}</legend>
          <div className="contenido-imagen">
            <div>
              <label className="form-label" htmlFor="contenido-imagen">Subir imagen</label>
              <input
                id="contenido-imagen"
                ref={entradaImagen}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="form-control"
                aria-invalid={!!errores.imagen}
                onChange={evento => setArchivo(evento.target.files?.[0] || null)}
              />
              {errores.imagen && <div className="invalid-feedback d-block">{errores.imagen}</div>}
              <small className="contenido-ayuda">Formatos JPG, PNG, WEBP o GIF. Máximo 5 MB.</small>
            </div>
            {vistaPrevia ? (
              <img src={vistaPrevia} alt="Vista previa de la imagen" className="contenido-vista" />
            ) : (
              <p className="contenido-sin-imagen">Sin imagen cargada</p>
            )}
          </div>
          {campo('imagen_alt', 'Texto alternativo de la imagen')}
        </fieldset>

        <fieldset disabled={guardando}>
          <legend>Datos de contacto</legend>
          <p className="contenido-ayuda">Estos datos pueden mostrarse en Contacto y en Quiénes somos.</p>
          <div className="contenido-rejilla">
            {campo('telefono', 'Teléfono')}
            {campo('email', 'Correo electrónico', { tipo: 'email' })}
            {campo('direccion', 'Dirección')}
            {campo('horario', 'Horario de atención')}
          </div>
        </fieldset>

        <div className="admin-dialogo-acciones">
          <button type="submit" className="btn admin-guardar" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>}
    </section>
  )
}
