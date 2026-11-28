import { useEffect, useRef, useState } from 'react'
import AdminNav from '../components/AdminNav'
import { useSearchParams } from 'react-router-dom'
import { useProductos, productosIniciales, categorias, pesos, imagenPorProducto } from '../productos'
import { crearProducto, actualizarProducto, subirImagen, EVENTO_PRODUCTOS } from '../services/productos'
import ModalAjusteStock from '../components/ModalAjusteStock'
import './Admin.css'
import './AdminProductos.css'

const imagenesVacias = () => ['', '', '', '']

const vacio = {
  nombre: '',
  descripcion: '',
  categoria: '',
  precio: '',
  stock: '',
  moneda: 'CLP',
  stock_reservado: 0,
  imagenes: imagenesVacias(),
}

function aImagenes(producto) {
  const guardadas = Array.isArray(producto?.imagenes) ? producto.imagenes.filter(Boolean) : []
  const principal = producto?.imagen || guardadas[0] || ''
  const lista = guardadas.length ? [...guardadas] : (principal ? [principal] : [])
  return [...lista, ...Array(Math.max(0, 4 - lista.length)).fill('')].slice(0, 6)
}

export default function AdminProductos({ demo = false }) {
  const contexto = useProductos()
  const [demoProductos, setDemoProductos] = useState(productosIniciales)
  const productos = demo ? demoProductos : contexto.productos
  const aplicar = demo ? setDemoProductos : contexto.setProductos
  const [parametros] = useSearchParams()
  const seleccionado = productos.find(producto => String(producto.id) === String(parametros.get('editar')))
  const [datos, setDatos] = useState(() => seleccionado ? { ...seleccionado, imagenes: aImagenes(seleccionado) } : vacio)
  const [editando, setEditando] = useState(seleccionado?.id || null)
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [errorServidor, setErrorServidor] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [productoAjuste, setProductoAjuste] = useState(null)
  const [subiendo, setSubiendo] = useState(false)
  const formulario = useRef(null)
  const aplicado = useRef(false)
  const archivoRef = useRef(null)
  const indiceArchivo = useRef(0)

  function alAjustarStock(respuesta) {
    const info = respuesta.producto
    aplicar(actual => actual.map(item => (
      String(item.id) === String(info.id)
        ? {
          ...item,
          stock: info.stock_nuevo,
          stock_reservado: info.stock_reservado ?? item.stock_reservado,
          disponible: info.disponible,
          disponibilidad: info.stock_nuevo > 0 && info.disponible !== false ? 'disponible' : 'agotado',
        }
        : item
    )))
    if (!demo) window.dispatchEvent(new Event(EVENTO_PRODUCTOS))
    setMensaje(respuesta.message || 'Stock actualizado correctamente.')
  }

  useEffect(() => {
    if (aplicado.current || !seleccionado) return
    aplicado.current = true
    setDatos({ ...seleccionado, imagenes: aImagenes(seleccionado) })
    setEditando(seleccionado.id)
  }, [seleccionado])

  function limpiar() {
    setDatos({ ...vacio, imagenes: imagenesVacias() })
    setEditando(null)
    setErrores({})
    setErrorServidor('')
  }

  function editar(producto) {
    limpiar()
    setDatos({ ...producto, imagenes: aImagenes(producto) })
    setEditando(producto.id)
    setMensaje('')
    formulario.current.querySelector('[name="nombre"]').focus()
    formulario.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function actualizarImagen(indice, valor) {
    setDatos(actual => ({
      ...actual,
      imagenes: actual.imagenes.map((imagen, i) => i === indice ? valor : imagen),
    }))
  }

  function agregarImagen() {
    setDatos(actual => actual.imagenes.length >= 6 ? actual : { ...actual, imagenes: [...actual.imagenes, ''] })
  }

  function quitarImagen(indice) {
    setDatos(actual => actual.imagenes.length <= 4 ? actual : {
      ...actual,
      imagenes: actual.imagenes.filter((_, i) => i !== indice),
    })
  }

  function elegirArchivo(indice) {
    indiceArchivo.current = indice
    archivoRef.current?.click()
  }

  async function subirArchivo(evento) {
    const archivo = evento.target.files?.[0]
    evento.target.value = ''
    if (!archivo) return
    const indice = indiceArchivo.current
    const tipos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!tipos.includes(archivo.type)) {
      setErrores(actual => ({ ...actual, [`imagen-${indice + 1}`]: 'Usa una imagen JPG, PNG, WEBP o GIF.' }))
      return
    }
    if (archivo.size > 5 * 1024 * 1024) {
      setErrores(actual => ({ ...actual, [`imagen-${indice + 1}`]: 'La imagen no puede superar los 5 MB.' }))
      return
    }
    setSubiendo(true)
    try {
      const url = await subirImagen(archivo)
      actualizarImagen(indice, url)
      setErrores(actual => ({ ...actual, [`imagen-${indice + 1}`]: '' }))
      setMensaje(`Imagen ${indice + 1} subida correctamente.`)
    } catch (error) {
      setErrores(actual => ({ ...actual, [`imagen-${indice + 1}`]: error.message }))
    } finally {
      setSubiendo(false)
    }
  }

  function validarImagen(valor) {
    const texto = String(valor || '').trim()
    if (!texto) return 'Ingresa la URL de la imagen.'
    if (demo && texto.startsWith('/')) return ''

    if (texto.startsWith('data:image')) {
      return 'No se admiten imágenes en Base64. Ingresa un enlace web (http o https).'
    }

    if (texto.length > 500) {
      return `La URL de la imagen es demasiado larga (${texto.length} caracteres). El límite máximo es 500 caracteres.`
    }

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
    if (!/^\d+$/.test(String(datos.stock_reservado)) || !Number.isSafeInteger(Number(datos.stock_reservado))) nuevos.stock_reservado = 'Ingresa un stock reservado entero de cero o más unidades.'

    const imagenes = datos.imagenes.map(imagen => String(imagen || '').trim())
    imagenes.forEach((imagen, indice) => {
      if (indice >= 4 && !imagen) return
      const error = validarImagen(imagen)
      if (error) nuevos[`imagen-${indice + 1}`] = error
    })
    const cantidadImagenes = imagenes.filter(Boolean).length
    if (cantidadImagenes < 4 || cantidadImagenes > 6) nuevos.imagenes = 'Debes ingresar entre 4 y 6 imágenes.'

    setErrores(nuevos)
    if (Object.keys(nuevos).length) {
      formulario.current.querySelector(`[name="${Object.keys(nuevos)[0]}"]`)?.focus()
      return
    }

    const producto = {
      ...datos,
      id: editando || crypto.randomUUID(),
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion.trim(),
      precio: Number(datos.precio),
      stock: Number(datos.stock),
      moneda: datos.moneda || 'CLP',
      stock_reservado: Number(datos.stock_reservado) || 0,
      imagenes: imagenes.filter(Boolean),
      imagen: imagenes.find(Boolean) || '',
    }
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
          moneda: producto.moneda,
          stock_reservado: producto.stock_reservado,
          imagenes: producto.imagenes,
          imagen_url: producto.imagen,
        }
        const guardado = editando ? await actualizarProducto(editando, payload) : await crearProducto(payload)
        const item = {
          ...guardado,
          categoria: guardado.categoria || producto.categoria,
          imagen: guardado.imagen || producto.imagen,
          imagenes: guardado.imagenes?.length ? guardado.imagenes : producto.imagenes,
          moneda: guardado.moneda || producto.moneda,
          stock_reservado: guardado.stock_reservado ?? producto.stock_reservado,
        }
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
        <input ref={archivoRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={subirArchivo} hidden />
        <h2 id="producto-form-titulo">{editando ? 'Editar producto' : 'Registrar producto'}</h2>
        <p className="producto-ayuda">Precios en CLP. El backend exige entre 4 y 6 imágenes; si editas un producto anterior, completa las que falten.</p>
        {campo('nombre', 'Nombre')}
        <div className="producto-campo"><label htmlFor="producto-descripcion">Descripción</label><textarea id="producto-descripcion" name="descripcion" rows={3} required value={datos.descripcion} aria-invalid={!!errores.descripcion} aria-describedby={errores.descripcion ? 'producto-error-descripcion' : undefined} onChange={evento => setDatos({ ...datos, descripcion: evento.target.value })} /><span className="producto-error" id="producto-error-descripcion">{errores.descripcion}</span></div>
        <div className="producto-campo"><label htmlFor="producto-categoria">Categoría</label><select id="producto-categoria" name="categoria" value={datos.categoria} required aria-invalid={!!errores.categoria} aria-describedby={errores.categoria ? 'producto-error-categoria' : undefined} onChange={evento => setDatos({ ...datos, categoria: evento.target.value })}><option value="">Selecciona una categoría</option>{categorias.map(item => <option key={item}>{item}</option>)}</select><span className="producto-error" id="producto-error-categoria">{errores.categoria}</span></div>
        <div className="producto-numeros">
          {campo('precio', 'Precio (CLP)', 'number')}
          {editando
            ? <div className="producto-campo"><label>Stock actual</label><input type="text" value={`${datos.stock} unidades`} disabled /><small>Usa «Ajustar stock» en la lista para modificar existencias.</small></div>
            : campo('stock', 'Stock inicial (unidades)', 'number')}
        </div>
        <div className="producto-campo">
          <label>Imágenes del producto (4 a 6)</label>
          <small>Usa URLs públicas http/https o sube un archivo. La primera será la imagen principal.</small>
          {datos.imagenes.map((imagen, indice) => <div className="producto-imagen-fila" key={indice}>
            <div className="producto-imagen-fila-campos">
              <input id={`producto-imagen-${indice + 1}`} name={`imagen-${indice + 1}`} type="url" placeholder={`https://... (imagen ${indice + 1})`} value={imagen} maxLength={500} required={indice < 4} aria-invalid={!!errores[`imagen-${indice + 1}`]} aria-describedby={errores[`imagen-${indice + 1}`] ? `producto-error-imagen-${indice + 1}` : undefined} onChange={evento => actualizarImagen(indice, evento.target.value)} />
              <button type="button" disabled={subiendo} aria-label={`Subir archivo para la imagen ${indice + 1}`} onClick={() => elegirArchivo(indice)}>{subiendo ? 'Subiendo…' : 'Subir archivo'}</button>
              {datos.imagenes.length > 4 && <button type="button" aria-label={`Quitar imagen ${indice + 1}`} onClick={() => quitarImagen(indice)}>Quitar</button>}
            </div>
            {errores[`imagen-${indice + 1}`] && <span className="producto-error" id={`producto-error-imagen-${indice + 1}`}>{errores[`imagen-${indice + 1}`]}</span>}
            {imagen && !errores[`imagen-${indice + 1}`] && <img className="producto-preview" src={imagen} alt={`Vista previa de la imagen ${indice + 1}`} onError={evento => { evento.currentTarget.onerror = null; evento.currentTarget.src = imagenPorProducto(datos) }} />}
          </div>)}
          {datos.imagenes.length < 6 && <button type="button" onClick={agregarImagen}>Agregar imagen</button>}
          {errores.imagenes && <span className="producto-error">{errores.imagenes}</span>}
        </div>
        <div className="producto-form-acciones"><button type="submit" className="primary" disabled={guardando}>{guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Registrar producto'}</button><button type="button" disabled={guardando} onClick={() => { limpiar(); setMensaje(''); formulario.current.querySelector('[name="nombre"]').focus() }}>{editando ? 'Cancelar edición' : 'Limpiar formulario'}</button></div>
      </form>
      <section className="productos-inventario" aria-labelledby="inventario-titulo">
        <h2 id="inventario-titulo">Productos registrados <small>({productos.length})</small></h2>
        <p className="producto-ayuda">Selecciona un producto para modificar sus datos o ajustar su stock.</p>
        {!demo && contexto.cargando && <p role="status">Cargando productos…</p>}
        <div className="productos-items">
          {productos.map(producto => (
            <article className="producto-resumen" key={producto.id}>
              {producto.imagen && (
                <img
                  src={producto.imagen}
                  alt={producto.nombre}
                  onError={evento => { evento.currentTarget.onerror = null; evento.currentTarget.src = imagenPorProducto(producto) }}
                />
              )}
              <div>
                <small>{producto.categoria}</small>
                <h3>{producto.nombre}</h3>
                <p>{producto.descripcion}</p>
                <strong>{pesos.format(producto.precio)}</strong>
                <p>{producto.stock === 0 ? 'Sin stock' : `${producto.stock} unidades disponibles`}</p>
                <div className="producto-resumen-acciones">
                  <button
                    type="button"
                    aria-label={`Editar producto ${producto.nombre}`}
                    onClick={() => editar(producto)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="primary"
                    aria-label={`Ajustar stock de ${producto.nombre}`}
                    onClick={() => setProductoAjuste(producto)}
                  >
                    Ajustar stock
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>

    {productoAjuste && (
      <ModalAjusteStock
        key={productoAjuste.id}
        producto={productoAjuste}
        demo={demo}
        onGuardado={alAjustarStock}
        onCerrar={() => setProductoAjuste(null)}
      />
    )}
  </section>
}
