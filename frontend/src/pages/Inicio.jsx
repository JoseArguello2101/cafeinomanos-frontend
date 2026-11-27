import { Link } from 'react-router-dom';
import heroImage from '../assets/hero.png';
import { useProductos, priorizarProductosIniciales } from '../productos';
import { useContenidos } from '../contenidos';
import TarjetaProducto from '../components/TarjetaProducto';
import '../inicio.css';
import './Catalogo.css';
import './PaginasContenido.css';

function Inicio() {
  const { productos: inventario, cargando, error } = useProductos();
  const { contenidos } = useContenidos();
  const contenido = contenidos.inicio;
  // Se reutiliza el producto normalizado: la tarjeta del catálogo ya muestra
  // precio, stock, compra y estado (agotado) con la misma lógica.
  const productos = priorizarProductosIniciales(inventario).slice(0, 3);
  const destino = contenido.boton_url || '/catalogo';
  const boton = /^https?:\/\//.test(destino)
    ? <a href={destino} className="btn btn-primary btn-hero">{contenido.boton_texto}</a>
    : <Link to={destino} className="btn btn-primary btn-hero">{contenido.boton_texto}</Link>;

  return (
    <>
      <section className="hero">
        <div className="contenedor-hero">
          <div className="imagen-hero">
            <img src={contenido.imagen_url || heroImage} alt={contenido.imagen_alt || 'Fotografía del café'} />
          </div>
          <div className="hero-content">
            <div className="hero-texto">
              <h1 className="titulo">{contenido.titulo}</h1>
              {contenido.subtitulo && <p className="pagina-subtitulo">{contenido.subtitulo}</p>}
              <p className="descripcion">{contenido.texto}</p>
              {contenido.texto_secundario && <p className="descripcion">{contenido.texto_secundario}</p>}
            </div>
            {contenido.boton_texto && boton}
          </div>
        </div>
      </section>

      <section className="productos-destacados">
        <div className="titulo-productos-destacados">
          <h2>PRODUCTOS DESTACADOS</h2>
        </div>

        {cargando && <p className="descripcion">Cargando productos…</p>}
        {error && <p className="descripcion" role="alert">{error}</p>}

        <div className="catalogo-grid">
          {productos.map(producto => <TarjetaProducto key={producto.id} producto={producto} />)}
        </div>
      </section>
    </>
  );
}

export default Inicio;
