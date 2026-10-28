// Single sign-on (SSO) — prototype data.
//
// One wizard drives every provider. Everything that differs per provider
// (field names, where to click, how details come back, how groups arrive)
// lives here, so adding a provider is a data change, not a new screen.
//
// Strings may contain **bold** spans; the UI renders them with <Rich>.

import { users } from "@ir/mock-data/users"

export type ProviderId = "entra" | "okta" | "google" | "ping" | "saml" | "oidc"
export type Protocol = "SAML 2.0" | "OIDC"
export type ConnectMethod = "url" | "file" | "manual"
/** How a provider sends groups, which decides the group-mapping UI in step 5. */
export type GroupMode = "ids" | "names" | "limited" | "values"

export interface SpField {
  /** The provider's own label for the field. */
  label: string
  /** Iris's name for the same thing, shown small beside it. */
  irisName?: string
  /** Other names providers use (generic providers only). */
  aka?: string
  value: string
}

export interface Tip { title: string; body: string }

export interface ProviderDef {
  id: ProviderId
  name: string
  /** Name used in sentences ("Add Iris to {short}"). */
  short: string
  protocol: Protocol
  blurb: string
  generic?: boolean
  mostCommon?: boolean

  // Step 3 — add Iris to the provider
  addIntro: string
  addSteps: string[]
  addStepsAfter?: string[]
  spFields: SpField[]
  /** Fixed settings shown under the fields (e.g. Name ID format). */
  spSettings?: [string, string][]
  /** A table of things to set up in the provider (attribute statements etc). */
  addTable?: { intro: string; head: [string, string]; rows: [string, string, string?][]; foot?: string }
  addCallout?: { tone: "warning" | "info"; title: string; body: string }
  /** Offer Iris's own metadata as a link/file (generic SAML). */
  offerSpMetadata?: boolean
  addConfirm: string
  addTip: Tip

  // Step 4 — connect the provider to Iris
  connectDefault: ConnectMethod | "oidc"
  connectMethods: ConnectMethod[]
  urlLabel?: string
  urlWhere?: string
  urlExample?: string
  fileName?: string
  /** Where the metadata file download is, in the provider's words. */
  fileWhere?: string
  /** The certificate-only download (Enter manually / Replace certificate). */
  cert?: { fileName: string; where: string; subject: string }
  /** What Iris reads back, labelled the way the provider labels it. */
  parsed: [string, string][]
  connectErrors: { tone: "danger" | "warning"; title: string; body: string }[]
  connectTip: Tip

  // Step 5 — map user details
  mapIntro: string
  mapColumn: string
  mapBadge: string
  attributes: { email: string; firstName: string; lastName: string; groups?: string }
  groupMode: GroupMode
  groupIntro: string
  groupExamples: { value: string; label?: string; role: "admin" | "manager" }[]
  mapTip: Tip
}

/**
 * Each customer signs in at login.ir.com/<tenant_id>, a random ID (unlike Slack, which uses acme.slack.com).
 * That address tells Iris which customer someone belongs to, so there is no email
 * domain to verify. The /saml and /oidc paths below are placeholders until
 * engineering confirms them.
 */
export const tenantId = "t8x4kq2m9vzr" // placeholder: a random ID, not the company name
export const signInPage = `https://login.ir.com/${tenantId}`

/**
 * Acme's *Microsoft* tenant ID — made by Microsoft, identifies Acme's Entra
 * directory. Unrelated to Iris's tenantId above; it only appears in the values
 * Iris reads back from Entra.
 */
const ENTRA_TENANT = "3d9f6a2e-58c1-4b7e-a0d4-c62e19b7f851"
const ENTRA_APP = "b41e07c9-2f6d-4a83-9e15-7d0c3a68f2b4"
const ENTITY = `${signInPage}/saml`
const ACS = `${signInPage}/saml/acs`
const REDIRECT = `${signInPage}/oidc/callback`

export const providers: ProviderDef[] = [
  {
    id: "entra",
    name: "Microsoft Entra ID",
    short: "Entra ID",
    protocol: "SAML 2.0",
    blurb: "Formerly Azure AD",
    mostCommon: true,
    addIntro: "In the Entra admin center, create an app for Iris, then paste in the three values below.",
    addSteps: [
      "Go to **Enterprise applications** → **New application** → **Create your own application**.",
      "Name it **Iris** and choose **Integrate any other application you don't find in the gallery**.",
      "Open **Single sign-on** → **SAML**, then edit **Basic SAML Configuration**.",
      "Paste these values into the fields with the same names:",
    ],
    spFields: [
      { label: "Identifier (Entity ID)", irisName: "Iris's Entity ID", value: ENTITY },
      { label: "Reply URL (Assertion Consumer Service URL)", irisName: "Iris's ACS URL", value: ACS },
      { label: "Sign on URL", irisName: "Your Iris sign-in page", value: signInPage },
    ],
    spSettings: [["Relay State", "Leave empty"]],
    addCallout: {
      tone: "info",
      title: "User details: no changes needed",
      body: "Entra sends email and name by default. To set roles from Entra groups, also add a group claim under **Attributes & Claims**.",
    },
    addConfirm: "I've added these values in Entra ID",
    addTip: { title: "You'll need", body: "An Entra role that can create enterprise apps, such as Application Administrator." },
    connectDefault: "url",
    connectMethods: ["url", "file", "manual"],
    urlLabel: "App Federation Metadata Url",
    urlWhere: "In Entra: the Iris app → **Single sign-on** → **SAML Certificates**",
    urlExample: `https://login.microsoftonline.com/${ENTRA_TENANT}/federationmetadata/2007-06/federationmetadata.xml?appid=${ENTRA_APP}`,
    fileName: "Iris.xml",
    fileWhere: "In Entra: the Iris app → **Single sign-on** → **SAML Certificates** → **Federation Metadata XML** → **Download**",
    cert: {
      fileName: "Iris.cer",
      where: "In Entra: the Iris app → **Single sign-on** → **SAML Certificates** → **Certificate (Base64)** → **Download**",
      subject: "Microsoft Azure Federated SSO Certificate",
    },
    parsed: [
      ["Login URL", `https://login.microsoftonline.com/${ENTRA_TENANT}/saml2`],
      ["Microsoft Entra Identifier", `https://sts.windows.net/${ENTRA_TENANT}/`],
    ],
    connectErrors: [
      { tone: "danger", title: "We couldn't open this link.", body: "Check you copied the whole App Federation Metadata Url, including the part after **?appid=**." },
      { tone: "danger", title: "This link is for a different Entra app.", body: "Its Identifier doesn't match Iris's Entity ID. Recheck step 3." },
    ],
    connectTip: { title: "Why a link beats a file", body: "When Entra rotates its certificate, Iris picks up the new one from the link. With a file, someone has to upload it again." },
    mapIntro: "We've filled in Entra's standard names. Only change them if your team has customised its claims.",
    mapColumn: "Attribute Entra sends",
    mapBadge: "Entra default",
    attributes: {
      email: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
      firstName: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
      lastName: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname",
      groups: "http://schemas.microsoft.com/ws/2008/06/identity/claims/groups",
    },
    groupMode: "ids",
    groupIntro: "Entra sends groups as Object IDs, not names. Paste each group's Object ID from Entra and name it so you'll recognise it later.",
    groupExamples: [
      { value: "3f2a9c1e-7b4d-4e0a-9c55-1d2e8f6a0b13", label: "Clarion Admins", role: "admin" },
      { value: "b81d04c7-25e9-4f3a-8a61-6c0f9e2d7a48", label: "Contact centre managers", role: "manager" },
    ],
    mapTip: { title: "Where's the Object ID?", body: "In Entra, open **Groups**, choose the group, and copy **Object ID** from its overview. Entra leaves groups out for anyone in more than 150, so assign only Clarion's groups to the Iris app." },
  },
  {
    id: "okta",
    name: "Okta",
    short: "Okta",
    protocol: "SAML 2.0",
    blurb: "Workforce Identity",
    addIntro: "In the Okta Admin Console, create a SAML app for Iris, paste in two values, then tell Okta which user details to send.",
    addSteps: [
      "Go to **Applications** → **Create App Integration** → **SAML 2.0**, and name it **Iris**.",
      "On **Configure SAML**, paste these values:",
    ],
    spFields: [
      { label: "Single sign-on URL", irisName: "Iris's ACS URL", value: ACS },
      { label: "Audience URI (SP Entity ID)", irisName: "Iris's Entity ID", value: ENTITY },
    ],
    spSettings: [["Name ID format", "EmailAddress"], ["Application username", "Email"]],
    addTable: {
      intro: "Under **Attribute Statements**, add these. Okta sends nothing extra until you do.",
      head: ["Name", "Value"],
      rows: [["email", "user.email", "Required"], ["firstName", "user.firstName"], ["lastName", "user.lastName"]],
      foot: "Optional: to set roles from Okta groups, add a **Group Attribute Statement** named **groups**, filtered to the groups you want Iris to see.",
    },
    addConfirm: "I've added these in Okta",
    addTip: { title: "Before you leave Okta", body: "Assign the app to the people or groups who use Clarion, or they won't be able to sign in." },
    connectDefault: "url",
    connectMethods: ["url", "file", "manual"],
    urlLabel: "Metadata URL",
    urlWhere: "In Okta: the Iris app → **Sign On** tab → **Metadata URL** → Copy",
    urlExample: "https://acme.okta.com/app/exk9a2…/sso/saml/metadata",
    parsed: [
      ["Identity Provider Single Sign-On URL", "https://acme.okta.com/app/acme_iris_1/exk9a2…/sso/saml"],
      ["Identity Provider Issuer", "http://www.okta.com/exk9a2…"],
    ],
    connectErrors: [
      { tone: "danger", title: "We couldn't open this link.", body: "Copy it again from the app's **Sign On** tab, not from your browser's address bar." },
      { tone: "warning", title: "The certificate expires in 12 days.", body: "You can continue. Okta will need a new certificate soon, and Iris will pick it up from this link." },
    ],
    connectTip: { title: "Can't see a Metadata URL?", body: "Older Okta screens show **View SAML setup instructions** instead. Switch to **Enter manually** and copy the three values from there." },
    mapIntro: "These match the attribute statements from step 3. If you named them differently in Okta, change them here.",
    mapColumn: "Okta attribute name",
    mapBadge: "From step 3",
    attributes: { email: "email", firstName: "firstName", lastName: "lastName", groups: "groups" },
    groupMode: "names",
    groupIntro: "Okta sends group names, so type them exactly as they appear in Okta.",
    groupExamples: [
      { value: "Clarion-Admins", role: "admin" },
      { value: "Contact-Centre-Managers", role: "manager" },
    ],
    mapTip: { title: "Names must match exactly", body: "Including capitals and dashes. The test in step 6 shows the group names Okta actually sent." },
  },
  {
    id: "google",
    name: "Google Workspace",
    short: "Google Workspace",
    protocol: "SAML 2.0",
    blurb: "Custom SAML app",
    addIntro: "In the Google Admin console, add a custom SAML app for Iris. Google shows its own details first, so save those before you paste in ours.",
    addSteps: [
      "Go to **Apps** → **Web and mobile apps** → **Add app** → **Add custom SAML app**, and name it **Iris**.",
      "On **Google Identity Provider details**, click **Download metadata**.",
    ],
    addCallout: {
      tone: "warning",
      title: "Keep the downloaded file",
      body: "Google doesn't give a metadata link, only this file. You'll upload it in the next step.",
    },
    addStepsAfter: ["On **Service provider details**, paste these values:"],
    spFields: [
      { label: "ACS URL", irisName: "Same name in Iris", value: ACS },
      { label: "Entity ID", irisName: "Same name in Iris", value: ENTITY },
    ],
    spSettings: [["Name ID format", "EMAIL"], ["Name ID", "Basic Information › Primary email"]],
    addTable: {
      intro: "Under **Attribute mapping**, add these:",
      head: ["Google Directory attribute", "App attribute"],
      rows: [["Primary email", "email", "Required"], ["First name", "firstName"], ["Last name", "lastName"]],
      foot: "Then open the app's **User access** and turn it **On** for the people who use Clarion. New custom apps start off.",
    },
    addConfirm: "I've added Iris and downloaded Google's metadata file",
    addTip: { title: "About groups", body: "Google can send group membership, but it's more limited than Entra or Okta. You can assign roles in Clarion instead." },
    connectDefault: "file",
    connectMethods: ["url", "file", "manual"],
    fileName: "GoogleIDPMetadata.xml",
    parsed: [
      ["SSO URL", "https://accounts.google.com/o/saml2/idp?idpid=C03x…"],
      ["Entity ID", "https://accounts.google.com/o/saml2?idpid=C03x…"],
    ],
    connectErrors: [
      { tone: "danger", title: "This isn't a SAML metadata file.", body: "In Google, open the Iris app and click **Download metadata** again." },
      { tone: "warning", title: "The certificate expires in 12 days.", body: "You can continue, but replace it in Google soon or sign-in will stop." },
    ],
    connectTip: { title: "Lost the file?", body: "In the Google Admin console, open the Iris app and choose **Download metadata**." },
    mapIntro: "These match the attribute mapping from step 3. If you used different names in Google, change them here.",
    mapColumn: "App attribute name in Google",
    mapBadge: "From step 3",
    attributes: { email: "email", firstName: "firstName", lastName: "lastName" },
    groupMode: "limited",
    groupIntro: "Google only sends groups you pick one by one under **Group membership** in the app's attribute mapping. For most teams it's simpler to keep assigning roles in Clarion.",
    groupExamples: [{ value: "clarion-admins@acme.com", role: "admin" }],
    mapTip: { title: "Email comes through anyway", body: "Google always sends the primary email as the user's ID, so sign-in works even if the names are blank." },
  },
  {
    id: "ping",
    name: "Ping Identity",
    short: "PingOne",
    protocol: "SAML 2.0",
    blurb: "PingOne",
    addIntro: "In the PingOne admin console, add a SAML application for Iris, paste in two values, then choose which user details to send.",
    addSteps: [
      "Go to **Applications** → **Applications** → **+**, name it **Iris**, and choose **SAML Application**.",
      "Choose **Manually enter** and paste these values:",
    ],
    spFields: [
      { label: "ACS URLs", irisName: "Iris's ACS URL", value: ACS },
      { label: "Entity ID", irisName: "Same name in Iris", value: ENTITY },
    ],
    addTable: {
      intro: "On the app's **Attribute Mappings**, set these:",
      head: ["Attribute", "PingOne mapping"],
      rows: [["saml_subject", "Email Address", "Required"], ["email", "Email Address", "Required"], ["firstName", "Given Name"], ["lastName", "Family Name"], ["groups", "Group Names", "Optional"]],
      foot: "Then turn the app **on** with the toggle at the top. New PingOne apps start off.",
    },
    addConfirm: "I've added Iris in PingOne and turned it on",
    addTip: { title: "Using PingFederate?", body: "These steps are for PingOne. For PingFederate on your own servers, go back and choose **Other SAML 2.0 provider**." },
    connectDefault: "url",
    connectMethods: ["url", "file", "manual"],
    urlLabel: "IDP Metadata URL",
    urlWhere: "In PingOne: the Iris app → **Configuration** tab",
    urlExample: "https://auth.pingone.com/4a1f…/saml20/metadata/9c2e…",
    parsed: [
      ["Single Signon Service", "https://auth.pingone.com/4a1f…/saml20/idp/sso"],
      ["Issuer ID", "https://auth.pingone.com/4a1f…"],
    ],
    connectErrors: [
      { tone: "danger", title: "We couldn't open this link.", body: "Check the app is turned on in PingOne. Disabled apps don't share their metadata." },
      { tone: "danger", title: "This app's Entity ID doesn't match Iris.", body: "In PingOne, recheck the Entity ID you pasted in step 3." },
    ],
    connectTip: { title: "Several PingOne environments?", body: "Use the environment your staff sign in to every day, usually production, not a test environment." },
    mapIntro: "These match the attribute mappings from step 3. If you named them differently in PingOne, change them here.",
    mapColumn: "PingOne attribute",
    mapBadge: "From step 3",
    attributes: { email: "email", firstName: "firstName", lastName: "lastName", groups: "groups" },
    groupMode: "names",
    groupIntro: "PingOne sends group names, so type them exactly as they appear in PingOne.",
    groupExamples: [
      { value: "Clarion Admins", role: "admin" },
      { value: "Contact Centre Managers", role: "manager" },
    ],
    mapTip: { title: "Names must match exactly", body: "Including capitals and spaces. The test in step 6 shows the group names PingOne actually sent." },
  },
  {
    id: "saml",
    name: "Other SAML 2.0 provider",
    short: "your SAML provider",
    protocol: "SAML 2.0",
    blurb: "PingFederate, ADFS, JumpCloud…",
    generic: true,
    addIntro: "Create a new SAML app for Iris in your provider. Providers name these fields differently, so we've listed the common alternatives.",
    addSteps: [],
    offerSpMetadata: true,
    spFields: [
      { label: "ACS URL", aka: "Reply URL · Single sign-on URL · Recipient URL · Consumer URL", value: ACS },
      { label: "Entity ID", aka: "Audience · Audience URI · Identifier · SP Entity ID", value: ENTITY },
    ],
    addTable: {
      intro: "What Iris needs your provider to send:",
      head: ["Setting", "Value"],
      rows: [
        ["Name ID format", "Email address", "Required"],
        ["Email attribute", "email", "Required"],
        ["First and last name", "firstName, lastName", "Recommended"],
        ["Groups", "groups", "Optional"],
        ["Signing", "Sign the response or assertion (SHA-256)", "Required"],
      ],
      foot: "Can't use these attribute names? That's fine. Use your provider's names and match them up in step 5.",
    },
    addConfirm: "I've created the Iris app in my provider",
    addTip: { title: "Easiest route", body: "If your provider can import an app from a file or link, give it Iris's metadata instead of copying fields." },
    connectDefault: "manual",
    connectMethods: ["url", "file", "manual"],
    urlLabel: "Metadata URL",
    parsed: [
      ["Sign-in URL", "https://sso.acme.com/idp/SSO.saml2"],
      ["Issuer", "https://sso.acme.com"],
    ],
    connectErrors: [
      { tone: "danger", title: "This isn't a certificate.", body: "It should start with **-----BEGIN CERTIFICATE-----**. You may have copied a key or fingerprint instead." },
      { tone: "danger", title: "The sign-in URL must start with https://", body: "Check you copied the full address." },
    ],
    connectTip: { title: "Entered by hand?", body: "Iris can't pick up a new certificate on its own. We'll email you before this one expires so you can paste in the new one." },
    mapIntro: "We've filled in the names we suggested in step 3. If your provider sends different names, type them here.",
    mapColumn: "Attribute your provider sends",
    mapBadge: "Suggested",
    attributes: { email: "email", firstName: "firstName", lastName: "lastName", groups: "groups" },
    groupMode: "values",
    groupIntro: "Enter each group exactly as your provider sends it. That may be a name or an ID; the test shows which.",
    groupExamples: [{ value: "clarion-admins", role: "admin" }],
    mapTip: { title: "Long attribute names are normal", body: "Some providers send names like **http://schemas.xmlsoap.org/…/emailaddress**. Paste the whole thing." },
  },
  {
    id: "oidc",
    name: "Other OIDC provider",
    short: "your OIDC provider",
    protocol: "OIDC",
    blurb: "OpenID Connect",
    generic: true,
    addIntro: "OpenID Connect needs less setup than SAML. Register Iris as a web app and give it one address.",
    addSteps: [
      "In your provider, create a new app. Choose **Web application** (sometimes called a confidential client).",
      "Name it **Iris** and paste this address:",
    ],
    spFields: [{ label: "Redirect URI", aka: "Callback URL · Sign-in redirect URI · Reply URL", value: REDIRECT }],
    addTable: {
      intro: "Check these settings on the app:",
      head: ["Setting", "Value"],
      rows: [
        ["Grant type", "Authorization code", "Required"],
        ["Scopes", "openid email profile", "Required"],
        ["Groups claim", "groups", "Optional"],
        ["Client authentication", "Client secret", "Required"],
      ],
    },
    addCallout: { tone: "warning", title: "Copy the client secret now", body: "Most providers only show it once. You'll paste it, with the client ID, in the next step." },
    addConfirm: "I've registered Iris and copied the client ID and secret",
    addTip: { title: "SAML or OIDC?", body: "If your provider offers both, either works. SAML is more common for workplace sign-in; OIDC has fewer settings." },
    connectDefault: "oidc",
    connectMethods: [],
    parsed: [
      ["Sign-in address", "https://login.acme.com/authorize"],
      ["Token address", "https://login.acme.com/oauth/token"],
      ["Signing keys", "Found · refreshed automatically"],
    ],
    connectErrors: [
      { tone: "danger", title: "We couldn't find OpenID settings at this address.", body: "Check the issuer URL in your provider's app settings. It's often shown next to the client ID." },
    ],
    connectTip: { title: "Secrets expire", body: "Many providers end client secrets after a year or two. Add the expiry date and we'll remind you before it runs out." },
    mapIntro: "OIDC uses standard names for these, so they're filled in. Most teams won't need to change anything.",
    mapColumn: "Claim",
    mapBadge: "Standard",
    attributes: { email: "email", firstName: "given_name", lastName: "family_name", groups: "groups" },
    groupMode: "values",
    groupIntro: "Enter each group exactly as it appears in the groups claim. The test in step 6 shows the values sent.",
    groupExamples: [{ value: "clarion-admins", role: "admin" }],
    mapTip: { title: "No groups coming through?", body: "Many providers only send groups when you add a groups claim or scope to the app. Check the app's token settings." },
  },
]

export const providerById = (id: ProviderId) => providers.find((p) => p.id === id)!

export const connectMethodLabel: Record<ConnectMethod, string> = {
  url: "Metadata URL",
  file: "Upload file",
  manual: "Enter manually",
}

// ---- Tenant context ---------------------------------------------------------

/** Active Members: the people SSO applies to. Like Slack, Iris applies SSO to
 * the whole workspace, not by email domain, so there is no domain to verify. */
export const activeMembers = () => users.filter((u) => u.status !== "deactivated")

/** Sample sign-in log addresses (the Acme mock tenant). */
export const sampleEmailDomain = "acme.com"

export const setupSteps = [
  "Choose provider",
  "Add Iris to provider",
  "Connect provider",
  "Map user details",
  "Test sign-in",
] as const

// ---- Active-state sample data ----------------------------------------------

export interface SignInEvent {
  who: string
  when: string
  outcome: "success" | "failed"
  reason?: string
}

export const recentSignIns: SignInEvent[] = [
  { who: "priya.nair", when: "4 min ago", outcome: "success" },
  { who: "noah.patel", when: "11 min ago", outcome: "success" },
  { who: "grace.mwangi", when: "38 min ago", outcome: "success" },
  { who: "liam.chen", when: "1 h ago", outcome: "failed", reason: "Not invited to Clarion yet" },
  { who: "ava.thornton", when: "2 h ago", outcome: "success" },
  { who: "daniel.okafor", when: "3 h ago", outcome: "failed", reason: "Signature didn't match certificate" },
]
