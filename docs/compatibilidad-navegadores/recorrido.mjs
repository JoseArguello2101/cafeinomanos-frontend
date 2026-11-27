// Recorrido de navegación y compra completa con Puppeteer (WebDriver BiDi), mismo código para Chrome y Firefox.
// Uso: node recorrido.mjs [chrome|firefox ...] [--base=URL] [--publico]
//   --publico: solo pasos sin inicio de sesión (para revisar un sitio desplegado).
// Ver README.md de esta carpeta para instalar puppeteer-core y definir las cuentas de prueba.
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const args = process.argv.slice(2)
const BASE = (args.find(a => a.startsWith('--base='))?.slice(7) || 'http://localhost:5173').replace(/\/$/, '')
const SOLO_PUBLICO = args.includes('--publico')
const etiqueta = SOLO_PUBLICO ? 'publico' : 'local'
const navegadores = args.filter(a => !a.startsWith('--'))

// Cuentas de prueba por variables de entorno (nunca se guardan en el repositorio).
const cuenta = {
  email: process.env.COMPAT_CLIENTE_EMAIL,
  password: process.env.COMPAT_CLIENTE_CLAVE,
  admin_email: process.env.COMPAT_ADMIN_EMAIL,
  admin_password: process.env.COMPAT_ADMIN_CLAVE,
}
if (!SOLO_PUBLICO && Object.values(cuenta).some(valor => !valor)) {
  console.error('Faltan COMPAT_CLIENTE_EMAIL, COMPAT_CLIENTE_CLAVE, COMPAT_ADMIN_EMAIL y COMPAT_ADMIN_CLAVE (o usa --publico).')
  process.exit(1)
}

const EJECUTABLES = {
  // Motor de Chrome: Brave instalado (o Google Chrome, indicando su ruta en COMPAT_CHROME).
  // Protocolo CDP, el nativo de Chrome.
  chrome: {
    browser: 'chrome', protocol: 'cdp', headless: true,
    executablePath: process.env.COMPAT_CHROME || 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
  },
  // Firefox oficial instalado en el equipo. Protocolo WebDriver BiDi.
  firefox: {
    browser: 'firefox', protocol: 'webDriverBiDi', headless: true,
    executablePath: process.env.COMPAT_FIREFOX || 'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
  },
}

async function recorrer(nombre) {
  const dir = `capturas-${etiqueta}/${nombre}`
  fs.mkdirSync(dir, { recursive: true })
  const navegador = await puppeteer.launch({ ...EJECUTABLES[nombre], defaultViewport: { width: 1280, height: 800 } })
  const version = await navegador.version()
  // se usa la pestaña que abre el navegador al iniciar (Firefox falla al crear una nueva tan pronto)
  const pagina = (await navegador.pages())[0] || await navegador.newPage()
  // misma ventana en ambos navegadores para que las capturas sean comparables
  await pagina.setViewport({ width: 1280, height: 800 })
  const errores = []
  // cuenta las validaciones del carrito para detectar peticiones repetidas en /pago
  let validaciones = 0
  pagina.on('request', r => { if (r.url().includes('/carrito/validar/') && r.method() === 'POST') validaciones += 1 })
  pagina.on('console', m => { if (m.type() === 'error') errores.push({ tipo: 'consola', texto: m.text(), ruta: ruta() }) })
  pagina.on('pageerror', e => errores.push({ tipo: 'excepcion', texto: String(e.message || e), ruta: ruta() }))
  pagina.on('requestfailed', r => { if (!/favicon|hot-update/.test(r.url())) errores.push({ tipo: 'red', texto: `${r.failure()?.errorText} ${r.url()}`, ruta: ruta() }) })
  function ruta() { return pagina.url().replace(BASE, '') }

  // Busca un elemento visible por CSS + texto y lo devuelve (espera hasta que aparezca).
  async function buscar(css, texto, timeout = 10000) {
    const h = await pagina.waitForFunction((css, src) => [...document.querySelectorAll(css)]
      .find(e => new RegExp(src, 'i').test(e.textContent.trim() || e.getAttribute('aria-label') || '') && e.getClientRects().length > 0),
    { timeout }, css, texto)
    return h.asElement()
  }
  const clic = async (css, texto, timeout) => (await buscar(css, texto, timeout)).click()
  const esperarRuta = (re, timeout = 15000) => pagina.waitForFunction(src => new RegExp(src).test(location.pathname), { timeout }, re.source)
  async function escribir(css, valor) {
    await pagina.waitForSelector(css)
    await pagina.$eval(css, e => { e.focus(); e.select?.() })
    await pagina.type(css, valor)
  }

  const pasos = []
  let n = 0
  async function paso(titulo, accion) {
    n += 1
    const id = String(n).padStart(2, '0')
    const registro = { id, titulo, ok: false }
    const t0 = Date.now()
    try {
      await accion()
      await new Promise(r => setTimeout(r, 400))
      registro.ok = true
    } catch (error) {
      registro.error = String(error.message).split('\n')[0]
    }
    registro.ms = Date.now() - t0
    registro.ruta = ruta()
    registro.desborde = await pagina.evaluate(() => document.documentElement.scrollWidth - window.innerWidth).catch(() => null)
    await pagina.screenshot({ path: `${dir}/${id}.png` }).catch(() => {})
    pasos.push(registro)
    console.log(`[${nombre}] ${id} ${registro.ok ? 'OK ' : 'ERR'} ${titulo}${registro.error ? ' -> ' + registro.error : ''}`)
  }

  await paso('Inicio carga con navegación principal', async () => {
    await pagina.goto(BASE + '/', { waitUntil: 'load' })
    await pagina.waitForSelector('nav.site-nav')
  })
  await paso('Ir al catálogo desde el menú', async () => {
    await clic('nav.site-nav a', '^Catálogo$')
    await esperarRuta(/^\/catalogo/)
    await buscar('a', '^Ver detalles$', 20000)
  })
  await paso('Cambiar a tema oscuro y volver a claro', async () => {
    await clic('button.nav-temas-boton', 'Temas')
    await clic('[role="menuitemradio"]', '^Oscuro$')
    const tema = await pagina.$eval('.store', e => e.getAttribute('data-theme'))
    if (tema !== 'oscuro') throw new Error(`data-theme quedó en ${tema}`)
    await pagina.screenshot({ path: `${dir}/03b-oscuro.png` })
    await clic('button.nav-temas-boton', 'Temas')
    await clic('[role="menuitemradio"]', '^Claro$')
  })
  await paso('Abrir el detalle de un producto disponible', async () => {
    // primera tarjeta que no esté agotada
    // se baja al final del catálogo antes de abrir el producto: el detalle debe abrir arriba
    await pagina.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await new Promise(r => setTimeout(r, 300))
    const enlace = await pagina.waitForFunction(() => [...document.querySelectorAll('.catalogo-tarjeta, article')]
      .find(t => !/agotado/i.test(t.textContent))?.querySelector('a[href*="/producto/"]'), { timeout: 10000 })
    await enlace.asElement().click()
    await esperarRuta(/^\/producto\//)
    await buscar('button', 'Agregar al carrito')
    const y = await pagina.evaluate(() => window.scrollY)
    if (y > 0) throw new Error(`el detalle abrió desplazado ${y}px hacia abajo`)
  })
  await paso('Agregar el producto al carrito', async () => {
    await clic('button', '^Agregar al carrito$')
    await pagina.waitForFunction(() => /Carrito, [1-9]/.test(document.querySelector('.nav-carrito')?.getAttribute('aria-label') || ''), { timeout: 10000 })
  })
  await paso('Abrir el carrito', async () => {
    await (await pagina.waitForSelector('.nav-carrito')).click()
    await esperarRuta(/^\/carrito/)
    await buscar('a, button', 'Continuar al pago|Iniciar sesión')
  })

  if (!SOLO_PUBLICO) {
    await paso('Iniciar sesión como cliente', async () => {
      await pagina.goto(BASE + '/login')
      await escribir('#email', cuenta.email)
      await escribir('#password', cuenta.password)
      await clic('button[type="submit"]', 'Iniciar sesión')
      await pagina.waitForFunction(() => !location.pathname.startsWith('/login'), { timeout: 10000 })
    })
    await paso('Volver al carrito y continuar al pago', async () => {
      await pagina.goto(BASE + '/carrito')
      await clic('a', '^Continuar al pago$')
      await esperarRuta(/^\/pago$/)
      await buscar('button', '^Confirmar pedido$', 15000)
      // con el formulario abierto 3 s, la validación del carrito debe hacerse una vez (dos en modo desarrollo)
      validaciones = 0
      await new Promise(r => setTimeout(r, 3000))
      if (validaciones > 0) throw new Error(`${validaciones} validaciones extra del carrito en 3 s sin interactuar`)
    })
    await paso('Completar datos de entrega y confirmar el pedido', async () => {
      await escribir('input[name="direccion"]', 'Av. Siempre Viva 742')
      await escribir('input[name="comuna"]', 'Providencia')
      await pagina.select('select[name="metodo_pago"]', 'tarjeta')
      await clic('button', '^Confirmar pedido$')
      await esperarRuta(/^\/confirmacion/)
      await buscar('button', 'Pagar con pasarela de prueba', 15000)
    })
    await paso('Ir a la pasarela de pago sandbox', async () => {
      await clic('button', 'Pagar con pasarela de prueba')
      await esperarRuta(/pasarela-sandbox/)
      await buscar('button', 'Aprobar pago de prueba')
    })
    await paso('Aprobar el pago y ver la orden confirmada', async () => {
      await clic('button', 'Aprobar pago de prueba')
      await esperarRuta(/^\/pago\/retorno/)
      await buscar('main *', 'confirmad|aprobad', 20000)
    })
  }

  await paso('Páginas informativas: Quiénes somos y Contacto', async () => {
    await pagina.goto(BASE + '/quienes-somos')
    await pagina.waitForSelector('main')
    await pagina.goto(BASE + '/contacto')
    await pagina.waitForSelector('form')
  })
  await paso('Formulario de registro: validación en el navegador', async () => {
    await pagina.goto(BASE + '/registro')
    await clic('button[type="submit"]', 'Crear cuenta|Registrar')
    // con el formulario vacío deben aparecer mensajes de error, sin crear nada
    await buscar('.invalid-feedback, [role="alert"], .text-danger', '.+', 5000)
  })

  if (!SOLO_PUBLICO) {
    await pagina.evaluate(() => { localStorage.removeItem('token'); localStorage.removeItem('usuario') })
    await paso('Iniciar sesión como administrador', async () => {
      await pagina.goto(BASE + '/login')
      await escribir('#email', cuenta.admin_email)
      await escribir('#password', cuenta.admin_password)
      await clic('button[type="submit"]', 'Iniciar sesión')
      await esperarRuta(/^\/admin/, 10000)
      await pagina.waitForSelector('nav.admin-secciones')
    })
    for (const [seccion, destino, esperado] of [
      ['Usuarios', /^\/admin$/, 'table'],
      ['Productos', /^\/admin\/productos$/, 'form'],
      ['Contenidos', /^\/admin\/contenidos$/, 'form'],
      ['Incidencias de compra', /^\/admin\/incidencias$/, '.admin-lista'],
      ['Correos', /^\/admin\/notificaciones$/, '.admin-lista'],
    ]) {
      await paso(`Panel admin: ${seccion}`, async () => {
        await clic('nav.admin-secciones a', `^${seccion}$`)
        await esperarRuta(destino)
        await pagina.waitForSelector(esperado, { timeout: 10000 })
      })
    }
  }

  // Pantalla de teléfono (390 px): desbordes horizontales en páginas clave.
  await pagina.setViewport({ width: 390, height: 844 })
  const desbordesMovil = {}
  for (const r of ['/', '/catalogo', '/carrito', '/login', '/registro', '/contacto', '/quienes-somos']) {
    await pagina.goto(BASE + r)
    await new Promise(res => setTimeout(res, 1200))
    desbordesMovil[r] = await pagina.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    await pagina.screenshot({ path: `${dir}/movil${r === '/' ? '_inicio' : r.replace(/\//g, '_')}.png`, fullPage: true })
  }

  const resultado = { navegador: nombre, version, base: BASE, pasos, errores, desbordesMovil }
  fs.writeFileSync(`resultado-${etiqueta}-${nombre}.json`, JSON.stringify(resultado, null, 2))
  await navegador.close()
}

for (const nombre of navegadores.length ? navegadores : ['chrome', 'firefox']) await recorrer(nombre)
