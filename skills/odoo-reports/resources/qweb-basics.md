# QWeb Templating Directives (Report Layouts)

Odoo reports are rendered by the **QWeb** engine — an XML templating language —
into HTML and then PDF. Report templates live as `ir.ui.view` records (type
`qweb`) and are bound to an `ir.actions.report`. When inspecting or reasoning
about a report's layout, these are the core directives you will encounter.

## Directives
QWeb directives are XML attributes prefixed with `t-`.

- **`t-field`** — Render a record field with its formatting (dates, monetary,
  html). `<span t-field="doc.partner_id"/>`. Preferred for business data because
  it respects the field's widget and the user's locale.
- **`t-esc`** / **`t-out`** — Output an expression, HTML-escaped. `t-out` is the
  modern spelling (Odoo 15+); `t-esc` is the legacy alias. Use for computed
  values, not raw record fields.
- **`t-if`** / **`t-elif`** / **`t-else`** — Conditional rendering.
  `<p t-if="doc.amount_total > 0">…</p>`.
- **`t-foreach`** / **`t-as`** — Loop over a collection (e.g. order lines).
  `<tr t-foreach="doc.order_line" t-as="line">`. Inside the loop, `line_index`,
  `line_first`, `line_last`, and `line_size` are available.
- **`t-set`** / **`t-value`** — Declare a template-local variable.
  `<t t-set="total" t-value="doc.amount_total"/>`.
- **`t-call`** — Include another template (composition). This is how the standard
  paper layout wraps a report — see below.
- **`t-att-*`** / **`t-attf-*`** — Set an attribute dynamically. `t-att-class`
  takes an expression; `t-attf-class` takes a format string with `{{ }}`.

## The Document Loop
Reports print one or more records. The rendering context provides:
- **`docs`** — the recordset being printed (all selected records).
- **`doc`** — the current record, when iterating with
  `<t t-foreach="docs" t-as="doc">`.
- **`company`** — the active `res.company`.
- **`user`** — the user triggering the render.

A minimal report body:
```xml
<t t-foreach="docs" t-as="doc">
  <div class="page">
    <h2>Order <span t-field="doc.name"/></h2>
    <p>Customer: <span t-field="doc.partner_id"/></p>
    <table>
      <tr t-foreach="doc.order_line" t-as="line">
        <td><span t-field="line.product_id"/></td>
        <td><span t-field="line.price_subtotal"/></td>
      </tr>
    </table>
  </div>
</t>
```

## The External / Paper Layout
Standard reports do not draw their own header and footer. They delegate to a
shared layout via `t-call`, which supplies the company letterhead, address block,
and page numbering:
- **`web.external_layout`** — the standard wrapper (header + footer + company
  branding). Custom reports almost always wrap their content in it.
- **`web.internal_layout`** — a lighter wrapper for internal documents.

```xml
<t t-call="web.external_layout">
  <div class="page">…report content…</div>
</t>
```
The chosen paper format (`report.paperformat`) controls margins, orientation, and
page size independently of the template.

## Practical Notes
- **Read, don't guess:** to see a real report's markup, resolve it with
  `get_action`/`get_view` or inspect the `ir.ui.view` `arch` — do not assume field
  names from the model; report templates often use computed or related fields.
- **PDF vs HTML:** the PDF is produced from the rendered HTML by wkhtmltopdf, so
  CSS support is limited; layout relies on Bootstrap classes shipped by Odoo.
- **Monetary formatting:** prefer `t-field` on a `Monetary` field so the currency
  symbol and precision follow the record's `currency_id` automatically.
