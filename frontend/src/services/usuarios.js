import { solicitar } from '../api'

async function solicitarUsuarios(ruta, opciones = {}) {
  const resultado = await solicitar(ruta, opciones)
  if (!resultado || resultado.status !== 'success') {
    throw new Error('La respuesta del backend no tiene el formato esperado.')
  }
  return resultado
}

export async function listarUsuarios(signal) {
  const resultado = await solicitarUsuarios('/users/', { signal })
  if (!Array.isArray(resultado.data)) throw new Error('No se pudo interpretar la lista de usuarios del backend.')
  return resultado.data
}
export async function consultarUsuario(id) {
  const resultado = await solicitarUsuarios(`/users/${encodeURIComponent(id)}/`)
  if (!resultado.usuario) throw new Error('El backend no devolvió los datos del usuario.')
  return resultado.usuario
}
export async function crearUsuario(datos) {
  const resultado = await solicitarUsuarios('/users/', { method: 'POST', datos })
  if (!resultado.usuario) throw new Error('El backend no devolvió el usuario creado. Actualiza la lista antes de reintentar.')
  return resultado.usuario
}
export async function actualizarUsuario(id, datos) {
  const resultado = await solicitarUsuarios(`/users/${encodeURIComponent(id)}/`, { method: 'PATCH', datos })
  if (!resultado.usuario) throw new Error('El backend no devolvió el usuario actualizado. Actualiza la lista antes de reintentar.')
  return resultado.usuario
}
