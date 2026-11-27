import { solicitar } from '../api'

/** Los cuatro temas visuales del sitio. */
export const TEMAS = [
  { valor: 'claro', nombre: 'Claro' },
  { valor: 'oscuro', nombre: 'Oscuro' },
  { valor: 'vintage', nombre: 'Vintage' },
  { valor: 'pastel', nombre: 'Pastel' },
]

// Tema personal que el visitante eligió en el navbar (solo en su navegador; gana sobre el del sitio).
const CLAVE_PREFERENCIA = 'tema_preferido'
// Último tema del sitio conocido: evita un parpadeo al cargar mientras llega la respuesta del backend.
const CLAVE_TEMA_SITIO = 'tema_sitio'
// Clave antigua: se guardaba siempre, aunque el visitante nunca eligiera un tema, así que no sirve como preferencia.
const CLAVE_ANTIGUA = 'tema'

export const esTemaValido = valor => TEMAS.some(tema => tema.valor === valor)
export const nombreTema = valor => TEMAS.find(tema => tema.valor === valor)?.nombre || valor

function leer(clave) {
  try {
    const valor = localStorage.getItem(clave)
    return esTemaValido(valor) ? valor : null
  } catch {
    return null
  }
}

function escribir(clave, valor) {
  try {
    if (valor) localStorage.setItem(clave, valor)
    else localStorage.removeItem(clave)
  } catch {
    // sin almacenamiento local (modo privado bloqueado): el tema igual se aplica en esta visita
  }
}

/** Preferencia personal guardada en este navegador, o null si sigue el tema del sitio. */
export function leerPreferencia() {
  escribir(CLAVE_ANTIGUA, null)
  return leer(CLAVE_PREFERENCIA)
}

export const guardarPreferencia = valor => escribir(CLAVE_PREFERENCIA, esTemaValido(valor) ? valor : null)

/** Tema del sitio guardado la última vez (o 'claro' si es la primera visita). */
export const leerTemaSitioGuardado = () => leer(CLAVE_TEMA_SITIO) || 'claro'

export const recordarTemaSitio = valor => escribir(CLAVE_TEMA_SITIO, valor)

/** Consulta el tema global que eligió la administración (público). */
export async function obtenerTemaSitio(signal) {
  const resultado = await solicitar('/tema/', { auth: false, signal })
  if (!esTemaValido(resultado?.tema)) throw new Error('El backend devolvió un tema desconocido.')
  return resultado.tema
}

/** Cambia el tema global para todos los visitantes (solo administradores). */
export async function guardarTemaSitio(tema) {
  const resultado = await solicitar('/tema/', { method: 'PUT', datos: { tema } })
  return resultado.tema
}
