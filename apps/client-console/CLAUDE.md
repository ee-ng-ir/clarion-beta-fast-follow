# Client console

- Picasso everywhere (`AdminApp` sets `<html data-picasso>`). Use `@ir/ui` components; don't add shadcn copies.
- Access data (people, groups, locations, roles, widget users) comes from `@ir/mock-data`. Extend it there.
- Users, Groups and Roles share the Tenant · Clarion · Product X tabs (`scopes` in `@ir/mock-data/access`).
  A new product = add it to `products` there; the tabs follow.
