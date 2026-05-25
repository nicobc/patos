# React

## MUST DO — enforce on every code change without exception

**USE INLINE PAGES, NOT MODALS, FOR MULTI-FIELD FORMS AND NAVIGATIONAL FLOWS.** Modals are acceptable only for simple single-action confirmations (e.g. "Delete this item?"). Never open a form in a modal.

**NEVER ADD A CONFIRMATION STEP FOR A SINGLE-OPTION ACTION.** If there is only one thing the user can do, trigger it on mount — an extra button is pure friction.

**ISOLATE ALL SUPABASE CALLS IN `src/services/`.** Components and hooks import from service modules only — never from `lib/supabase.ts` directly. Service functions return typed data derived from the generated `src/types/database.ts` types.

**DESIGN EVERY TABLE-BACKED SERVICE FOR REAL-TIME MULTI-USER USE.** Every table that drives UI state needs a `subscribeTo*Changes` counterpart — including join/relation tables whose mutations affect visible state (e.g. `task_deps`). Never assume a single active session.

**UPDATE STATE SURGICALLY FROM SUBSCRIPTION CALLBACKS.** Filter server-side where possible, client-side otherwise. Callbacks must carry enough context (affected id + event type) to update local state without a full refetch.

**MOCK THE SERVICE MODULE IN UNIT TESTS, NOT THE SUPABASE CLIENT.** Tests import and mock the service layer directly — never mock `lib/supabase.ts` in component or hook tests.

**KEEP COMPONENT CSS COLOCATED.** Component-specific styles live in a `.css` file next to the component and are imported there. `index.css` is for design-system primitives only — tokens, resets, base elements, and utilities reusable across the entire app. If a style only applies to one component, it does not belong in `index.css`.
