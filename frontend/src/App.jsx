import { useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import './layout.css'
import Inicio from './pages/Inicio'
import Catalogo from './pages/Catalogo'
import DetalleProducto from './pages/DetalleProducto'
import Carrito from './pages/Carrito'
import Login from './pages/Login'
import Registro from './pages/Registro'
import ActivarCuenta from './pages/ActivarCuenta'
import Pago from './pages/Pago'
import Confirmacion from './pages/Confirmacion'
import DemoEstadosOrden from './pages/DemoEstadosOrden'
import PasarelaSandbox from './pages/PasarelaSandbox'
import PagoRetorno from './pages/PagoRetorno'
import Contacto from './pages/Contacto'
import QuienesSomos from './pages/QuienesSomos'
import Admin from './pages/Admin'
import AdminProductos from './pages/AdminProductos'
import AdminContenidos from './pages/AdminContenidos'
import AdminImportar from './pages/AdminImportar'
import AdminIncidencias from './pages/AdminIncidencias'
import AdminNotificaciones from './pages/AdminNotificaciones'
import NoEncontrada from './pages/NoEncontrada'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import RutaAdmin from './components/RutaAdmin'
import { ProductosContext } from './productos'
import { ContenidosContext } from './contenidos'
import { EVENTO_PRODUCTOS, listarProductos } from './services/productos'
import { contenidosIniciales, listarContenidos } from './services/contenidos'
import {
  guardarPreferencia, leerPreferencia, leerTemaSitioGuardado, obtenerTemaSitio, recordarTemaSitio,
} from './services/tema'
import AdminApariencia from './pages/AdminApariencia'

function App() {
  const [productos, setProductos] = useState([])
  const [cargandoProductos, setCargandoProductos] = useState(true)
  const [errorProductos, setErrorProductos] = useState('')
  const [revisionProductos, setRevisionProductos] = useState(0)
  // Tema global que elige la administración (se guarda en el backend y lo ven todos los visitantes).
  const [temaSitio, setTemaSitio] = useState(leerTemaSitioGuardado)
  // Tema personal opcional elegido en el navbar: solo vale en este navegador y gana sobre el del sitio.
  const [preferencia, setPreferencia] = useState(leerPreferencia)
  const tema = preferencia || temaSitio

  useEffect(() => {
    const controlador = new AbortController()
    obtenerTemaSitio(controlador.signal)
      .then(valor => { setTemaSitio(valor); recordarTemaSitio(valor) })
      // si el backend no responde se mantiene el último tema conocido
      .catch(() => {})
    return () => controlador.abort()
  }, [])

  // null vuelve a seguir el tema del sitio
  function cambiarPreferencia(valor) {
    setPreferencia(valor)
    guardarPreferencia(valor)
  }

  // la página de apariencia avisa cuando el administrador guarda un tema nuevo
  function cambiarTemaSitio(valor) {
    setTemaSitio(valor)
    recordarTemaSitio(valor)
  }

  useEffect(() => {
    const controlador = new AbortController()
    listarProductos(controlador.signal)
      .then(lista => { setProductos(lista); setErrorProductos('') })
      .catch(error => { if (error.name !== 'AbortError') setErrorProductos(error.message) })
      .finally(() => { if (!controlador.signal.aborted) setCargandoProductos(false) })
    return () => controlador.abort()
  }, [revisionProductos])

  useEffect(() => {
    const actualizar = () => setRevisionProductos(revision => revision + 1)
    window.addEventListener(EVENTO_PRODUCTOS, actualizar)
    return () => window.removeEventListener(EVENTO_PRODUCTOS, actualizar)
  }, [])

  const [contenidos, setContenidos] = useState(contenidosIniciales)
  const [errorContenidos, setErrorContenidos] = useState('')
  const [revisionContenidos, setRevisionContenidos] = useState(0)
  useEffect(() => {
    const controlador = new AbortController()
    listarContenidos(controlador.signal)
      .then(datos => { setContenidos(datos); setErrorContenidos('') })
      .catch(error => { if (error.name !== 'AbortError') setErrorContenidos(error.message) })
    return () => controlador.abort()
  }, [revisionContenidos])

  const { pathname, search } = useLocation()
  // Al cambiar de página se vuelve arriba: sin esto, la nueva página abría en la posición de
  // desplazamiento de la anterior (p. ej. el detalle de un producto quedaba a media altura).
  // `instant` evita la animación del scroll suave que activa Bootstrap: la página nueva aparece ya arriba.
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }) }, [pathname])
  const panel =pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/demo/admin')
  return (
    <ProductosContext.Provider value={{ productos, setProductos, cargando: cargandoProductos, error: errorProductos, recargar: () => { setCargandoProductos(true); setRevisionProductos(actual => actual + 1) } }}>
    <ContenidosContext.Provider value={{ contenidos, error: errorContenidos, recargar: () => { setRevisionContenidos(actual => actual + 1) } }}>
    <div className="store site-shell admin-shell" data-theme={tema}>
            <a href="#contenido" className="saltar-contenido">Saltar al contenido</a>
      <Navbar temaSitio={temaSitio} preferencia={preferencia} onPreferenciaChange={cambiarPreferencia} onTemaSitioChange={cambiarTemaSitio} />
      <main id="contenido" tabIndex="-1" className={panel || pathname === '/' ? undefined : 'site-page'}>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/producto/:id" element={<DetalleProducto />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/activar/:token" element={<ActivarCuenta />} />
          <Route path="/pago" element={<Pago />} />
          <Route path="/confirmacion" element={<Confirmacion />} />
          <Route path="/confirmacion/:id" element={<Confirmacion />} />
          {/* Pasarela de pago simulada (sandbox) y vista a la que vuelve el cliente desde la pasarela. */}
          <Route path="/pago/pasarela-sandbox" element={<PasarelaSandbox />} />
          <Route path="/pago/retorno" element={<PagoRetorno />} />
          {/* Vista de demostración con los 5 estados de la orden, para revisarlos en los 4 temas. */}
          <Route path="/demo/estados-orden" element={<DemoEstadosOrden />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/quienes-somos" element={<QuienesSomos />} />
          <Route path="/admin" element={<RutaAdmin><Admin key={pathname} tema={tema} /></RutaAdmin>} />
          <Route path="/demo/admin" element={<Admin key={pathname} demo tema={tema} />} />
          <Route path="/admin/productos" element={<RutaAdmin><AdminProductos key={pathname + search} /></RutaAdmin>} />
          <Route path="/demo/admin/productos" element={<AdminProductos key={pathname + search} demo />} />
          <Route path="/admin/contenidos" element={<RutaAdmin><AdminContenidos key={pathname} tema={tema} /></RutaAdmin>} />
          <Route path="/demo/admin/contenidos" element={<AdminContenidos key={pathname} demo tema={tema} />} />
          <Route path="/admin/importar" element={<RutaAdmin><AdminImportar tema={tema} /></RutaAdmin>} />
          {/* Tema global del sitio: solo administradores, más su versión demo (no guarda en el backend). */}
          <Route path="/admin/apariencia" element={<RutaAdmin><AdminApariencia key={pathname} tema={tema} temaSitio={temaSitio} preferencia={preferencia} onTemaSitioChange={cambiarTemaSitio} onPreferenciaChange={cambiarPreferencia} /></RutaAdmin>} />
          <Route path="/demo/admin/apariencia" element={<AdminApariencia key={pathname} demo tema={tema} temaSitio={temaSitio} preferencia={preferencia} onTemaSitioChange={() => {}} onPreferenciaChange={cambiarPreferencia} />} />
          {/* Panel de incidencias de compra: solo administradores (RutaAdmin) y su versión demo con datos de ejemplo. */}
          <Route path="/admin/incidencias" element={<RutaAdmin><AdminIncidencias key={pathname} tema={tema} /></RutaAdmin>} />
          <Route path="/demo/admin/incidencias" element={<AdminIncidencias key={pathname} demo tema={tema} />} />
          {/* Panel de correos de compra fallidos: solo administradores y su versión demo. */}
          <Route path="/admin/notificaciones" element={<RutaAdmin><AdminNotificaciones key={pathname} tema={tema} /></RutaAdmin>} />
          <Route path="/demo/admin/notificaciones" element={<AdminNotificaciones key={pathname} demo tema={tema} />} />
          <Route path="*" element={<NoEncontrada />} />
        </Routes>
      </main>
      <Footer />
    </div>
    </ContenidosContext.Provider>
    </ProductosContext.Provider>
  )
}

export default App
