import { Link } from 'react-router-dom'
import empleadoDelMes from '../assets/empleado_del_mes.jpg'
import './QuienesSomos.css'

const HISTORIA = 'Somos un e-commerce especializado en la venta de productos de importantísima procedencia cultural, próximo a un impacto social para todo el mundo. Los mejores accesorios, cafés y sobre todo la repostería más exquisita que puede existir. Nos enorgullecemos en las entregas y proceso completamente libre de cualquier amarillismo. No esperamos que seas un cliente normal, esperamos que seas parte de nuestra comunidad de Cafeinomanos y tengan un espléndido paraíso de cafeína.'

function QuienesSomos() {
  return (
    <div className="quienes">
      <section className="quienes-historia" aria-labelledby="historia-titulo">
        <h1 id="historia-titulo" className="quienes-titulo quienes-titulo-principal">NUESTRA HISTORIA</h1>
        <p className="quienes-texto">{HISTORIA}</p>
      </section>

      <hr className="quienes-separador" />

      <section className="quienes-honor" aria-labelledby="honor-titulo">
        <h2 id="honor-titulo" className="quienes-titulo quienes-titulo-seccion">EN HONOR A</h2>

        <figure className="quienes-figura">
          <img className="quienes-imagen" src={empleadoDelMes} alt="Empleado del mes" />
          <figcaption className="quienes-placa">
            <span className="quienes-placa-estrella" aria-hidden="true">⭐</span>
            EMPLEADO DEL MES
          </figcaption>
        </figure>

        <Link to="/catalogo" className="btn btn-primary quienes-cta">Explorar catálogo</Link>
      </section>
    </div>
  )
}

export default QuienesSomos
