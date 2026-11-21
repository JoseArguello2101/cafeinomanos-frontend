import { solicitar } from '../api'

/** Envía el CSV al backend y devuelve el resumen y el reporte por fila. */
export async function importarUsuarios(archivo) {
  const cuerpo = new FormData()
  cuerpo.append('archivo', archivo)
  return solicitar('/users/importar/', { method: 'POST', datos: cuerpo })
}
