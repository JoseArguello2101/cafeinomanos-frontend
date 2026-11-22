import EstadoOrden from '../components/EstadoOrden'
import { ESTADOS_ORDEN } from '../estadosOrden'

/**
 * Vista de referencia con los cinco estados de la orden.
 * Sirve para revisar su diseño en los cuatro temas con el selector del navbar.
 */
function DemoEstadosOrden() {
  const estados = Object.keys(ESTADOS_ORDEN)
  return (
    <section className="compra" aria-labelledby="demo-estados-titulo">
      <p className="eyebrow">Vista de demostración</p>
      <h1 id="demo-estados-titulo">Estados de la orden</h1>
      <p className="compra-aviso">
        Así ve el cliente cada estado en las páginas de pago y confirmación. Cambia el tema desde el menú «Temas» para revisarlos.
      </p>

      <h2>Insignias</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', margin: '12px 0 28px' }}>
        {estados.map(estado => <EstadoOrden key={estado} estado={estado} variante="insignia" />)}
      </div>

      <h2>Paneles con acciones</h2>
      <div style={{ marginTop: '12px' }}>
        {estados.map(estado => <EstadoOrden key={estado} estado={estado} alAccionar={() => {}} />)}
      </div>
    </section>
  )
}

export default DemoEstadosOrden
