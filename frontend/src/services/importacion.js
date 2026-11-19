import { API_URL } from '../api'

// envía el CSV al backend y devuelve el resumen y el reporte por fila
export async function importarUsuarios(archivo) {
  const token = localStorage.getItem('token')
  if (!token) throw new Error('Inicia sesión con una cuenta administradora para importar usuarios.')

  const formulario = new FormData()
  formulario.append('archivo', archivo)

  let respuesta
  try {
    respuesta = await fetch(`${API_URL}/users/importar/`, {
      method: 'POST',
      headers: { Authorization: `Token ${token}` },
      body: formulario
    })
  } catch (error) {
    throw new Error('No se pudo conectar con el backend. Comprueba que esté iniciado e intenta de nuevo.', { cause: error })
  }

  const resultado = await respuesta.json().catch(() => null)
  if (respuesta.status === 401) throw new Error('Tu sesión no es válida o expiró. Vuelve a iniciar sesión.')
  if (respuesta.status === 403) throw new Error('No tienes permisos para importar usuarios.')
  if (!respuesta.ok) throw new Error(resultado?.message || `No se pudo importar el archivo (${respuesta.status}).`)
  return resultado
}