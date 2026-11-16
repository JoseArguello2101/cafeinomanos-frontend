import { API_URL } from '../api'

/**
 * Agrega un producto al carrito llamando al endpoint del backend.
 */
export async function agregarAlCarrito(productoId, cantidad = 1) {
    const sessionIdGuardado = localStorage.getItem('cart_session_id') || undefined
    const token = localStorage.getItem('token')

    try {
        const respuesta = await fetch(`${API_URL}/carrito/agregar/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Token ${token}` } : {}),
            },
            body: JSON.stringify({
                producto_id: Number(productoId),
                cantidad: Number(cantidad),
                session_id: sessionIdGuardado,
            }),
        })

        const resultado = await respuesta.json().catch(() => null)

        if (!respuesta.ok) {
            const errorDetalle =
                resultado?.errores?.cantidad?.[0] ||
                resultado?.errores?.producto_id?.[0] ||
                resultado?.message ||
                'No se pudo agregar el producto al carrito.'
            throw new Error(errorDetalle)
        }

        // Regla 3: Si el backend nos asigna una sesión anónima, la recordamos en el navegador
        if (resultado?.session_id) {
            localStorage.setItem('cart_session_id', resultado.session_id)
        }

        return resultado
    } catch (error) {
        throw error
    }
}