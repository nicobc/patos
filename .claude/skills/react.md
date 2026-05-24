# React

MUST follow idiomatic conventions for the tools and libraries in use.

## Single-action flows

Don't add a confirmation screen or button for an action that has no alternative. If there is only one thing the user can do, do it directly — an extra click is pure friction. Trigger the action on mount instead of rendering a button.

## CSS

Component-specific styles live in a colocated `.css` file next to the component (e.g. `SignIn.css` next to `SignIn.tsx`) and are imported directly in that file. `index.css` is reserved for design-system primitives only: tokens, resets, base elements, and utility classes that are genuinely reusable across the entire app. If a style only applies to one component, it does not belong in `index.css`.
