import { plan } from "./src/features/fast-follow/iris/build"
for (const s of ["Weak Wi-Fi by site", "Headsets that aren't approved", "Call quality this week", "Alerts that keep coming back"]) {
  const p = plan(s) as any
  console.log(s, "=>", JSON.stringify(p?.built ? { name: p.built.name, view: p.built.view, state: p.built.state } : p))
}
