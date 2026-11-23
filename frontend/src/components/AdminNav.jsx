import { NavLink, useLocation } from 'react-router-dom'

export default function AdminNav() {
  const { pathname } = useLocation()
  const base = pathname.startsWith('/demo/') ? '/demo/admin' : '/admin'
  return <nav className="admin-secciones" aria-label="Secciones de administración">
    <NavLink to={base} end>Usuarios</NavLink>
    <NavLink to={`${base}/productos`}>Productos</NavLink>
    <NavLink to={`${base}/contenidos`}>Contenidos</NavLink>
    {/* Órdenes pendientes o en revisión y su conciliación */}
    <NavLink to={`${base}/incidencias`}>Incidencias de compra</NavLink>
    {base === '/admin' && <NavLink to="/admin/importar">Importar usuarios</NavLink>}
  </nav>
}
