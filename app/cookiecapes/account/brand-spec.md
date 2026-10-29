# Account controls: design reference

Mode: extension. Audience: cape owners on phone and desktop. Quiet account
management, with compact actions and progressive disclosure of quota details.
Variance 2, motion 2, density 5, asset dependence 2, brand fidelity 10.

Existing assets and sources:
- Logo: `public/minilogo.png`, rendered by `components/CookieNavbar.tsx`.
- Cape imagery: existing authenticated `CapeViewer` previews; retain drag controls.
- Heading font: `public/fonts/Nexa-Heavy.woff2`; body: existing Geist configuration.
- Reference UI: `AccountPanel.tsx`, `../components/SetupWizard.tsx`, shared Button.

Use existing zinc surfaces, white low-opacity borders, orange accents and semantic
destructive red. Keep the 4px spacing scale, rounded cards/controls, and restrained
hover/focus feedback. Use the installed Lucide icons and Radix popover primitives.

The upload header owns the three-segment remaining allowance meter. Reset time,
pending submissions and free operations appear in its info popover on hover,
focus or tap. Card actions use a two-column grid with 44px minimum heights.
Rename and deletion confirmation expand within the card. Cape title links keep
3D preview interaction separate. Private preview badges include accessible text.

Preserve routes, authenticated actions, translations, quota accounting, loading
and error states. Private detail links use owner-authorized server reads and the
existing authenticated image proxy. No new image assets or dependencies.

## Workflow redesign v0

Approved direction: Redesign · Preserve. Variance 3, motion 2, density 5,
asset dependence 2, brand fidelity 9. Task-focused, reassuring account management
at phone and laptop viewing distances. Existing account controls above remain
the reference for production implementation.

Reviewable prototype: `docs/design/account-workflows-v0.html`. This standalone
draft references the existing `public/minilogo.png`, `public/mc-id.svg`, and
`public/fonts/Nexa-Heavy.woff2` assets. The browser audit inspected the local
signed-out account page; authenticated screens were inspected in source.
Cape previews and returned MC-ID profiles are explicitly marked placeholders.

Review mode separates eligible capes from everyday editing, starts with all
capes kept, uses keep/hide wording, and repeats the 30-day recovery explanation
before confirmation. The selection summary follows the preview grid in v0;
sticky placement can be assessed during production integration.
The MC-ID handoff explains verification, profile choice, and return. Profile
selection exposes selection counts and an empty-result recovery path.

V0 intentionally omits API calls, final content/localization, full state coverage,
and production integration until the layout checkpoint is approved. Routes,
server authorization, payloads, translations, quota behavior, and recovery
semantics remain protected. Three review densities can be explored in Tweaks.

## Implemented previous-upload review

The approved revision uses a dismissible Radix modal, automatically opened when
the selected player's pending snapshot loads. A persistent review prompt reopens
it later. Dismissal is local to the mounted account view; it never completes the
server review. Draft choices survive closing and reopening, including a refreshed
review ID for the same snapshot. New visits and changed snapshots open again.

Each eligible cape retains its authenticated 3D preview. Keep/Hide segmented
buttons replace native checkboxes and use the installed Radix ToggleGroup for
keyboard and selection semantics. All capes start kept. A second step lists the
exact kept/hidden cape names and IDs before submitting the existing action.
The modal uses a bounded scroll area, fixed header/footer, managed focus, Escape,
and outside dismissal. Dismissal is blocked while saving; failures preserve the
draft with an inline error and reload action. Missing previews block submission.
English and German messages are included. MC-ID workflow changes from the v0
proposal were rejected and are not part of the implementation.
