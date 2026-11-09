import { useEffect, useState, type ReactNode } from "react"
import * as Dialog from "@radix-ui/react-dialog"

const MOBILE_QUERY = "(max-width: 767.98px)"

/** True below md (768). Updates live when the window crosses the breakpoint. */
export function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches)
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const on = () => setMobile(mq.matches)
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return mobile
}

/**
 * Phones only: the navigation opens full screen over the page (rather than a
 * column that squeezes it) and the Sidebar draws a collapse button. Built on
 * Radix Dialog: Esc closes it, focus is trapped while open and returns to the
 * menu button when it closes. Picking a page closes it too (App).
 */
export function MobileNav({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Content
          aria-describedby={undefined}
          data-ff-offset="" className="fixed inset-x-0 bottom-0 z-[90] flex w-full outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-left data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left"
        >
          <Dialog.Title className="sr-only">Navigation</Dialog.Title>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
