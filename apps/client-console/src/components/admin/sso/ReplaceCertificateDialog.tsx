import { useEffect, useState } from "react"
import {
  Alert, AlertDescription, AlertTitle, Button,
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@ir/ui"
import { providerById, type ProviderId } from "@/data/sso"
import { CertificateUpload, type CertInfo } from "./CertificateUpload"

/**
 * Replace the signing certificate for a connection set up from a file or by
 * hand. (A metadata link picks up new certificates by itself, so it never
 * needs this.)
 */
export function ReplaceCertificateDialog({
  open,
  onOpenChange,
  providerId,
  onReplaced,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  providerId: ProviderId
  onReplaced: (cert: CertInfo) => void
}) {
  const p = providerById(providerId)
  const meta = p.cert ?? { fileName: "certificate.cer", where: "", subject: `${p.name} signing certificate` }
  const [cert, setCert] = useState<CertInfo | null>(null)

  useEffect(() => { if (open) setCert(null) }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Replace signing certificate</DialogTitle>
          <DialogDescription>Upload the new certificate from {p.short} before the current one expires.</DialogDescription>
        </DialogHeader>

        <DialogBody className="gap-5">
          <Alert variant="info">
            <AlertTitle>Sign-in keeps working while you switch</AlertTitle>
            <AlertDescription>
              In {p.short}, create the new certificate but leave it inactive. Upload it here, then make it active in {p.short}. Iris trusts both until the old one expires.
            </AlertDescription>
          </Alert>
          <CertificateUpload
            value={cert}
            onChange={setCert}
            subject={meta.subject}
            fileName={meta.fileName}
            where={meta.where || undefined}
            expires="12 Oct 2029"
          />
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!cert} onClick={() => { if (cert) { onReplaced(cert); onOpenChange(false) } }}>Save certificate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
