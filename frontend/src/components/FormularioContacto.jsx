import { useState } from 'react'
import { enviarMensajeContacto } from '../services/contacto'

export default function FormularioContacto() {
    const [formulario, setFormulario] = useState({
        nombre: '',
        correo: '',
        mensaje: '',
    })

    const [errores, setErrores] = useState({})
    const [mensajeExito, setMensajeExito] = useState('')
    const [cargando, setCargando] = useState(false)

    // Actualiza los campos y limpia el error mientras el usuario tipea
    const manejarCambio = (e) => {
        const { name, value } = e.target
        setFormulario((prev) => ({ ...prev, [name]: value }))
        if (errores[name]) {
            setErrores((prev) => ({ ...prev, [name]: null }))
        }
    }

    const validarFormularioLocal = () => {
        const nuevosErrores = {}

        // Validar nombre: entre 2 y 100 caracteres
        const nombreLimpio = formulario.nombre.trim()
        if (!nombreLimpio || nombreLimpio.length < 2 || nombreLimpio.length > 100) {
            nuevosErrores.nombre = ['El nombre debe tener entre 2 y 100 caracteres.']
        }

        // Validar formato de correo electrónico
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!formulario.correo.trim() || !regexEmail.test(formulario.correo.trim())) {
            nuevosErrores.correo = ['El correo electrónico no tiene un formato válido.']
        }

        // Validar mensaje: entre 10 y 2.000 caracteres
        const mensajeLimpio = formulario.mensaje.trim()
        if (!mensajeLimpio || mensajeLimpio.length < 10 || mensajeLimpio.length > 2000) {
            nuevosErrores.mensaje = ['El mensaje debe tener entre 10 y 2.000 caracteres.']
        }

        return nuevosErrores
    }

    const manejarEnvio = async (e) => {
        e.preventDefault()
        setErrores({})
        setMensajeExito('')

        // 1. Validaciones locales inmediatas
        const erroresLocales = validarFormularioLocal()
        if (Object.keys(erroresLocales).length > 0) {
            setErrores(erroresLocales)
            return
        }

        setCargando(true)
        try {
            // 2. Envío al backend
            const respuesta = await enviarMensajeContacto(formulario)

            // 3. Confirmación SOLO cuando se haya almacenado correctamente
            setMensajeExito(respuesta.message || '¡Tu mensaje ha sido enviado y registrado con éxito!')

            // Limpiar el formulario tras el guardado exitoso
            setFormulario({ nombre: '', correo: '', mensaje: '' })
        } catch (error) {
            // Muestra errores por campo devueltos por el backend o error general
            if (error.erroresPorCampo && Object.keys(error.erroresPorCampo).length > 0) {
                setErrores(error.erroresPorCampo)
            } else {
                setErrores({ general: [error.message] })
            }
        } finally {
            setCargando(false)
        }
    }

    return (
        <section className="seccion-formulario-contacto" aria-labelledby="form-contacto-titulo">
            <h2 id="form-contacto-titulo">Envíanos un mensaje</h2>
            <p>Completa el formulario y nuestro equipo de cafetería te responderá a la brevedad.</p>

            {/* Alerta de confirmación de éxito */}
            {mensajeExito && (
                <div className="alerta-contacto-exito" role="status">
                    {mensajeExito}
                </div>
            )}

            {/* Alerta de error general del servidor si falla el almacenamiento */}
            {errores.general && (
                <div className="alerta-contacto-error" role="alert">
                    ⚠ {errores.general.join(' ')}
                </div>
            )}

            <form onSubmit={manejarEnvio} noValidate>
                {/* Campo Nombre */}
                <div className="campo-grupo">
                    <label htmlFor="contacto-nombre">Nombre completo *</label>
                    <input
                        id="contacto-nombre"
                        type="text"
                        name="nombre"
                        value={formulario.nombre}
                        onChange={manejarCambio}
                        placeholder="Ej: Nombre Apellido"
                        className={errores.nombre ? 'input-error' : ''}
                        disabled={cargando}
                    />
                    {errores.nombre && (
                        <span className="texto-error">{errores.nombre.join(' ')}</span>
                    )}
                </div>

                {/* Campo Correo */}
                <div className="campo-grupo">
                    <label htmlFor="contacto-correo">Correo electrónico *</label>
                    <input
                        id="contacto-correo"
                        type="email"
                        name="correo"
                        value={formulario.correo}
                        onChange={manejarCambio}
                        placeholder="Ej: usuario@cafe.cl"
                        className={errores.correo ? 'input-error' : ''}
                        disabled={cargando}
                    />
                    {errores.correo && (
                        <span className="texto-error">{errores.correo.join(' ')}</span>
                    )}
                </div>

                {/* Campo Mensaje */}
                <div className="campo-grupo">
                    <label htmlFor="contacto-mensaje">Mensaje (10 a 2.000 caracteres) *</label>
                    <textarea
                        id="contacto-mensaje"
                        name="mensaje"
                        rows="5"
                        value={formulario.mensaje}
                        onChange={manejarCambio}
                        placeholder="Escribe tu consulta, sugerencia o comentario aquí..."
                        className={errores.mensaje ? 'input-error' : ''}
                        disabled={cargando}
                    />
                    {errores.mensaje && (
                        <span className="texto-error">{errores.mensaje.join(' ')}</span>
                    )}
                </div>

                {/* Botón de Enviar */}
                <button type="submit" disabled={cargando} className="btn-contacto-enviar">
                    {cargando ? 'Enviando mensaje…' : 'Enviar mensaje'}
                </button>
            </form>
        </section>
    )
}