import { Link } from 'react-router-dom'
import { useContenidos } from '../contenidos'
import logoCafe from '../assets/logo-cafe.png'
import logoBlanco from '../assets/logo-blanco.png'
import './Footer.css'

function Footer({ tema }) {
  // los datos de contacto vienen de los contenidos editables por el administrador
  const { contenidos } = useContenidos() || {}
  const contacto = contenidos?.contacto || {}
  const anio = new Date().getFullYear()

  return (
    <footer className="site-footer pie">
      <div className="pie-columnas">
        <div>
          <img src={tema === 'oscuro' ? logoBlanco : logoCafe} alt="Paraíso del Café" className="pie-logo" />
          <p>Un sorbo al paraíso</p>
        </div>

        <nav aria-label="Enlaces del pie de página">
          <p className="pie-titulo">Navegación</p>
          <ul>
            <li><Link to="/catalogo">Catálogo</Link></li>
            <li><Link to="/quienes-somos">Quiénes somos</Link></li>
            <li><Link to="/contacto">Contacto</Link></li>
          </ul>
        </nav>

        <div>
          <p className="pie-titulo">Contacto</p>
          <address>
            {contacto.telefono && (
              <p><a href={`tel:${contacto.telefono.replace(/\s/g, '')}`}>{contacto.telefono}</a></p>
            )}
            {contacto.email && <p><a href={`mailto:${contacto.email}`}>{contacto.email}</a></p>}
            {contacto.direccion && <p>{contacto.direccion}</p>}
            {contacto.horario && <p>{contacto.horario}</p>}
          </address>
        </div>
      </div>

      <p className="pie-derechos">© {anio} Paraíso del Café · Equipo Cafeinómanos</p>
    </footer>
  )
}

export default Footer