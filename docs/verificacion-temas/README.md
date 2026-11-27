# Verificación de los cuatro temas: lista de comprobación

## Cómo se registró

1. Cada tema se cambió desde **Admin › Apariencia** en la versión desplegada (`https://cafeinomanos.vercel.app`) y se anotó en una tabla con el resultado en cada navegador. Se marcó con **✓** si funciona, **X** si falla y **?** si funciona pero tiene errores u observaciones.
2. El contraste se revisó con axe-core (regla `color-contrast`, WCAG AA: 4,5:1 para texto normal) en las 9 páginas públicas: inicio, catálogo, detalle de producto, carrito, iniciar sesión, registro, contacto, quiénes somos y página no encontrada.
3. "Otro navegador" se comprobó con Chrome (Brave 158) y Firefox 160 sin sesión iniciada ni tema personal: solo podían ver el tema guardado en el servidor.
4. Se evidenció con capturas: una hoja por tema y navegador con las 9 páginas.

## 1. Resultado por tema (versión desplegada)

| Tema | Cambio desde el admin | Se mantiene al recargar | Chrome (Brave) lo ve | Firefox lo ve | Contraste Chrome | Contraste Firefox |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Claro | ✓ | ✓ | ✓ | ✓ | ✓ 0 fallas | ✓ 0 fallas |
| Oscuro | ✓ | ✓ | ✓ | ✓ | ✓ 0 fallas | ✓ 0 fallas |
| Vintage | ✓ | ✓ | ✓ | ✓ | ✓ 0 fallas | ✓ 0 fallas |
| Pastel | ✓ | ✓ | ✓ | ✓ | ✓ 0 fallas | ✓ 0 fallas |

Al terminar, el tema del sitio se dejó en **Claro**, como estaba antes de la prueba.

## 2. Contrastes corregidos

| Problema | Temas | Antes | Corrección |
|---|---|:-:|---|
| Texto gris sobre fondo beige en Contacto y Quiénes somos | Claro, Vintage, Pastel | 3,86–4,37:1 | `PaginasContenido.css`: el texto usa `--ink` |
| Subtítulo de Registro con `.text-muted` de Bootstrap | Oscuro | 1,07:1 | `index.css`: `.text-muted` usa el gris del tema (`--muted`) |
| Botón "Registrar" del navbar | Pastel | 4,25:1 | `Navbar.css`: lila más oscuro `#7a5c8c` (5,62:1) |

## 3. Funcionamiento del tema

| Comprobación | Resultado |
|---|:-:|
| El administrador elige el tema en Admin › Apariencia y se guarda en el servidor (`PUT /api/tema/`) | ✓ |
| Los visitantes cargan el tema del servidor (`GET /api/tema/`) | ✓ |
| El menú "Temas" del navbar guarda un tema personal solo en ese navegador | ✓ |
| La opción "Tema del sitio" del navbar vuelve al tema global | ✓ |
| El tema personal de un navegador no afecta a otro | ✓ |

## 4. Observaciones

| Observación | Estado |
|---|:-:|
| Capuccino, Mocha y Macchiato muestran "Imagen no disponible" en producción porque sus imágenes siguen guardadas con `127.0.0.1` (ver **P2** en la verificación de compatibilidad) | ? |
| En Firefox el selector de cantidad del catálogo queda cortado en los cuatro temas (ver **D3** en la verificación de compatibilidad) | ? |
| axe-core no evalúa texto escrito sobre imágenes; esos casos se revisaron en las capturas | ✓ |

## 5. Capturas (versión desplegada)

| Tema | Chrome (Brave) | Firefox |
|---|---|---|
| Claro | [claro-brave](capturas/claro-brave.jpg) | [claro-firefox](capturas/claro-firefox.jpg) |
| Oscuro | [oscuro-brave](capturas/oscuro-brave.jpg) | [oscuro-firefox](capturas/oscuro-firefox.jpg) |
| Vintage | [vintage-brave](capturas/vintage-brave.jpg) | [vintage-firefox](capturas/vintage-firefox.jpg) |
| Pastel | [pastel-brave](capturas/pastel-brave.jpg) | [pastel-firefox](capturas/pastel-firefox.jpg) |
