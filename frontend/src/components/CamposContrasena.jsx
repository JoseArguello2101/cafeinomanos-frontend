import { useState } from 'react'
import { obtenerRequisitosContrasena } from '../utils/contrasena'

/**
 * Par de campos (contraseña + confirmación) con botón Mostrar/Ocultar
 * e indicador accesible de requisitos.
 */
export default function CamposContrasena({
    password,
    confirmar,
    onPasswordChange,
    onConfirmarChange,
    errores = {},
    disabled = false,
}) {
    const [mostrar, setMostrar] = useState(false)
    const requisitos = obtenerRequisitosContrasena(password)

    return (
        <>
            <div className="mb-3">
                <label htmlFor="password" className="form-label">Contraseña</label>
                <div className="input-group has-validation">
                    <input
                        id="password"
                        name="password"
                        type={mostrar ? 'text' : 'password'}
                        autoComplete="new-password"
                        disabled={disabled}
                        aria-describedby="requisitos-password"
                        aria-invalid={Boolean(errores.password)}
                        className={`form-control ${errores.password ? 'is-invalid' : ''}`}
                        value={password}
                        onChange={e => onPasswordChange(e.target.value)}
                    />
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        disabled={disabled}
                        onClick={() => setMostrar(actual => !actual)}
                        aria-pressed={mostrar}
                    >
                        {mostrar ? 'Ocultar' : 'Mostrar'}
                    </button>
                    {errores.password && <div className="invalid-feedback">{errores.password}</div>}
                </div>
                <ul id="requisitos-password" className="list-unstyled small mt-2 mb-0">
                    {requisitos.map(req => (
                        <li key={req.texto} className={req.cumple ? 'text-success' : 'text-muted'}>
                            <span aria-hidden="true">{req.cumple ? '✓' : '•'}</span> {req.texto}
                            <span className="visually-hidden">{req.cumple ? ' (cumplido)' : ' (pendiente)'}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="mb-4">
                <label htmlFor="confirmar" className="form-label">Confirmar contraseña</label>
                <input
                    id="confirmar"
                    name="confirmar"
                    type={mostrar ? 'text' : 'password'}
                    autoComplete="new-password"
                    disabled={disabled}
                    aria-invalid={Boolean(errores.confirmar)}
                    className={`form-control ${errores.confirmar ? 'is-invalid' : ''}`}
                    value={confirmar}
                    onChange={e => onConfirmarChange(e.target.value)}
                />
                {errores.confirmar && <div className="invalid-feedback">{errores.confirmar}</div>}
            </div>
        </>
    )
}