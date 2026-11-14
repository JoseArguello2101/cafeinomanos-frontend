import { useEffect, useRef, useState } from 'react'
import AdminNav from '../components/AdminNav'
import { useSearchParams } from 'react-router-dom'
import { useProductos, productosIniciales, categorias, pesos } from '../productos'
import { crearProducto, actualizarProducto } from '../services/productos'
import './Admin.css'
import './AdminProductos.css'

const vacio = { nombre: '', descripcion: '', categoria: '', precio: '', stock: '', imagen: '' }

export default function AdminProductos({ demo = false }) {
  const contexto = useProductos()
  const [demoProductos, setDemoProductos] = useState(productosIniciales)
  const productos = demo ? demoProductos : contexto.productos
  const aplicar = demo ? setDemoProductos : contexto.setProductos
  const [parametros] = useSearchParams()
  const seleccionado = productos.find(producto => String(producto.id) === String(parametros.get('editar')))
  const [datos, setDatos] = useState(() => seleccionado ? { ...seleccionado } : vacio)
  const [editando, setEditando] = useState(seleccionado?.id || null)
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [errorServidor, setErrorServidor] = useState('')
  const [guardando, setGuardando] = useState(false)
  const formulario = useRef(null)
  const aplicado = useRef(false)

  useEffect(() => {
    if (aplicado.current || !seleccionado) return
    aplicado.current = true
    setDatos({ ...seleccionado })
    setEditando(seleccionado.id)
  }, [seleccionado])

  function limpiar() {
    setDatos(vacio)
    setEditando(null)
    setErrores({})
    setErrorServidor('')
  }

  function editar(producto) {
    limpiar()
    setDatos({ ...producto })
    setEditando(producto.id)
    setMensaje('')
    formulario.current.querySelector('[name="nombre"]').focus()
    formulario.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function validarImagen(valor) {
    const texto = String(valor || '').trim()
    if (!texto) return 'Ingresa la URL de la imagen.'
    if (demo && texto.startsWith('/')) return ''

    // 1. Evitar cadenas Base64 que superan el límite de PostgreSQL
    if (texto.startsWith('data:image')) {
      return 'No se admiten imágenes en Base64. Ingresa un enlace web (http o https).'
    }

    // 2. Validar el límite estricto de models.URLField(max_length=500)
    if (texto.length > 500) {
      return `La URL de la imagen es demasiado larga (${texto.length} caracteres). El límite máximo es 500 caracteres.`
    }

    // 3. Validar estructura de protocolo HTTP/HTTPS
    try {
      const url = new URL(texto)
      if (!['http:', 'https:'].includes(url.protocol)) {
        return 'La URL debe comenzar con http:// o https://.'
      }
    } catch {
      return 'Ingresa una URL de imagen válida.'
    }
    return ''
  }

  async function guardar(evento) {
    evento.preventDefault()
    if (guardando) return
    const nuevos = {}
    if (!datos.nombre.trim()) nuevos.nombre = 'Ingresa el nombre del producto.'
    else if (datos.nombre.trim().length > 100) nuevos.nombre = 'Usa como máximo 100 caracteres.'
    if (!datos.descripcion.trim()) nuevos.descripcion = 'Ingresa una descripción.'
    else if (datos.descripcion.trim().length > 1000) nuevos.descripcion = 'Usa como máximo 1000 caracteres.'
    if (!categorias.includes(datos.categoria)) nuevos.categoria = 'Selecciona una categoría.'
    if (!/^\d+$/.test(String(datos.precio)) || !Number.isSafeInteger(Number(datos.precio)) || Number(datos.precio) <= 0) nuevos.precio = 'Ingresa un precio entero mayor que cero, en pesos chilenos.'
    if (!/^\d+$/.test(String(datos.stock)) || !Number.isSafeInteger(Number(datos.stock))) nuevos.stock = 'Ingresa un stock entero de cero o más unidades.'
    const errorImagen = validarImagen(datos.imagen)
    if (errorImagen) nuevos.imagen = errorImagen
    setErrores(nuevos)
    if (Object.keys(nuevos).length) {
      formulario.current.querySelector(`[name="${Object.keys(nuevos)[0]}"]`)?.focus()
      return
    }
    const producto = { ...datos, id: editando || crypto.randomUUID(), nombre: datos.nombre.trim(), descripcion: datos.descripcion.trim(), precio: Number(datos.precio), stock: Number(datos.stock), imagen: datos.imagen.trim() }
    setGuardando(true)
    setErrorServidor('')
    try {
      if (demo) {
        aplicar(actual => editando ? actual.map(item => item.id === editando ? producto : item) : [...actual, producto])
        setMensaje(`${producto.nombre}: producto ${editando ? 'actualizado' : 'registrado'} en la demostración.`)
      } else {
        const payload = {
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          categoria: producto.categoria,
          precio: producto.precio,
          stock: producto.stock,
          imagen_url: producto.imagen,
        }
        const guardado = editando ? await actualizarProducto(editando, payload) : await crearProducto(payload)
        const item = { ...guardado, categoria: guardado.categoria || producto.categoria, imagen: guardado.imagen || producto.imagen }
        aplicar(actual => editando ? actual.map(elemento => elemento.id === editando ? item : elemento) : [...actual, item])
        setMensaje(`${item.nombre}: producto ${editando ? 'actualizado' : 'registrado'} correctamente.`)
      }
      limpiar()
    } catch (error) {
      setErrorServidor(error.message)
    } finally {
      setGuardando(false)
    }
  }

  function campo(nombre, etiqueta, tipo = 'text') {
    return <div className="producto-campo">
      <label htmlFor={`producto-${nombre}`}>{etiqueta}</label>
      <input id={`producto-${nombre}`} name={nombre} type={tipo} value={datos[nombre]} min={nombre === 'precio' ? '1' : '0'} step={tipo === 'number' ? '1' : undefined} required aria-invalid={!!errores[nombre]} aria-describedby={errores[nombre] ? `producto-error-${nombre}` : undefined} onChange={evento => setDatos({ ...datos, [nombre]: evento.target.value })} />
      {errores[nombre] && <span className="producto-error" id={`producto-error-${nombre}`}>{errores[nombre]}</span>}
    </div>
  }

  return <section className="productos-admin" aria-labelledby="productos-titulo">
    <AdminNav />
    <header className="admin-cabecera"><p className="admin-etiqueta">Paraíso del Café / Administración</p><h1 id="productos-titulo">Gestión de productos</h1><p>Registra productos y mantén sus datos, precios e inventario al día.</p></header>
    <div className="admin-demo">{demo ? <><strong>Modo demostración.</strong> Los cambios solo se guardan en esta vista y se restablecen al recargar o salir del panel.</> : <><strong>Productos conectados.</strong> Los cambios se guardan en el backend y se reflejan en el catálogo.</>}</div>
    {parametros.has('editar') && !seleccionado && !contexto.cargando && <p className="producto-aviso" role="alert">El producto solicitado no existe. Puedes registrar uno nuevo.</p>}
    {errorServidor && <p className="producto-aviso" role="alert">{errorServidor}</p>}
    {!demo && contexto.error && <p className="producto-aviso" role="alert">{contexto.error} <button type="button" onClick={contexto.recargar}>Reintentar</button></p>}
    <div role="status" aria-live="polite">{mensaje && <p className="producto-aviso">{mensaje}</p>}</div>
    <div className="productos-layout">
      <form ref={formulario} className="producto-form" onSubmit={guardar} noValidate aria-labelledby="producto-form-titulo">
        <h2 id="producto-form-titulo">{editando ? 'Editar producto' : 'Registrar producto'}</h2>
        <p className="producto-ayuda">Todos los campos son obligatorios. Precios en CLP.</p>
        {campo('nombre', 'Nombre')}
        <div className="producto-campo"><label htmlFor="producto-descripcion">Descripción</label><textarea id="producto-descripcion" name="descripcion" rows={3} required value={datos.descripcion} aria-invalid={!!errores.descripcion} aria-describedby="producto-error-descripcion" onChange={evento => setDatos({ ...datos, descripcion: evento.target.value })} /><span className="producto-error" id="producto-error-descripcion">{errores.descripcion}</span></div>
        <div className="producto-campo"><label htmlFor="producto-categoria">Categoría</label><select id="producto-categoria" name="categoria" value={datos.categoria} required aria-invalid={!!errores.categoria} aria-describedby="producto-error-categoria" onChange={evento => setDatos({ ...datos, categoria: evento.target.value })}><option value="">Selecciona una categoría</option>{categorias.map(item => <option key={item}>{item}</option>)}</select><span className="producto-error" id="producto-error-categoria">{errores.categoria}</span></div>
        <div className="producto-numeros">{campo('precio', 'Precio (CLP)', 'number')}{campo('stock', 'Stock (unidades)', 'number')}</div>
        <div className="producto-campo"><label htmlFor="producto-imagen">URL de la imagen</label><input id="producto-imagen" name="imagen" type="url" placeholder="https://..." value={datos.imagen} maxLength={500} required aria-invalid={!!errores.imagen} aria-describedby="imagen-ayuda producto-error-imagen" onChange={evento => setDatos({ ...datos, imagen: evento.target.value })} /><small id="imagen-ayuda">Usa una URL pública de imagen (JPG, PNG o WebP). El backend guarda la referencia, no el archivo.</small><span className="producto-error" id="producto-error-imagen">{errores.imagen}</span>{datos.imagen && !errores.imagen && <img className="producto-preview" src={datos.imagen} alt="Vista previa de la imagen del producto" />}</div>
        <div className="producto-form-acciones"><button type="submit" className="primary" disabled={guardando}>{guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Registrar producto'}</button><button type="button" disabled={guardando} onClick={() => { limpiar(); setMensaje(''); formulario.current.querySelector('[name="nombre"]').focus() }}>{editando ? 'Cancelar edición' : 'Limpiar formulario'}</button></div>
      </form>
      <section className="productos-inventario" aria-labelledby="inventario-titulo"><h2 id="inventario-titulo">Productos registrados <small>({productos.length})</small></h2><p className="producto-ayuda">Selecciona un producto para modificar sus datos.</p>{!demo && contexto.cargando && <p role="status">Cargando productos…</p>}<div className="productos-items">{productos.map(producto => <article className="producto-resumen" key={producto.id}>{producto.imagen && <img src={producto.imagen} alt={producto.nombre} />}<div><small>{producto.categoria}</small><h3>{producto.nombre}</h3><p>{producto.descripcion}</p><strong>{pesos.format(producto.precio)}</strong><p>{producto.stock === 0 ? 'Sin stock' : `${producto.stock} unidades disponibles`}</p><button type="button" aria-label={`Editar producto ${producto.nombre}`} onClick={() => editar(producto)}>Editar</button></div></article>)}</div></section>
    </div>
  </section>
}
