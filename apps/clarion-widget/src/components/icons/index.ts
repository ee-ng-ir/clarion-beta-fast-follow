import { Wifi, Headphones, Mic, Video, Cpu, MemoryStick, HardDrive, AppWindow, LayoutDashboard, MonitorPlay, Headset } from "lucide-react"
import { makeMotionIcon, type AnimatedIconHandle, type AnimatedIconProps } from "./MotionIcon"
import type { ComponentId } from "@/data/widget"
import type { PageId } from "@/nav"

export type { AnimatedIconHandle } from "./MotionIcon"

/** Common shape every animated icon honours: size + div props, with a start/stop handle. */
export type AnimatedIcon = React.ForwardRefExoticComponent<
  AnimatedIconProps & React.RefAttributes<AnimatedIconHandle>
>

// Every icon shares the same "press" micro-interaction (motion-icons-react style).
const WifiIcon = makeMotionIcon(Wifi)
const HeadphonesIcon = makeMotionIcon(Headphones)
const MicIcon = makeMotionIcon(Mic)
const VideoIcon = makeMotionIcon(Video)
const CpuIcon = makeMotionIcon(Cpu)
const MemoryStickIcon = makeMotionIcon(MemoryStick)
const HardDriveIcon = makeMotionIcon(HardDrive)
const AppWindowIcon = makeMotionIcon(AppWindow)
const HeadsetIcon = makeMotionIcon(Headset)
const LayoutDashboardIcon = makeMotionIcon(LayoutDashboard)
const MonitorPlayIcon = makeMotionIcon(MonitorPlay)

/** Per-telemetry-component animated icon (matches the static componentIcon map). */
export const animatedComponentIcon: Record<ComponentId, AnimatedIcon> = {
  wifi: WifiIcon,
  headphones: HeadphonesIcon,
  microphone: MicIcon,
  camera: VideoIcon,
  cpu: CpuIcon,
  memory: MemoryStickIcon,
  disk: HardDriveIcon,
  platform: AppWindowIcon,
}

/** Per-nav-section animated icon (matches the rail's NavItem icons). */
export const animatedNavIcon: Record<PageId, AnimatedIcon> = {
  overview: LayoutDashboardIcon,
  devices: HeadsetIcon,
  network: WifiIcon,
  system: CpuIcon,
  platform: AppWindowIcon,
  demo: MonitorPlayIcon,
}
