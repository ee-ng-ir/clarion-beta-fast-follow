// Export a dashboard's table as CSV, with a header that says what it is and that it's demo data.

export function downloadCsv(name: string, about: string[], rows: (string | number)[][]) {
  const cell = (c: string | number) => { const s = String(c); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
  const lines = [
    ...about.map((a) => cell(a)),
    `Exported ${new Date().toLocaleString("en-AU")}`,
    "Fast Follow preview - illustrative data, not the shipped product",
    "",
    ...rows.map((r) => r.map(cell).join(",")),
  ]
  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }))
  const a = document.createElement("a")
  a.href = url
  a.download = `Clarion_${name.replace(/[^\w-]+/g, "-")}.csv`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
