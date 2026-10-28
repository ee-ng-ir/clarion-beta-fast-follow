import {
  Avatar, AvatarImage, AvatarFallback,
  Sidebar, SidebarBrand, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuLabel,
} from "@ir/ui"
import { adminNavItems, pageAllowed, productNavItems, proposalNavItems, type NavItem, type PageId } from "@/nav"
import { useViewer } from "@/lib/viewer"
import { clarionBrand, irisBrand } from "@/lib/brand"

/** Product marks for the Products group (each product's own brand artwork). */
const productArt: Partial<Record<PageId, string>> = { clarion: clarionBrand }

/**
 * The Iris admin portal's sidebar, on Picasso's Sidebar. Matches the live
 * portal: Administration, then Products. Proposals sit below for review.
 */
export function AdminSidebar({ active, onNavigate }: { active: PageId; onNavigate: (id: PageId) => void }) {
  const { perm } = useViewer()
  const allowed = <T extends { id: PageId }>(xs: T[]) => xs.filter((x) => pageAllowed(x.id, perm))
  const products = allowed(productNavItems)
  return (
    <Sidebar mobile="drawer" mobileLabel="Iris navigation">
      <SidebarHeader variant="brand">
        <SidebarBrand image={irisBrand} mark="I">Iris</SidebarBrand>
      </SidebarHeader>

      <SidebarContent>
        <NavGroup label="Administration" items={allowed(adminNavItems)} active={active} onNavigate={onNavigate} />

        {products.length > 0 && <SidebarGroup>
          <SidebarGroupLabel>Products</SidebarGroupLabel>
          <SidebarMenu>
            {products.map((p) => (
              <SidebarMenuItem key={p.id}>
                <SidebarMenuButton active={p.id === active} onClick={() => onNavigate(p.id)} title={p.label}>
                  <Avatar size="xs" className="size-4 text-[10px]">
                    {productArt[p.id] && <AvatarImage src={productArt[p.id]} alt="" />}
                    <AvatarFallback>{p.label[0]}</AvatarFallback>
                  </Avatar>
                  <SidebarMenuLabel>{p.label}</SidebarMenuLabel>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>}

        <NavGroup label="Proposals" items={allowed(proposalNavItems)} active={active} onNavigate={onNavigate} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        {/* IR logo, bottom-left (min 'i' height ≈20px per brand book) */}
        <div className="flex items-start p-2">
          <img src="/ir-logo.png" alt="Integrated Research" className="h-6 w-auto dark:hidden" />
          <img src="/ir-logo-white.png" alt="Integrated Research" className="hidden h-6 w-auto dark:block" />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

function NavGroup({ label, items, active, onNavigate, className }: {
  label: string
  items: NavItem[]
  active: PageId
  onNavigate: (id: PageId) => void
  className?: string
}) {
  if (!items.length) return null
  return (
    <SidebarGroup className={className}>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map(({ id, label: itemLabel, icon: Icon }) => (
          <SidebarMenuItem key={id}>
            <SidebarMenuButton active={id === active} onClick={() => onNavigate(id)} title={itemLabel}>
              <Icon aria-hidden />
              <SidebarMenuLabel>{itemLabel}</SidebarMenuLabel>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
