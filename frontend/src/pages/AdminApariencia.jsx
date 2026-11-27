import { useRef, useState } from 'react'
import AdminNav from '../components/AdminNav'
import { TEMAS, guardarTemaSitio, nombreTema } from '../services/tema'
import './Admin.css'
import './AdminApariencia.css'

/**
 * Tema global del sitio: el administrador elige uno de los cuatro temas y se guarda en el backend,
 * así lo ven todos los visitantes, en cualquier navegador y al recargar.
 */
export default function AdminApariencia({ demo = false, tema, temaSitio, preferencia, onTemaSitioChange, onPreferenciaChange }) {
  const [elegido, setElegido] = useState(temaSitio)
  // en la demo el "tema del sitio" se simula solo en esta vista
  const [temaSitioDemo, setTemaSitioDemo] = useState(temaSitio)
  const actual = demo ? temaSitioDemo : temaSitio
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState(null)
  // bloqueo inmediato contra doble clic
  const enCurso = useRef(false)

  async function guardar(evento) {
    evento.preventDefault()
    if (enCurso.current || elegido === actual) return
    enCurso.current = true
    setGuardando(true)
    setAviso(null)
    try {
      if (demo) {
        setTemaSitioDemo(elegido)
      } else {
        const guardado = await guardarTemaSitio(elegido)
        onTemaSitioChange(guardado)
      }
      setAviso({ tipo: 'ok', texto: `Tema del sitio cambiado a ${nombreTema(elegido)}. Los visitantes lo verán al cargar o recargar la página.` })
    } catch (problema) {
      setAviso({ tipo: 'error', texto: problema.message || 'No se pudo guardar el tema.' })
    } finally {
      enCurso.current = false
      setGuardando(false)
    }
  }

  return (
    <section className="store admin-panel apariencia-admin" data-theme={tema} aria-labelledby="apariencia-titulo">
      <AdminNav />
      <header className="admin-cabecera">
        <p className="admin-etiqueta">Paraíso del Café / Administración</p>
        <h1 id="apariencia-titulo">Apariencia del sitio</h1>
        <p>Elige el tema que verán todos los visitantes. Se guarda en el servidor, así que se mantiene al recargar y en cualquier navegador.</p>
      </header>
      <div className="admin-demo">
        {demo
          ? <><strong>Modo demostración.</strong> El cambio se simula y no afecta al sitio.</>
          : <><strong>Datos conectados.</strong> Tema actual del sitio: <strong>{nombreTema(actual)}</strong>.</>}
      </div>

      {/* Si este navegador tiene un tema personal, el administrador no ve el del sitio: se avisa y se ofrece quitarlo */}
      {preferencia && (
        <p className="apariencia-aviso" role="note">
          Tu navegador usa tu tema personal <strong>{nombreTema(preferencia)}</strong> (elegido en el menú "Temas"), así que aquí no ves el tema del sitio.{' '}
          <button type="button" className="btn" onClick={() => onPreferenciaChange(null)}>Usar el tema del sitio</button>
        </p>
      )}

      <form className="admin-lista" onSubmit={guardar}>
        <fieldset className="apariencia-opciones">
          <legend>Tema del sitio</legend>
          <div className="apariencia-grilla">
          {TEMAS.map(opcion => (
            <label key={opcion.valor} className={`apariencia-opcion${elegido === opcion.valor ? ' elegida' : ''}`}>
              <input type="radio" name="tema" value={opcion.valor} checked={elegido === opcion.valor} onChange={() => setElegido(opcion.valor)} />
              {/* Muestra con los colores reales del tema (mismos tokens de index.css) */}
              <span className="store apariencia-muestra" data-theme={opcion.valor} aria-hidden="true">
                <span className="apariencia-muestra-titulo">Aa</span>
                <span className="apariencia-muestra-texto">Café de especialidad</span>
                <span className="apariencia-muestra-boton">Comprar</span>
              </span>
              <span className="apariencia-nombre">
                {opcion.nombre}
                {actual === opcion.valor && <span className="apariencia-actual"> · actual</span>}
              </span>
            </label>
          ))}
          </div>
        </fieldset>

        <div role="status" aria-live="polite">
          {aviso && <p className={`apariencia-resultado ${aviso.tipo}`}>{aviso.texto}</p>}
        </div>

        <div className="apariencia-acciones">
          <button type="submit" className="btn admin-guardar" disabled={guardando || elegido === actual}>
            {guardando ? 'Guardando…' : 'Guardar tema del sitio'}
          </button>
        </div>
      </form>
    </section>
  )
}
