import { useEffect, useState } from "react"
import { Send } from "lucide-react"
import {
  Alert, AlertDescription, AlertTitle, Button,
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Field, FieldControl, FieldDescription, FieldError, FieldLabel, Input, Textarea,
} from "@ir/ui"
import { currentUser } from "@/components/dashboard/ExperienceMenu"
import { INVITE_DAYS, newInviteId, type SetupInvite } from "@/data/ssoDelegate"
import type { SsoDraft } from "./SsoWizard"

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Hand SSO setup to whoever manages staff sign-in. They get a single-purpose,
 * expiring link: they can connect and test, but only an Admin turns SSO on.
 */
export function SendSetupLinkDialog({
  open,
  onOpenChange,
  draft,
  onSent,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Setup so far, so IT carries on from where the Admin stopped. */
  draft: SsoDraft
  onSent: (invite: SetupInvite) => void
}) {
  const [email, setEmail] = useState("")
  const [note, setNote] = useState("")
  const [touched, setTouched] = useState(false)

  useEffect(() => { if (open) { setEmail(""); setNote(""); setTouched(false) } }, [open])

  const valid = emailRe.test(email.trim())
  const error = touched && !valid ? "Enter a valid email address." : null

  const send = () => {
    setTouched(true)
    if (!valid) return
    const now = Date.now()
    onSent({
      id: newInviteId(),
      email: email.trim(),
      note: note.trim(),
      from: { name: currentUser.name, email: currentUser.email },
      sentAt: now,
      expiresAt: now + INVITE_DAYS * 24 * 60 * 60 * 1000,
      status: "sent",
      draft,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Send setup link</DialogTitle>
          <DialogDescription>For whoever manages your staff sign-in, usually IT.</DialogDescription>
        </DialogHeader>

        <DialogBody className="gap-5">
          <Field invalid={!!error}>
            <FieldLabel required>Their email</FieldLabel>
            <FieldControl required>
              <Input type="email" placeholder="it@yourcompany.com" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched(true)} autoFocus />
            </FieldControl>
            <FieldError>{error}</FieldError>
          </Field>

          <Field>
            <FieldLabel>Note</FieldLabel>
            <FieldControl>
              <Textarea rows={3} placeholder="We use Entra ID. Can you connect it to Iris?" value={note} onChange={(e) => setNote(e.target.value)} />
            </FieldControl>
            <FieldDescription>Optional. Shown on the page they open.</FieldDescription>
          </Field>

          <Alert variant="info">
            <AlertTitle>They can connect and test. You turn it on.</AlertTitle>
            <AlertDescription>
              They confirm their email with a code, then see only SSO setup, not Members or Clarion. When the test passes, it comes back to you. The link works once and expires in {INVITE_DAYS} days.
            </AlertDescription>
          </Alert>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={send} disabled={touched && !valid}><Send aria-hidden /> Send link</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
