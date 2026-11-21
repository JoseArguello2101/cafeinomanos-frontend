import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { solicitar, limpiarSesion } from '../api'

function estadoInicial() {
  const usuario = JSON.parse(localStorage.getItem('usuario'))
  const token = localStorage.getItem('token')
  return !token || !usuario?.es_admin || usuario?.demo ? 'denegado' : 'verificando'
}

/** Verifica contra el backend que la sesión admin siga siendo válida. */
function RutaAdmin({ children }) {
  const [estado, setEstado] = useState(estadoInicial)

  useEffect(() => {
    if (estado !== 'verificando') return undefined

    const controlador = new AbortController()
    solicitar('/admin-panel/', { signal: controlador.signal })
      .then(() => setEstado('autorizado'))
      .catch(error => {
        if (error.name === 'AbortError') return
        if (error.status === 401 || error.status === 403) limpiarSesion()
        setEstado('denegado')
      })
    return () => controlador.abort()
  }, [estado])

  if (estado === 'verificando') {
    return <p className="container py-5" role="status">Verificando sesión…</p>
  }
  if (estado === 'denegado') {
    return <Navigate to="/login" replace state={{ desde: '/admin' }} />
  }
  return children
}

export default RutaAdmin
