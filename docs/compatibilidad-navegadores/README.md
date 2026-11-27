# Compatibilidad Chrome y Firefox: lista de comprobación

## Cómo se registró

1. Cada paso se anotó en una tabla que describe el paso que se hacía, el navegador ocupado y una observación. Se marcó con **✓** si funciona, **X** si falla y **?** si funciona pero tiene errores u observaciones. Si algo falla, se añade una observación junto a un código.
2. Códigos según el tipo de problema:
   - **D:** diferencias entre Chrome y Firefox.
   - **F:** fallas en ambos navegadores.
   - **P:** errores fuera del frontend (pendientes en datos o backend).
3. Se evidenció el paso a paso con capturas: a la izquierda la evidencia de Chrome y a la derecha la de Firefox.

## 1. Recorrido completo (entorno local)

Resultado final, después de las correcciones y con el rediseño del catálogo (`f26de66`) incluido.

| # | Paso | Chrome (Brave) | Firefox | Observación |
|---|---|:-:|:-:|---|
| 01 | Inicio carga con el menú principal | ✓ | ✓ | |
| 02 | Ir al catálogo desde el menú | ✓ | ? | En Firefox el selector de cantidad queda cortado (ver **D3**) |
| 03 | Cambiar a tema oscuro y volver a claro | ✓ | ✓ | |
| 04 | Abrir el detalle de un producto (tras bajar al final del catálogo) | ✓ | ✓ | Antes de corregir: abría desplazado (ver **F2**) |
| 05 | Agregar el producto al carrito | ✓ | ✓ | El contador del carrito se actualiza |
| 06 | Abrir el carrito | ✓ | ✓ | |
| 07 | Iniciar sesión como cliente | ✓ | ✓ | |
| 08 | Volver al carrito y continuar al pago | ✓ | ✓ | Antes de corregir: 41 validaciones del carrito en 3 s (ver **F1**) |
| 09 | Completar datos de entrega y confirmar el pedido | ✓ | ✓ | La orden queda "Pendiente de pago" |
| 10 | Ir a la pasarela de pago sandbox | ✓ | ✓ | |
| 11 | Aprobar el pago y ver la orden confirmada | ✓ | ✓ | |
| 12 | Páginas Quiénes somos y Contacto | ✓ | ✓ | |
| 13 | Registro: validación del formulario vacío | ✓ | ✓ | Muestra los errores sin crear la cuenta |
| 14 | Iniciar sesión como administrador | ✓ | ✓ | |
| 15 | Panel admin: Usuarios | ✓ | ✓ | |
| 16 | Panel admin: Productos | ? | ? | Aviso de React por productos repetidos (ver **P3**) |
| 17 | Panel admin: Contenidos | ✓ | ✓ | |
| 18 | Panel admin: Incidencias de compra | ✓ | ✓ | |
| 19 | Panel admin: Correos | ✓ | ✓ | |
| — | Sin desborde horizontal en escritorio (19 pasos) | ✓ | ✓ | |
| — | Sin desborde horizontal en teléfono (inicio, catálogo, carrito, login, registro, contacto, quiénes somos) | ✓ | ✓ | |

## 2. Sitio publicado (Vercel + Render), solo pasos públicos

No se inició sesión ni se compró en producción, para no usar contraseñas reales ni crear pedidos en la base publicada. Esos pasos quedan cubiertos por el recorrido local. El sitio publicado ya tiene el rediseño del catálogo (`f26de66`), pero todavía no las correcciones de esta lista.

| # | Paso | Chrome (Brave) | Firefox | Observación |
|---|---|:-:|:-:|---|
| 01 | Inicio | ✓ | ✓ | |
| 02 | Catálogo | ? | X | Imágenes con dirección de red local (ver **D2**) y selector de cantidad cortado en Firefox (ver **D3**) |
| 03 | Tema oscuro y claro | ✓ | ✓ | |
| 04 | Detalle de producto | X | X | Abre desplazado 112 px: el sitio publicado aún no tiene la corrección **F2** |
| 05 | Agregar al carrito | ✓ | ✓ | |
| 06 | Carrito | ✓ | ✓ | |
| 07 | Quiénes somos y Contacto | ✓ | ✓ | |
| 08 | Registro: validación | ✓ | ✓ | |
| — | Sin desborde horizontal (escritorio y teléfono) | ✓ | ✓ | |

## 3. Diferencias y problemas encontrados

### Diferencias entre navegadores

| ID | Diferencia | Chrome (Brave) | Firefox | Estado |
|---|---|---|---|---|
| **D1** | Campo numérico (cantidad del producto y del carrito, precio y stock del admin) | Muestra las flechas solo al pasar el mouse | Muestra las flechas siempre y el número queda apretado | ✓ Corregido: `src/index.css` oculta las flechas en ambos; el valor se cambia escribiendo o con las flechas del teclado |
| **D2** | Imágenes guardadas como `http://127.0.0.1:8000/media/...` (Capuccino, Mocha, Macchiato en producción) | Las bloquea ("Permission was denied… `loopback` address space"), pero la imagen de respaldo alcanza a cargarse | Las bloquea (`NS_ERROR_LOCAL_NETWORK_ACCESS_DENIED`) sin avisar el error a la página, y la tarjeta de Mocha queda vacía con el texto "Mocha" | ✓ Corregido en el front local: `esImagenDeRedLocal` / `imagenSegura` en `src/productos.js` ni siquiera piden esas imágenes y usan la de respaldo. Se verá en producción al desplegar. ? Los datos siguen mal (ver **P2**) |
| **D3** | Selector de cantidad "− 1 +" de las tarjetas del catálogo (rediseño `f26de66`, ya publicado) | Se ve completo (contenedor de 102 px) | El contenedor mide 56 px y su `overflow: hidden` corta los botones "−" y "+"; solo se ve el número | X Sin corregir. Causa: Firefox calcula el ancho de los botones por su contenido y no por su `flex: 0 0 30px` (`.catalogo-cantidad` en `src/pages/Catalogo.css`) |

### Problemas funcionales (en ambos navegadores)

| ID | Problema | Estado |
|---|---|---|
| **F1** | En `/pago` la validación del carrito se repetía sin parar: 41 peticiones a `/api/carrito/validar/` en 3 s sin tocar nada (en Chrome y en Firefox), y después de crear el pedido llegaban como `400`. Causa: el efecto dependía de `usuario`, un objeto nuevo en cada render. | ✓ Corregido en `src/pages/Pago.jsx` (depende de `hayUsuario`). El recorrido verifica 0 validaciones extra |
| **F2** | Al cambiar de página se conservaba la posición del scroll: tras bajar en el catálogo, el detalle del producto abría 150 px más abajo (112 px en el sitio publicado). | ✓ Corregido en `src/App.jsx`: vuelve arriba al cambiar de ruta, con `behavior: 'instant'` porque Bootstrap activa el scroll suave |

## 4. Capturas (Chrome a la izquierda, Firefox a la derecha)

| Paso | Captura |
|---|---|
| Inicio | [01-inicio](capturas/01-inicio.jpg) |
| Catálogo | [02-catalogo](capturas/02-catalogo.jpg) |
| Tema oscuro | [03-tema-oscuro](capturas/03-tema-oscuro.jpg) |
| Detalle de producto (corregido) | [04-detalle-producto](capturas/04-detalle-producto.jpg) |
| Carrito | [05-carrito](capturas/05-carrito.jpg) |
| Datos de entrega | [06-datos-de-entrega](capturas/06-datos-de-entrega.jpg) |
| Orden pendiente de pago | [07-orden-pendiente-de-pago](capturas/07-orden-pendiente-de-pago.jpg) |
| Pasarela sandbox | [08-pasarela-sandbox](capturas/08-pasarela-sandbox.jpg) |
| Pago confirmado | [09-pago-confirmado](capturas/09-pago-confirmado.jpg) |
| Registro con validación | [10-registro-validacion](capturas/10-registro-validacion.jpg) |
| Admin: Usuarios | [11-admin-usuarios](capturas/11-admin-usuarios.jpg) |
| Admin: Incidencias | [12-admin-incidencias](capturas/12-admin-incidencias.jpg) |
| Admin: Correos | [13-admin-correos](capturas/13-admin-correos.jpg) |
| Teléfono: inicio, catálogo, carrito, registro | [inicio](capturas/movil-inicio.jpg) [catálogo](capturas/movil-catalogo.jpg) [carrito](capturas/movil-carrito.jpg) [registro](capturas/movil-registro.jpg) |
| **Antes** de corregir D1 y F2 | [antes-de-corregir](capturas/antes-de-corregir.jpg) |
| **D2** y **D3** en producción | [produccion-catalogo-d2-d3](capturas/produccion-catalogo-d2-d3.jpg) [ampliación del selector (D3)](capturas/produccion-d3-selector-cantidad-zoom.jpg) |
