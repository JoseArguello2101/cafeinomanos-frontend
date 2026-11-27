import { solicitar } from '../api'

export const PAGINAS_CONTENIDO = [
  { clave: 'inicio', nombre: 'Inicio', ruta: '/' },
  { clave: 'contacto', nombre: 'Contacto', ruta: '/contacto' },
  { clave: 'quienes_somos', nombre: 'Quiénes somos', ruta: '/quienes-somos' },
]

export const contenidoPorDefecto = {
  inicio: {
    titulo: 'EL PARAÍSO A UN SORBO.',
    subtitulo: '',
    texto: 'El café puede ser el elemento fundamental para el día a día, por eso convierte tu vida en un paraíso jugoso y perfecto.',
    texto_secundario: '',
    imagen: '',
    imagen_url: '',
    imagen_alt: 'Fotografía del café',
    boton_texto: 'Ver más',
    boton_url: '/catalogo',
    telefono: '',
    email: '',
    direccion: '',
    horario: '',
  },
  contacto: {
    titulo: 'Contacto',
    subtitulo: 'Estamos para ayudarte',
    texto: '¿Tienes dudas sobre nuestros cafés o quieres hacer una consulta? Escríbenos y te responderemos a la brevedad.',
    texto_secundario: 'También puedes visitarnos en nuestra cafetería.',
    imagen: '',
    imagen_url: '',
    imagen_alt: '',
    boton_texto: '',
    boton_url: '',
    telefono: '+56 2 1234 5678',
    email: 'contacto@paraisodelcafe.cl',
    direccion: 'Av. Providencia 1234, Providencia, Santiago',
    horario: 'Lunes a domingo · 08:00 a 20:00',
  },
  quienes_somos: {
    titulo: 'Quiénes somos',
    subtitulo: 'Nuestra historia',
    texto: 'Somos una cafetería dedicada a seleccionar, tostar y preparar café de especialidad. Cada grano que elegimos tiene una historia y queremos compartirla contigo en cada taza.',
    texto_secundario: 'Trabajamos con productores locales y apoyamos el comercio justo para llevarte un café de calidad excepcional.',
    imagen: '',
    imagen_url: '',
    imagen_alt: '',
    boton_texto: '',
    boton_url: '',
    telefono: '+56 2 1234 5678',
    email: 'contacto@paraisodelcafe.cl',
    direccion: 'Av. Providencia 1234, Providencia, Santiago',
    horario: 'Lunes a domingo · 08:00 a 20:00',
  },
}

export function normalizarContenido(contenido = {}, pagina) {
  return { pagina, ...contenidoPorDefecto[pagina], ...contenido }
}

export function contenidosIniciales() {
  return Object.fromEntries(PAGINAS_CONTENIDO.map(({ clave }) => [clave, normalizarContenido({}, clave)]))
}

export async function listarContenidos(signal) {
  const resultado = await solicitar('/contenidos/', { signal, auth: false })
  if (!resultado?.data || typeof resultado.data !== 'object') {
    throw new Error('La respuesta del backend no tiene el formato esperado.')
  }
  return Object.fromEntries(PAGINAS_CONTENIDO.map(({ clave }) => [
    clave,
    normalizarContenido(resultado.data[clave], clave),
  ]))
}

export async function guardarContenido(pagina, datos) {
  const cuerpo = new FormData()
  const campos = [
    'titulo', 'subtitulo', 'texto', 'texto_secundario', 'imagen_alt',
    'boton_texto', 'boton_url', 'telefono', 'email', 'direccion', 'horario',
  ]
  campos.forEach(campo => cuerpo.append(campo, datos[campo] ?? ''))
  if (datos.imagen instanceof File) cuerpo.append('imagen', datos.imagen)

  const resultado = await solicitar(`/contenidos/${encodeURIComponent(pagina)}/`, {
    method: 'PATCH',
    datos: cuerpo,
  })
  if (!resultado?.contenido) throw new Error('El backend no devolvió el contenido guardado.')
  return normalizarContenido(resultado.contenido, pagina)
}

export function datosContacto(contenido) {
  const datos = [
    contenido?.telefono && { etiqueta: 'Teléfono', valor: contenido.telefono, enlace: `tel:${contenido.telefono.replace(/[^\d+]/g, '')}` },
    contenido?.email && { etiqueta: 'Correo', valor: contenido.email, enlace: `mailto:${contenido.email}` },
    contenido?.direccion && { etiqueta: 'Dirección', valor: contenido.direccion },
    contenido?.horario && { etiqueta: 'Horario', valor: contenido.horario },
  ]
  return datos.filter(Boolean)
}
