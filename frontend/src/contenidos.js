import { createContext, useContext } from 'react'

export const ContenidosContext = createContext(null)
export const useContenidos = () => useContext(ContenidosContext)
