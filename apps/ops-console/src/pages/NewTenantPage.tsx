import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import {
  Button, Card, CardContent, CardDescription, CardHeader, CardHeaderText, CardTitle, Checkbox,
  Field, FieldControl, FieldDescription, FieldError, FieldLabel, FieldOption, Input, TagsInput,
} from "@ir/ui"
import { PageTop } from "@/components/PageTop"
import { ChoiceSelect, Link } from "@/components/ui"
import { toast } from "@/lib/toast"
import { navigate } from "@/lib/router"
import { domainOk, emailOk, newTenantId } from "@/lib/format"
import { regions } from "@/data/catalog"
import { createTenant, useOps } from "@/data/store"
import type { Tenant } from "@/data/tenants"

interface Person { firstName: string; lastName: string; email: string }
const blank: Person = { firstName: "", lastName: "", email: "" }

/**
 * Provision new tenancy — the live form, field for field: company, client
 * account contact (optional, from the sales contract), region and email
 * domains, and the first client admin, who is created in Cognito and invited.
 */
export function NewTenantPage() {
  const tenants = useOps((s) => s.tenants)
  const [company, setCompany] = useState("")
  const [code, setCode] = useState("")
  const [contact, setContact] = useState<Person>(blank)
  const [region, setRegion] = useState("ap-southeast-2")
  const [domains, setDomains] = useState<string[]>([])
  const [sameAsContact, setSame] = useState(false)
  const [adminP, setAdmin] = useState<Person>(blank)
  const [tried, setTried] = useState(false)
  const [busy, setBusy] = useState(false)

  const admin = sameAsContact ? contact : adminP
  const contactStarted = !!(contact.firstName || contact.lastName || contact.email)
  const takenCode = tenants.some((t) => t.accountCode.toLowerCase() === code.trim().toLowerCase() && t.status !== "cancelled")
  const takenDomain = domains.find((d) => tenants.some((t) => t.status !== "cancelled" && t.domains.includes(d.toLowerCase())))

  const errors = {
    company: !company.trim() ? "Enter the company name." : undefined,
    code: !code.trim() ? "Enter the account code from the sales contract." : takenCode ? "Another active tenant already uses this account code." : undefined,
    contactEmail: contactStarted && !emailOk(contact.email) ? "Enter a valid email address, or clear the contact." : undefined,
    domains: !domains.length ? "Add at least one email domain." : takenDomain ? `${takenDomain} already belongs to another tenant.` : undefined,
    adminFirst: !admin.firstName.trim() ? "Enter a first name." : undefined,
    adminLast: !admin.lastName.trim() ? "Enter a last name." : undefined,
    adminEmail: !emailOk(admin.email) ? "Enter a valid email address." : undefined,
  }
  const show = (k: keyof typeof errors) => (tried ? errors[k] : undefined)
  const valid = Object.values(errors).every((e) => !e)

  const submit = () => {
    setTried(true)
    if (!valid) {
      toast({ title: "Check the form", description: "Some fields need attention before the tenant can be created.", variant: "danger" })
      return
    }
    setBusy(true)
    window.setTimeout(() => {
      const id = newTenantId()
      const now = new Date().toISOString()
      const t: Tenant = {
        id, name: company.trim(), accountCode: code.trim(),
        contact: contactStarted ? { ...contact } : undefined,
        domains: domains.map((d) => d.toLowerCase()), region, created: now, status: "active",
        subscriptions: [],
        admins: [{ id: `new-${id}`, name: `${admin.firstName.trim()} ${admin.lastName.trim()}`, email: admin.email.trim(), status: "invited", lastLogin: null, invited: now }],
        overrides: {},
      }
      createTenant(t)
      toast({ title: `${t.name} created`, description: `Invite sent to ${admin.email.trim()}. Next, provision a product.` })
      navigate(`/tenants/${id}`)
    }, 900)
  }

  return (
    <div className="flex flex-col gap-gutter">
      <div>
        <Button variant="link" asChild><Link to="/tenants"><ArrowLeft aria-hidden /> Back to tenants</Link></Button>
      </div>
      <PageTop title="Provision new tenancy" description="Creates the tenancy, its sign-in page and its first client admin. Products are added afterwards, on the tenant's Products tab." />

      <form
        noValidate
        className="flex flex-col gap-gutter"
        onSubmit={(e) => { e.preventDefault(); submit() }}
      >
        <Card>
          <CardHeader><CardHeaderText><CardTitle>Company</CardTitle></CardHeaderText></CardHeader>
          <CardContent className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field invalid={!!show("company")}>
                <FieldLabel required>Company name</FieldLabel>
                <FieldControl required><Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Corporation" /></FieldControl>
                {show("company") ? <FieldError>{show("company")}</FieldError> : null}
              </Field>
              <Field invalid={!!show("code")}>
                <FieldLabel required help="The IR customer ID on the sales contract. Shown as IR Customer ID on the tenant.">Account code</FieldLabel>
                <FieldControl required><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. IR-1042" /></FieldControl>
                {show("code") ? <FieldError>{show("code")}</FieldError> : null}
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardHeaderText>
              <CardTitle>Client account contact <span className="text-body-md text-content-neutral-muted">(optional)</span></CardTitle>
              <CardDescription>For client communications only, taken from the sales contract. This person isn't given access.</CardDescription>
            </CardHeaderText>
          </CardHeader>
          <CardContent className="gap-4">
            <PersonFields value={contact} onChange={setContact} errors={{ email: show("contactEmail") }} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardHeaderText><CardTitle>Tenancy</CardTitle></CardHeaderText></CardHeader>
          <CardContent className="gap-4">
            <Field>
              <FieldLabel>AWS region</FieldLabel>
              <FieldControl>
                <ChoiceSelect value={region} onChange={setRegion} options={regions.map((r) => ({ value: r.id, label: `${r.label} (${r.id})`, disabled: r.id !== "ap-southeast-2" }))} />
              </FieldControl>
              <FieldDescription>Only Sydney is deployed in the dev stage.</FieldDescription>
            </Field>
            <Field invalid={!!show("domains")}>
              <FieldLabel required>Email domains</FieldLabel>
              <FieldControl required>
                <TagsInput value={domains} onValueChange={(v) => setDomains(v.map((d) => d.toLowerCase()))} validate={domainOk} placeholder="acme.com, then Enter" />
              </FieldControl>
              {show("domains") ? <FieldError>{show("domains")}</FieldError> : (
                <FieldDescription>People signing in with these domains land on this tenant. Press Enter or comma after each.</FieldDescription>
              )}
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardHeaderText>
              <CardTitle>Administrator</CardTitle>
              <CardDescription>Invited as the first client admin and created as a user in Cognito. They can invite the rest.</CardDescription>
            </CardHeaderText>
          </CardHeader>
          <CardContent className="gap-4">
            <FieldOption
              control={<Checkbox checked={sameAsContact} onCheckedChange={(c) => setSame(c === true)} />}
              disabled={!contactStarted}
              description={!contactStarted ? "Add a client account contact first." : undefined}
            >
              Use the same details as the client account contact
            </FieldOption>
            <PersonFields
              value={admin}
              onChange={setAdmin}
              disabled={sameAsContact}
              required
              errors={{ firstName: show("adminFirst"), lastName: show("adminLast"), email: show("adminEmail") }}
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2 border-t border-line-neutral-muted pt-4">
          <Button variant="outline" asChild><Link to="/tenants">Cancel</Link></Button>
          <Button type="submit" loading={busy}>Create tenant</Button>
        </div>
      </form>
    </div>
  )
}

function PersonFields({ value, onChange, errors = {}, disabled, required }: {
  value: Person
  onChange: (p: Person) => void
  errors?: Partial<Record<keyof Person, string | undefined>>
  disabled?: boolean
  required?: boolean
}) {
  const field = (key: keyof Person, label: string, placeholder: string, type = "text") => (
    <Field invalid={!!errors[key]} disabled={disabled}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <FieldControl required={required}>
        <Input type={type} value={value[key]} onChange={(e) => onChange({ ...value, [key]: e.target.value })} placeholder={placeholder} />
      </FieldControl>
      {errors[key] ? <FieldError>{errors[key]}</FieldError> : null}
    </Field>
  )
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {field("firstName", "First name", "Enter first name")}
        {field("lastName", "Last name", "Enter last name")}
      </div>
      {field("email", "Email address", "name@company.com", "email")}
    </>
  )
}
