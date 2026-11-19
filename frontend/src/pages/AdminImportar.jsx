import { useState } from 'react'
import AdminNav from '../components/AdminNav'
import { importarUsuarios } from '../services/importacion'
import '../wireframe.css'
import './Admin.css'

export default function AdminImportar({ tema = 'claro' }) {
  const [archivo, setArchivo] = useState(null)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null)

  function elegirArchivo(evento) {
    const elegido = evento.target.files[0] || null
    setResultado(null)
    setError('')
    if (elegido && !elegido.name.toLowerCase().endsWith('.csv')) {
      setArchivo(null)
      setError('Selecciona un archivo con extensión .csv.')
      evento.target.value = ''
      return
    }
    setArchivo(elegido)
  }

  async function enviar(evento) {
    evento.preventDefault()
    if (!archivo) {
      setError('Selecciona un archivo CSV antes de importar.')
      return
    }
    setEnviando(true)
    setError('')
    setResultado(null)
    try {
      setResultado(await importarUsuarios(archivo))
    } catch (problema) {
      setError(problema.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="store admin-panel" data-theme={tema} aria-labelledby="importar-titulo">
      <AdminNav />
      <header className="admin-cabecera">
        <p className="admin-etiqueta">Paraíso del Café / Administración</p>
        <h1 id="importar-titulo">Importación masiva de usuarios</h1>
        <p>
          Sube un archivo CSV en UTF-8 con las columnas <code>email,nombre,apellido,rol</code> y
          hasta 200 filas. El rol puede ser CLIENTE o ADMIN. Las cuentas nuevas quedan pendientes de activación.
        </p>
      </header>

      <form onSubmit={enviar} noValidate>
        <div className="mb-3">
          <label htmlFor="archivo-csv" className="form-label">Archivo CSV</label>
          <input
            id="archivo-csv"
            type="file"
            accept=".csv,text/csv"
            className="form-control"
            onChange={elegirArchivo}
          />
        </div>
        {archivo && <p>Archivo seleccionado: <strong>{archivo.name}</strong></p>}
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={enviando}>
          {enviando ? 'Importando...' : 'Importar usuarios'}
        </button>
      </form>

      {resultado && (
        <div className="mt-4" aria-live="polite">
          <h2>Resultado de la importación</h2>
          <p>
            Filas procesadas: {resultado.resumen.total} · Creadas: {resultado.resumen.creados} ·
            Rechazadas: {resultado.resumen.rechazados}
          </p>
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Fila</th>
                <th scope="col">Correo</th>
                <th scope="col">Resultado</th>
                <th scope="col">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {resultado.reporte.map(fila => (
                <tr key={fila.fila}>
                  <td>{fila.fila}</td>
                  <td>{fila.email || '—'}</td>
                  <td>{fila.resultado === 'creado' ? 'Creado' : 'Rechazado'}</td>
                  <td>{fila.motivo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}