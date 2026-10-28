import { Wifi, Headphones, Mic, Video, Cpu, MemoryStick, HardDrive, AppWindow, type LucideIcon } from "lucide-react"
import type { ComponentId } from "@/data/widget"

/** Icon per monitored signal — shared by the Overview and section panes. */
export const componentIcon: Record<ComponentId, LucideIcon> = {
  wifi: Wifi,
  headphones: Headphones,
  microphone: Mic,
  camera: Video,
  cpu: Cpu,
  memory: MemoryStick,
  disk: HardDrive,
  platform: AppWindow,
}
