/**
 * Integrated Research (IR) mark — the supplied PNG. Dark bars for light mode,
 * white bars for dark mode (swapped via the `.dark` class on <html>).
 */
export function IRLogo({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <>
      <img src={`${import.meta.env.BASE_URL}ir-logo.png`} alt="Integrated Research" className={`${className} dark:hidden`} />
      <img src={`${import.meta.env.BASE_URL}ir-logo-white.png`} alt="" aria-hidden className={`${className} hidden dark:block`} />
    </>
  )
}
