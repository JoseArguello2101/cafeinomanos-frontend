import { useCallback, useEffect, useRef, useState } from 'react'
import AdminNav from '../components/AdminNav'
import { pesos } from '../productos'
import { conciliarIncidencia, listarIncidencias, sigueAbierta } from '../services/incidencias'
import './Admin.css'
import './AdminIncidencias.css'

// Etiqueta legible de cada estado del pedido que puede aparecer en el panel.
const ESTADOS_PEDIDO = {
  PENDIENTE: 'Pendiente de pago',
  PAGADO: 'Pagada',
  CONFIRMACION_PENDIENTE: 'Confirmación pendiente',
  REVISION_REQUERIDA: 'Revisión requerida',
  CONFIRMADO: 'Confirmada',
  CANCELADO: 'Cancelada',
}

// Cada insignia combina texto, ícono y estilo de borde (tono): el color nunca es la única señal.
const INSIGNIAS = {
  pago: {
    AUTORIZADO: { texto: 'Autorizado', icono: '✓', tono: 'ok' },
    INICIADO: { texto: 'Iniciado, sin respuesta', icono: '↻', tono: 'aviso' },
    RECHAZADO: { texto: 'Rechazado', icono: '✕', tono: 'error' },
    REVERSADO: { texto: 'Reversado', icono: '↺', tono: 'neutro' },
    SIN_PAGO: { texto: 'Sin intento de pago', icono: '–', tono: 'neutro' },
  },
  reserva: {
    apartada: { texto: 'Stock apartado', icono: '■', tono: 'ok' },
    liberada: { texto: 'Stock liberado', icono: '□', tono: 'neutro' },
  },
  inventario: {
    consolidado: { texto: 'Venta consolidada', icono: '✓', tono: 'ok' },
    devuelto: { texto: 'Stock devuelto', icono: '↺', tono: 'neutro' },
    sin_movimiento: { texto: 'Sin movimiento', icono: '…', tono: 'aviso' },
  },
}

// Traduce la respuesta de la conciliación a un aviso para el administrador.
const RESULTADOS = {
  completado: { tono: 'ok', titulo: 'Conciliación completada' },
  liberado: { tono: 'aviso', titulo: 'Orden liberada' },
  marcado_revision: { tono: 'error', titulo: 'Requiere revisión manual' },
  en_espera: { tono: 'aviso', titulo: 'Sin resolución todavía' },
  sin_cambios: { tono: 'neutro', titulo: 'Sin cambios' },
  error: { tono: 'error', titulo: 'No se pudo conciliar' },
}

// Explicación cuando el backend no envía un motivo (p. ej. órdenes que ya estaban resueltas).
const MOTIVOS_SIN_CAMBIOS = {
  ya_pagado: 'La orden ya estaba pagada y su pago es consistente.',
  ya_cancelado: 'La orden ya estaba cancelada y su pago rechazado o reversado.',
  ya_en_revision: 'La orden ya está marcada para revisión manual.',
  no_encontrado: 'La orden ya no existe.',
}

function resultadoDeConciliacion(conciliacion) {
  const base = RESULTADOS[conciliacion?.accion] || RESULTADOS.sin_cambios
  const detalle = conciliacion?.motivo || MOTIVOS_SIN_CAMBIOS[conciliacion?.resultado] || 'La orden se revisó sin cambios.'
  return { ...base, detalle }
}

// Datos de ejemplo para /demo/admin/incidencias (sin backend).
const DEMO = [
  {
    id: 101, numero_pedido: 'PED-000101', cliente_nombre: 'Camila Rojas', cliente_email: 'camila@cafe.test',
    total: '15200.00', estado: 'PENDIENTE', creado_en: '2026-11-22T14:05:00', unidades: 4,
    pago: { estado: 'INICIADO', pasarela: 'webpay plus', tiene_token: true },
    reserva: { estado: 'apartada' }, inventario: { estado: 'sin_movimiento', movimientos: [] },
  },
  {
    id: 102, numero_pedido: 'PED-000102', cliente_nombre: 'Diego Muñoz', cliente_email: 'diego@cafe.test',
    total: '7600.00', estado: 'CONFIRMACION_PENDIENTE', creado_en: '2026-11-22T12:40:00', unidades: 2,
    pago: { estado: 'AUTORIZADO', pasarela: 'webpay plus', tiene_token: true },
    reserva: { estado: 'liberada' }, inventario: { estado: 'devuelto', movimientos: [] },
  },
  {
    id: 103, numero_pedido: 'PED-000103', cliente_nombre: 'Valentina Soto', cliente_email: 'valentina@cafe.test',
    total: '3800.00', estado: 'PENDIENTE', creado_en: '2026-11-22T15:10:00', unidades: 1,
    pago: { estado: 'SIN_PAGO', pasarela: '', tiene_token: false },
    reserva: { estado: 'apartada' }, inventario: { estado: 'sin_movimiento', movimientos: [] },
  },
]

// Resultado simulado de la conciliación en modo demostración.
function conciliarDemo(incidencia) {
  if (incidencia.pago.estado === 'INICIADO') {
    return {
      conciliacion: { accion: 'completado', motivo: 'Pago confirmado por la pasarela.' },
      incidencia: { ...incidencia, estado: 'PAGADO', pago: { ...incidencia.pago, estado: 'AUTORIZADO' }, reserva: { estado: 'liberada' } },
    }
  }
  return { conciliacion: { accion: 'en_espera', motivo: 'Operación dentro de la ventana de espera.' }, incidencia }
}

const fecha = new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' })

/** Insignia de estado: ícono + texto, con un estilo de borde distinto por tono. */
function Insignia({ titulo, valor }) {
  return (
    <div className="incidencia-dato">
      <dt>{titulo}</dt>
      <dd>
        <span className={`incidencia-insignia tono-${valor.tono}`}>
          <span aria-hidden="true">{valor.icono}</span> {valor.texto}
        </span>
      </dd>
    </div>
  )
}

export default function AdminIncidencias({ demo = false, tema }) {
  const [incidencias, setIncidencias] = useState(demo ? DEMO : [])
  const [cargando, setCargando] = useState(!demo)
  const [error, setError] = useState('')
  // id de la orden que se está conciliando y resultado de la última conciliación por orden
  const [conciliando, setConciliando] = useState(null)
  const [resultados, setResultados] = useState({})
  // bloqueo inmediato contra doble clic (el estado de React tarda un render en aplicarse)
  const enCurso = useRef(false)

  const cargar = useCallback(signal => {
    if (demo) {
      setIncidencias(DEMO)
      setResultados({})
      return
    }
    setCargando(true)
    setError('')
    listarIncidencias(signal)
      .then(lista => { setIncidencias(lista); setResultados({}) })
      .catch(problema => { if (problema.name !== 'AbortError') setError(problema.message) })
      .finally(() => { if (!signal?.aborted) setCargando(false) })
  }, [demo])

  // Al entrar a la sección se consulta el backend.
  useEffect(() => {
    const controlador = new AbortController()
    cargar(controlador.signal)
    return () => controlador.abort()
  }, [cargar])

  // Solicita una nueva conciliación y reemplaza la orden con los datos ya conciliados.
  async function conciliar(incidencia) {
    if (enCurso.current) return
    enCurso.current = true
    setConciliando(incidencia.id)
    try {
      const respuesta = demo ? conciliarDemo(incidencia) : await conciliarIncidencia(incidencia.id)
      setResultados(actual => ({ ...actual, [incidencia.id]: resultadoDeConciliacion(respuesta.conciliacion) }))
      if (respuesta.incidencia) {
        setIncidencias(actual => actual.map(fila => fila.id === incidencia.id ? respuesta.incidencia : fila))
      }
    } catch (problema) {
      setResultados(actual => ({ ...actual, [incidencia.id]: { ...RESULTADOS.error, detalle: problema.message } }))
    } finally {
      enCurso.current = false
      setConciliando(null)
    }
  }

  const abiertas = incidencias.filter(sigueAbierta).length

  return (
    <section className="store admin-panel incidencias-admin" data-theme={tema} aria-labelledby="incidencias-titulo">
      <AdminNav />
      <header className="admin-cabecera">
        <p className="admin-etiqueta">Paraíso del Café / Administración</p>
        <h1 id="incidencias-titulo">Incidencias de compra</h1>
        <p>Órdenes pendientes o en revisión con el estado de su pago, reserva y movimiento de inventario. Solicita una nueva conciliación para cerrarlas.</p>
      </header>
      <div className="admin-demo">
        {demo
          ? <><strong>Modo demostración.</strong> Los datos son de ejemplo y la conciliación se simula.</>
          : <><strong>Datos conectados.</strong> La conciliación consulta la pasarela y actualiza la orden en el backend.</>}
      </div>

      <div className="admin-lista">
        <div className="admin-lista-titulo">
          <h2>Órdenes por revisar</h2>
          <div className="incidencias-barra">
            <span>{cargando ? 'Cargando…' : `${abiertas} abierta${abiertas === 1 ? '' : 's'}`}</span>
            <button type="button" className="btn" onClick={() => cargar()} disabled={cargando || conciliando !== null}>Actualizar</button>
          </div>
        </div>

        {error && <p className="incidencia-aviso tono-error" role="alert">{error} <button type="button" className="btn" onClick={() => cargar()}>Reintentar</button></p>}
        {cargando && <p role="status">Consultando órdenes…</p>}
        {!cargando && !error && incidencias.length === 0 && (
          <p className="incidencias-vacio" role="status">No hay órdenes pendientes ni en revisión.</p>
        )}

        <ul className="incidencias-lista">
          {incidencias.map(incidencia => {
            const resultado = resultados[incidencia.id]
            const resuelta = !sigueAbierta(incidencia)
            const ocupada = conciliando === incidencia.id
            const movimientos = incidencia.inventario?.movimientos || []
            return (
              <li key={incidencia.id}>
                <article className="incidencia" aria-labelledby={`incidencia-${incidencia.id}`}>
                  <header className="incidencia-cabecera">
                    <div>
                      <h3 id={`incidencia-${incidencia.id}`}>{incidencia.numero_pedido}</h3>
                      <p>{incidencia.cliente_nombre} · {incidencia.cliente_email}</p>
                    </div>
                    <div className="incidencia-resumen">
                      <strong>{pesos.format(Number(incidencia.total) || 0)}</strong>
                      <span>{incidencia.unidades} u. · {incidencia.creado_en ? fecha.format(new Date(incidencia.creado_en)) : ''}</span>
                    </div>
                  </header>

                  <p className="incidencia-estado">
                    Estado de la orden: <strong>{ESTADOS_PEDIDO[incidencia.estado] || incidencia.estado}</strong>
                    {resuelta && <span className="incidencia-insignia tono-ok"><span aria-hidden="true">✓</span> Resuelta</span>}
                  </p>

                  {/* Los tres estados que se revisan al conciliar. */}
                  <dl className="incidencia-datos">
                    <Insignia titulo="Pago" valor={INSIGNIAS.pago[incidencia.pago?.estado] || INSIGNIAS.pago.SIN_PAGO} />
                    <Insignia titulo="Reserva" valor={INSIGNIAS.reserva[incidencia.reserva?.estado] || INSIGNIAS.reserva.liberada} />
                    <Insignia titulo="Inventario" valor={INSIGNIAS.inventario[incidencia.inventario?.estado] || INSIGNIAS.inventario.sin_movimiento} />
                  </dl>
                  {movimientos.length > 0 && (
                    <ul className="incidencia-movimientos" aria-label="Movimientos de inventario">
                      {movimientos.map(mov => <li key={`${mov.producto_id}-${mov.tipo}`}>{mov.tipo}: {mov.cantidad} × {mov.producto_nombre}</li>)}
                    </ul>
                  )}

                  {/* Resultado de la última conciliación de esta orden. */}
                  <div role="status" aria-live="polite">
                    {resultado && (
                      <p className={`incidencia-aviso tono-${resultado.tono}`}>
                        <strong>{resultado.titulo}.</strong> {resultado.detalle}
                      </p>
                    )}
                  </div>

                  <div className="incidencia-acciones">
                    <button type="button" className="btn admin-guardar" onClick={() => conciliar(incidencia)} disabled={conciliando !== null || resuelta} aria-busy={ocupada}>
                      {ocupada ? 'Conciliando…' : 'Solicitar conciliación'}
                    </button>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
