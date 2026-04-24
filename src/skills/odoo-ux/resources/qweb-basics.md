# Odoo QWeb Basics

QWeb is the XML-based templating engine used for reports, website views, and some backend components.

## Common Directives

### Control Flow
- `t-if="condition"`: Conditionally renders a node.
- `t-elif="condition"` and `t-else`: Standard multi-branch logic.
- `t-foreach="collection" t-as="item"`: Iterates over an array or recordset.

### Data Output
- `t-esc="expression"`: Outputs escaped text (safest for strings).
- `t-out="expression"`: Outputs raw or formatted content (use for rich text).
- `t-field="record.field_name"`: Specialized for Odoo recordsets; automatically formats currencies, dates, and related records based on the user's locale.

### Attribute Manipulation
- `t-att-name="expression"`: Dynamically sets an attribute.
- `t-attf-name="string {{ expression }}"`: A formatted string attribute.
- `t-att="{'name': expression}"`: Sets multiple attributes from a dictionary.

## Special Tags
- `t-call="template_name"`: Includes another template.
- `t-set="variable_name" t-value="expression"`: Defines a variable within the template's scope.
