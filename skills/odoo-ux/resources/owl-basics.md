# Odoo Web Library (OWL) Basics

OWL is the modern JavaScript framework used for Odoo's web client (Odoo 14+).

## Key Concepts

### Components
- **Definition:** Components are JavaScript classes extending `Component`.
- **Templates:** Defined in XML files linked via the `template` property.
- **Setup:** The `setup()` method is the modern constructor for OWL components, used for reactive state and hooks.

### Reactivity
- `useState({})`: Creates a reactive object. Changes to this object trigger re-rendering of the component.
- `useRef("name")`: Provides access to a DOM element or a child component.

### Hooks
- `onWillStart`: Asynchronous lifecycle hook for fetching initial data.
- `onMounted` / `onWillUnmount`: Standard lifecycle hooks.
- `onWillUpdateProps`: Triggered before properties are updated.

## Odoo Integration
- `useService("name")`: Accesses Odoo services (e.g., `rpc`, `notification`, `orm`, `action`).
- `useBus(bus, event, callback)`: Listens for events on an Odoo message bus.

### XML (OWL Directives)
- `t-on-click="handler"`: Event listener.
- `t-ref="name"`: Links a DOM element to a reference created in `setup()`.
- `t-key="item.id"`: Required for items in a `t-foreach` list to maintain performance and state.
