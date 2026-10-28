import { useState } from "react"
import { Badge, Button, FileUpload, FileUploadItem } from "@ir/ui"
import { Callout, Rich } from "./parts"

/**
 * Upload a SAML signing certificate file (Base64 / PEM) instead of pasting it.
 * Used when entering an identity provider's details by hand, and to replace a
 * certificate before the current one expires.
 *
 * The prototype doesn't decode X.509, so "issued to" and the expiry are
 * sample values. It does check the file is the right kind: Base64 text, not
 * Entra's "Certificate (Raw)" download or the metadata XML.
 */
export interface CertInfo {
  name: string
  size: number
  subject: string
  expires: string
  text: string
}

export const EXAMPLE_CERT =
  "-----BEGIN CERTIFICATE-----\nMIIC8DCCAdigAwIBAgIQd4kKq3tX2ZxP7r…\n-----END CERTIFICATE-----"

type Read = { ok: true; text: string } | { ok: false; title: string; body: string }

async function readCertificate(file: File): Promise<Read> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const text = new TextDecoder().decode(bytes)
  if (text.includes("BEGIN CERTIFICATE")) return { ok: true, text: text.trim() }
  if (text.includes("EntityDescriptor")) {
    return { ok: false, title: "This is the metadata file, not the certificate.", body: "Switch to **Upload file** above. The metadata file fills in everything at once." }
  }
  if (bytes[0] === 0x30) {
    return { ok: false, title: "This is the Raw certificate.", body: "Iris needs the Base64 version. In Entra, download **Certificate (Base64)** instead." }
  }
  return { ok: false, title: "This isn't a certificate file.", body: "Choose a .cer, .pem or .crt file that starts with **-----BEGIN CERTIFICATE-----**." }
}

export function CertificateUpload({
  value,
  onChange,
  subject,
  expires = "14 Mar 2029",
  fileName = "certificate.cer",
  where,
}: {
  value: CertInfo | null
  onChange: (cert: CertInfo | null) => void
  /** Who the certificate is issued to, as the provider names it. */
  subject: string
  expires?: string
  /** The name the provider gives its download, used by the example. */
  fileName?: string
  /** Where to find the download, in the provider's own words. */
  where?: string
}) {
  const [error, setError] = useState<{ title: string; body: string } | null>(null)

  const pick = async (file: File) => {
    const r = await readCertificate(file)
    if (!r.ok) { setError(r); onChange(null); return }
    setError(null)
    onChange({ name: file.name, size: file.size, subject, expires, text: r.text })
  }

  const useExample = () => {
    setError(null)
    onChange({ name: fileName, size: 1672, subject, expires, text: EXAMPLE_CERT })
  }

  return (
    <div className="flex flex-col gap-2">
      {value ? (
        <>
          <FileUploadItem name={value.name} size={value.size} onRemove={() => onChange(null)} />
          <span className="flex flex-wrap items-center gap-2 text-body-sm text-content-neutral-muted">
            Issued to {value.subject} · valid until {value.expires}
            <Badge color="success" dot>Valid</Badge>
          </span>
        </>
      ) : (
        <FileUpload
          accept=".cer,.pem,.crt,application/x-x509-ca-cert,application/x-pem-file"
          placeholder="Choose a .cer, .pem or .crt file"
          onFilesChange={(fs) => fs[0] && pick(fs[0])}
        />
      )}
      {error && <Callout tone="destructive" title={error.title}><Rich text={error.body} /></Callout>}
      {!value && (
        <span className="text-body-xs text-content-neutral-muted">
          {where && <><Rich text={where} />. </>}
          No file to hand?{" "}
          <Button variant="link" size="xs" className="h-auto p-0" onClick={useExample}>Use the example certificate</Button>
        </span>
      )}
    </div>
  )
}
