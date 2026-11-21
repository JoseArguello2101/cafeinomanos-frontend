import { Link } from 'react-router-dom';
import heroImage from '../assets/hero.png';
import { useProductos, pesos, imagenPorProducto, priorizarProductosIniciales } from '../productos';
import { useContenidos } from '../contenidos';
import AgregarAlCarrito from '../components/AgregarAlCarrito';
import '../inicio.css';
import './PaginasContenido.css';

function Inicio() {
  const { productos: inventario, cargando, error } = useProductos();
  const { contenidos } = useContenidos();
  const contenido = contenidos.inicio;
  const productos = priorizarProductosIniciales(inventario).slice(0, 3).map(producto => ({
    ...producto,
    id: producto.id, name: producto.nombre, price: pesos.format(producto.precio), image: producto.imagen
  }));
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

        <div className="productos-grid">
          {productos.map(product => (
            <article key={product.id} className="tarjeta-producto">
              <h3 className="nombre-producto">{product.name}</h3>

              <div className="imagen-producto">
                <img src={product.image} alt={product.name} onError={evento => { evento.currentTarget.onerror = null; evento.currentTarget.src = imagenPorProducto({ nombre: product.name }) }} />
              </div>

              <div className="fila-producto">
                <strong className="precio">{product.price}</strong>
              </div>
              <AgregarAlCarrito producto={product} rapido compacto />

              <Link to={`/producto/${product.id}`} className="ver-detalles">
                Ver detalles
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

export default Inicio;
