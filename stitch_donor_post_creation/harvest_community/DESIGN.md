# Design System Specification: The Digital Greenhouse

## 1. Overview & Creative North Star
This design system moves beyond the "utility-first" approach of standard Material 3 to embrace a philosophy we call **"The Digital Greenhouse."** 

In a food-sharing ecosystem, the UI must feel organic, breathable, and deeply communal. We reject the sterile, "app-in-a-box" look by utilizing intentional asymmetry, overlapping container depths, and a rejection of harsh structural lines. This system prioritizes a high-end editorial feel where negative space is as much a functional element as the components themselves. By leaning into Material You's dynamic capabilities but filtering them through earth-toned sophisticated palettes, we create an interface that feels like a premium neighborhood marketplace rather than a database.

**The Creative North Star:** *Nurtured Connectivity.* Every interaction should feel as soft as a hand-off and as reliable as a harvest.

---

## 2. Colors: Tonal Depth & Organic Flow
The color strategy leverages a sophisticated range of earth-derived greens and ambers. We utilize the M3 Surface Tone system to create hierarchy through luminance rather than lines.

*   **Primary (#0d631b):** The "Growth" anchor. Used for high-emphasis actions and brand presence.
*   **Secondary (#875200):** The "Harvest" amber. Used for navigational accents and community highlights.
*   **Surface Hierarchy:** We utilize `surface_container_lowest` through `surface_container_highest` to create a "nested" physical reality.

### The "No-Line" Rule
**Prohibition:** 1px solid borders are strictly forbidden for sectioning or container definition. 
**Implementation:** Boundaries must be defined solely through background color shifts. For instance, a list of food items in `surface_container_low` should sit directly on a `surface` background. The change in tonal value provides the "edge," resulting in a softer, more sophisticated interface that mimics natural light and shadow.

### The "Glass & Gradient" Rule
To elevate the "out-of-the-box" Android feel, floating elements (like the FAB or active Filter Chips) should utilize **Glassmorphism**. Apply a 20% opacity to the surface color token and a `16px` backdrop blur. 
*   **Signature Textures:** For Hero sections or primary CTAs, use a linear gradient (45°) transitioning from `primary` (#0d631b) to `primary_container` (#2e7d32). This adds "soul" and depth that static flat colors cannot achieve.

---

## 3. Typography: Editorial Authority
We utilize a dual-font pairing to create an editorial hierarchy that feels both modern and accessible.

*   **The Display & Headline Scale (Plus Jakarta Sans):** These are our "Voice" fonts. Use `display-lg` through `headline-sm` to create bold, asymmetrical entry points into screens. The wide apertures of Jakarta Sans provide a premium, modern feel.
*   **The Body & Label Scale (Be Vietnam Pro):** Our "Utility" fonts. These provide exceptional readability at small scales on the Pixel 8 Pro’s high-density display.
*   **Hierarchy Note:** Use `title-lg` (Be Vietnam Pro) for food item names to ensure maximum legibility, while using `label-md` in `on_surface_variant` for metadata (e.g., "2.3 miles away").

---

## 4. Elevation & Depth: Tonal Layering
In this design system, "Elevation" is a state of color, not just a shadow.

### The Layering Principle
Depth is achieved by "stacking" surface tiers. 
*   **Level 0 (Background):** `surface` (#f7fbf0).
*   **Level 1 (Content Sections):** `surface_container_low` (#f1f5eb).
*   **Level 2 (Individual Cards):** `surface_container_lowest` (#ffffff).
This stacking creates a soft, natural lift that feels like high-quality paper.

### Ambient Shadows
Where physical lift is required (e.g., a Modal Bottom Sheet), shadows must be "Ambient."
*   **Specs:** `Blur: 24px`, `Y-Offset: 8px`, `Spread: 0`.
*   **Color:** Use the `on_surface` color at **6% opacity**. Never use pure black or grey; tinting the shadow with the surface color makes the interface feel integrated and premium.

### The "Ghost Border" Fallback
If an element requires a container but tonal shifts are insufficient for accessibility (contrast < 3:1), use a **Ghost Border**: `outline_variant` (#bfcaba) at **15% opacity**. It should be felt, not seen.

---

## 5. Components: Refined Primitives

### Cards & Lists (The Core of FoodLink)
*   **Rule:** Forbid the use of divider lines between list items. Use `spacing.6` (1.5rem) of vertical white space to separate items.
*   **Elevated Cards:** Use `surface_container_lowest` with a `lg` (2rem) corner radius. Ensure the image aspect ratio is a soft 4:3 or 1:1 to maintain the organic feel.

### Buttons & Chips
*   **FAB (Floating Action Button):** Utilize the `xl` (3rem) roundness. Apply the "Glass & Gradient" rule to make it feel like a luminous object hovering over the map or list.
*   **Filter Chips:** Use `secondary_container` for the active state and `surface_container_high` for the inactive state. Roundness must be `full` (9999px).

### Input Fields & Modals
*   **Outlined Text Fields:** Use the Ghost Border rule for the container. The label should transition to `primary` on focus to signal "active growth."
*   **Modal Bottom Sheets:** These should use `xl` (3rem) top corner radius and the `surface_container_high` token. Use a wide, subtle drag handle in `outline_variant`.

### Map Pins
*   Standard Android pins should be customized with a `secondary` (#875200) fill and a `white` inner icon to denote food availability, ensuring high contrast against the green-dominant map theme.

---

## 6. Do’s and Don’ts

### Do
*   **DO** use asymmetrical margins. For example, a header might have a `spacing.8` left margin and a `spacing.12` right margin to create editorial tension.
*   **DO** use `surface_bright` for interactive elements that need to pop against a `surface_dim` background.
*   **DO** prioritize "Breathing Room." If in doubt, increase the spacing scale by one increment.

### Don't
*   **DON'T** use 100% opaque `outline` tokens for borders. It breaks the "Digital Greenhouse" softness.
*   **DON'T** use standard Material 3 "Elevated" shadows. They are too harsh for this community-focused aesthetic. Use the Ambient Shadow spec.
*   **DON'T** stack more than three levels of surface containers. It leads to visual clutter and "nesting fatigue."