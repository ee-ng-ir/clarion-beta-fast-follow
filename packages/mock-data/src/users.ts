// LEGACY — the two-role model (Admin / CC Manager) the SSO wizard was built on.
// The RBAC proposal (Groups, Locations, fixed roles) lives in data/access.ts and
// drives the Users, Groups, Locations and Roles pages. The SSO wizard still maps
// IdP groups to these two roles; under the proposal it would map them to Iris
// groups instead. See RBAC-PROPOSAL.md.

export type UserRole = "admin" | "manager"
export type UserStatus = "active" | "invited" | "deactivated"

export interface AccountUser {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  lastActive: string | null
  invitedAgo?: string
}

export const roleLabel: Record<UserRole, string> = {
  admin: "Admin",
  manager: "CC Manager",
}

export const roleBlurb: Record<UserRole, string> = {
  admin: "Full administrative control across the whole estate.",
  manager: "View-only, scoped to the locations they look after.",
}

export const statusLabel: Record<UserStatus, string> = {
  active: "Active",
  invited: "Invited",
  deactivated: "Deactivated",
}

export const users: AccountUser[] = [
  { id: "u1", name: "Ava Thornton", email: "ava.thornton@acme.com", role: "admin", status: "active", lastActive: "2m ago" },
  { id: "u2", name: "Marcus Reyes", email: "marcus.reyes@acme.com", role: "admin", status: "active", lastActive: "1h ago" },
  { id: "u3", name: "Priya Nair", email: "priya.nair@acme.com", role: "manager", status: "active", lastActive: "12m ago" },
  { id: "u4", name: "Daniel Okafor", email: "daniel.okafor@acme.com", role: "manager", status: "active", lastActive: "3h ago" },
  { id: "u5", name: "Sofia Bianchi", email: "sofia.bianchi@acme.com", role: "manager", status: "active", lastActive: "yesterday" },
  { id: "u6", name: "Liam Chen", email: "liam.chen@acme.com", role: "manager", status: "invited", lastActive: null, invitedAgo: "2d ago" },
  { id: "u8", name: "Tomás Herrera", email: "tomas.herrera@acme.com", role: "manager", status: "deactivated", lastActive: "3w ago" },
  { id: "u9", name: "Grace Mwangi", email: "grace.mwangi@acme.com", role: "manager", status: "active", lastActive: "40m ago" },
  { id: "u10", name: "Noah Patel", email: "noah.patel@acme.com", role: "manager", status: "active", lastActive: "5m ago" },
]
