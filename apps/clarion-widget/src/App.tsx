import { AppShell } from "@/components/app/AppShell"

export default function App() {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <AppShell showDevNav routed />
    </div>
  )
}
