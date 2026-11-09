import { createContext, useContext } from "react"

/** Which demo agent this widget belongs to (set by DemoPage). Fast Follow: approved headsets. */
export const WidgetAgent = createContext<string | null>(null)
export const useWidgetAgent = () => useContext(WidgetAgent)
