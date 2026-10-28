// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
/* Vite resolves an asset import to its served URL. The brand headers are SVGs
 * that ship with the package (`files: ["src"]`), so a product can point
 * SidebarBrand at one without copying it. */
declare module "*.svg" {
  const src: string;
  export default src;
}
