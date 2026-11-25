import { useCallback, useEffect, useRef, useState } from 'react'
import AdminNav from '../components/AdminNav'
import { listarNotificaciones, reintentarNotificacion } from '../services/notificaciones'
import './Admin.css'
import './AdminNotificaciones.css'

// Cada estado se muestra con texto + ícono + estilo de borde: el color nunca es la única señal.
const ESTADOS = {
  FALLIDO: { texto: 'Fallo confirmado', icono: '✕', tono: 'error', ayuda: 'El proveedor rechazó el correo: no llegó.' },
  INCIERTO: { texto: 'Resultado incierto', icono: '?', tono: 'aviso', ayuda: 'La conexión se cortó durante el envío: pudo haber llegado.' },
  PENDIENTE: { texto: 'Pendiente', icono: '…', tono: 'neutro', ayuda: 'Todavía no se intenta enviar.' },
  ENVIADO: { texto: 'Enviado', icono: '✓', tono: 'ok', ayuda: 'El proveedor confirmó la entrega.' },
}

const TIPOS = { CLIENTE: 'Cliente', ADMINISTRADOR: 'Administración' }

// Filtros del listado; "por revisar" agrupa los correos que pueden necesitar un reintento.
const FILTROS = {
  revisar: { texto: 'Por revisar', incluye: ['FALLIDO', 'INCIERTO', 'PENDIENTE'] },
  FALLIDO: { texto: 'Fallos confirmados', incluye: ['FALLIDO'] },
  INCIERTO: { texto: 'Resultados inciertos', incluye: ['INCIERTO'] },
  ENVIADO: { texto: 'Enviados', incluye: ['ENVIADO'] },
  todos: { texto: 'Todos', incluye: null },
}

// Cómo se presenta cada resultado del reintento.
const RESULTADOS = {
  enviado: { tono: 'ok', titulo: 'Correo reenviado' },
  fallido: { tono: 'error', titulo: 'El reintento falló' },
  incierto: { tono: 'aviso', titulo: 'Resultado incierto' },
  ya_enviado: { tono: 'neutro', titulo: 'Sin reenvío' },
  requiere_confirmacion: { tono: 'aviso', titulo: 'Falta confirmar' },
  error: { tono: 'error', titulo: 'No se pudo reintentar' },
}

// Datos de ejemplo para /demo/admin/notificaciones (sin backend).
const DEMO = [
  { id: 1, pedido_id: 12, numero_pedido: 'PED-000012', tipo_notificacion: 'CLIENTE', destinatario: 'camila@cafe.test', estado: 'FALLIDO', intentos: 2, error: '(550, b"5.1.1 La dirección de destino no existe")', actualizado_en: '2026-11-22T14:05:00' },
  { id: 2, pedido_id: 12, numero_pedido: 'PED-000012', tipo_notificacion: 'ADMINISTRADOR', destinatario: 'admin@paraisodelcafe.cl', estado: 'INCIERTO', intentos: 1, error: 'timed out', actualizado_en: '2026-11-22T14:05:00' },
  { id: 3, pedido_id: 11, numero_pedido: 'PED-000011', tipo_notificacion: 'CLIENTE', destinatario: 'diego@cafe.test', estado: 'ENVIADO', intentos: 1, error: '', actualizado_en: '2026-11-22T12:40:00' },
]

// Reintento simulado en modo demostración: respeta las mismas reglas que el backend.
function reintentarDemo(fila, confirmarIncierto) {
  if (fila.estado === 'ENVIADO') return { resultado: 'ya_enviado', mensaje: 'El correo ya fue enviado y no se duplica.', notificacion: fila }
  if (fila.estado === 'INCIERTO' && !confirmarIncierto) return { resultado: 'requiere_confirmacion', mensaje: 'Confirma el reintento.', notificacion: fila }
  return { resultado: 'enviado', mensaje: 'Notificación reenviada exitosamente.', notificacion: { ...fila, estado: 'ENVIADO', intentos: fila.intentos + 1, error: '' } }
}

const fecha = new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' })

export default function AdminNotificaciones({ demo = false, tema }) {
  const [correos, setCorreos] = useState(demo ? DEMO : [])
  const [cargando, setCargando] = useState(!demo)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('revisar')
  const [reintentando, setReintentando] = useState(null)
  // último resultado de reintento, con el correo al que corresponde
  const [aviso, setAviso] = useState(null)
  // correo incierto que espera la confirmación del administrador
  const [porConfirmar, setPorConfirmar] = useState(null)
  // bloqueo inmediato contra doble clic (el estado de React tarda un render en aplicarse)
  const enCurso = useRef(false)
  const dialogo = useRef(null)

  // Consulta el backend; el estado solo se actualiza cuando llega la respuesta.
  const pedir = useCallback(signal => {
    listarNotificaciones(signal)
      .then(lista => { setCorreos(lista); setError('') })
      .catch(problema => { if (problema.name !== 'AbortError') setError(problema.message) })
      .finally(() => { if (!signal?.aborted) setCargando(false) })
  }, [])

  // Botón "Actualizar": muestra la carga y vuelve a consultar (en demo restablece los datos de ejemplo).
  function cargar() {
    if (demo) { setCorreos(DEMO); setAviso(null); return }
    setCargando(true)
    setError('')
    pedir()
  }

  // Al entrar a la sección se consulta el backend (la carga inicial ya parte en true).
  useEffect(() => {
    if (demo) return undefined
    const controlador = new AbortController()
    pedir(controlador.signal)
    return () => controlador.abort()
  }, [demo, pedir])

  // Abre o cierra el diálogo de confirmación según haya un correo incierto pendiente.
  useEffect(() => {
    if (porConfirmar && !dialogo.current?.open) dialogo.current?.showModal()
    if (!porConfirmar && dialogo.current?.open) dialogo.current.close()
  }, [porConfirmar])

  // Reintenta un correo; si quedó incierto, primero pide confirmación para no duplicarlo sin querer.
  async function reintentar(fila, confirmarIncierto = false) {
    if (enCurso.current) return
    if (fila.estado === 'INCIERTO' && !confirmarIncierto) { setPorConfirmar(fila); return }
    enCurso.current = true
    setPorConfirmar(null)
    setReintentando(fila.id)
    try {
      const respuesta = demo ? reintentarDemo(fila, confirmarIncierto) : await reintentarNotificacion(fila.id, confirmarIncierto)
      if (respuesta.notificacion) {
        setCorreos(actual => actual.map(correo => correo.id === fila.id ? respuesta.notificacion : correo))
      }
      setAviso({ ...(RESULTADOS[respuesta.resultado] || RESULTADOS.error), detalle: respuesta.mensaje, correo: fila })
    } catch (problema) {
      setAviso({ ...RESULTADOS.error, detalle: problema.message, correo: fila })
    } finally {
      enCurso.current = false
      setReintentando(null)
    }
  }

  const visibles = correos.filter(correo => !FILTROS[filtro].incluye || FILTROS[filtro].incluye.includes(correo.estado))
  const porRevisar = correos.filter(correo => FILTROS.revisar.incluye.includes(correo.estado)).length

  return (
    <section className="store admin-panel correos-admin" data-theme={tema} aria-labelledby="correos-titulo">
      <AdminNav />
      <header className="admin-cabecera">
        <p className="admin-etiqueta">Paraíso del Café / Administración</p>
        <h1 id="correos-titulo">Correos de compra</h1>
        <p>Revisa los correos de confirmación de cada orden y reintenta los que no llegaron. Un correo ya enviado nunca se duplica.</p>
      </header>
      <div className="admin-demo">
        {demo
          ? <><strong>Modo demostración.</strong> Los datos son de ejemplo y el reintento se simula.</>
          : <><strong>Datos conectados.</strong> El reintento vuelve a enviar el mismo correo desde el backend.</>}
      </div>

      {/* Explica la diferencia entre los dos tipos de error */}
      <dl className="correos-leyenda">
        {['FALLIDO', 'INCIERTO'].map(estado => (
          <div key={estado}>
            <dt><span className={`correo-insignia tono-${ESTADOS[estado].tono}`}><span aria-hidden="true">{ESTADOS[estado].icono}</span> {ESTADOS[estado].texto}</span></dt>
            <dd>{ESTADOS[estado].ayuda} {estado === 'INCIERTO' ? 'Reintentarlo pide confirmación.' : 'Se puede reintentar directamente.'}</dd>
          </div>
        ))}
      </dl>

      <div className="admin-lista">
        <div className="admin-lista-titulo">
          <h2>Notificaciones</h2>
          <div className="correos-barra">
            <label htmlFor="correos-filtro">Mostrar</label>
            <select id="correos-filtro" value={filtro} onChange={evento => setFiltro(evento.target.value)}>
              {Object.entries(FILTROS).map(([clave, opcion]) => <option key={clave} value={clave}>{opcion.texto}</option>)}
            </select>
            <span>{cargando ? 'Cargando…' : `${porRevisar} por revisar`}</span>
            <button type="button" className="btn" onClick={() => cargar()} disabled={cargando || reintentando !== null}>Actualizar</button>
          </div>
        </div>

        {/* Resultado del último reintento */}
        <div role="status" aria-live="polite">
          {aviso && (
            <p className={`correo-aviso tono-${aviso.tono}`}>
              <strong>{aviso.titulo}</strong> ({aviso.correo.numero_pedido} · {aviso.correo.destinatario}). {aviso.detalle}
            </p>
          )}
        </div>
        {error && <p className="correo-aviso tono-error" role="alert">{error} <button type="button" className="btn" onClick={() => cargar()}>Reintentar</button></p>}
        {cargando && <p role="status">Consultando correos…</p>}
        {!cargando && !error && visibles.length === 0 && <p className="correos-vacio">No hay correos en esta vista.</p>}

        {visibles.length > 0 && (
          <div className="table-responsive" role="region" aria-label="Tabla de correos, desplazable horizontalmente" tabIndex={0}>
            <table className="table align-middle mb-0">
              <thead>
                <tr><th scope="col">Orden</th><th scope="col">Destinatario</th><th scope="col">Estado</th><th scope="col">Intentos</th><th scope="col">Error</th><th scope="col">Acción</th></tr>
              </thead>
              <tbody>
                {visibles.map(correo => {
                  const estado = ESTADOS[correo.estado] || ESTADOS.PENDIENTE
                  const ocupado = reintentando === correo.id
                  return (
                    <tr key={correo.id}>
                      <td>{correo.numero_pedido || `#${correo.pedido_id}`}<span className="admin-propia">{correo.actualizado_en ? fecha.format(new Date(correo.actualizado_en)) : ''}</span></td>
                      <td>{correo.destinatario}<span className="admin-propia">{TIPOS[correo.tipo_notificacion] || correo.tipo_notificacion}</span></td>
                      <td><span className={`correo-insignia tono-${estado.tono}`} title={estado.ayuda}><span aria-hidden="true">{estado.icono}</span> {estado.texto}</span></td>
                      <td>{correo.intentos}</td>
                      <td className="correo-error">{correo.error || '—'}</td>
                      <td>
                        {correo.estado === 'ENVIADO'
                          ? <span className="admin-propia">Sin acciones</span>
                          : (
                            <button type="button" className="btn admin-guardar" onClick={() => reintentar(correo)} disabled={reintentando !== null} aria-busy={ocupado}>
                              {ocupado ? 'Reintentando…' : correo.estado === 'INCIERTO' ? 'Revisar y reintentar' : 'Reintentar envío'}
                            </button>
                          )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmación para correos con resultado incierto: reenviarlos puede duplicarlos */}
      <dialog ref={dialogo} className="admin-dialogo" aria-labelledby="correo-dialogo-titulo" aria-describedby="correo-dialogo-texto" onClose={() => setPorConfirmar(null)}>
        <h2 id="correo-dialogo-titulo">¿Reintentar un envío incierto?</h2>
        <p id="correo-dialogo-texto">
          El último envío a <strong>{porConfirmar?.destinatario}</strong> ({porConfirmar?.numero_pedido}) se cortó a mitad de camino y el correo <strong>pudo haber llegado</strong>.
          Si lo reintentas, la persona podría recibirlo dos veces. Confírmalo solo si sabes que no le llegó.
        </p>
        <div className="admin-dialogo-acciones">
          <button type="button" className="btn" onClick={() => setPorConfirmar(null)}>Cancelar</button>
          <button type="button" className="btn admin-guardar" onClick={() => reintentar(porConfirmar, true)}>Sí, reintentar</button>
        </div>
      </dialog>
    </section>
  )
}
