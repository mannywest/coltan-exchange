# FRONTEND.md: Design Rules (read before building ANY UI)

Goal: every interface must feel designed by a human with a point of view, never like a default AI template. If a choice feels like the first thing that comes to mind, stop and pick something more intentional.

## 1. Before writing code
1. Read IDEA.md. Understand who uses this and what mood suits them.
2. Pick ONE bold aesthetic direction and name it in one line (e.g. "editorial brutalism", "warm tactile paper", "dark luxe terminal", "playful retro-futurism"). The direction must fit the audience, not just look cool.
3. Write down the design system in a `DESIGN.md` BEFORE building screens: colours (hex + role), fonts, type scale, spacing scale, radius, shadow/border style, motion rules. Reuse it everywhere.
4. For a new customer or brand, look at 2-3 reference sites I name (or that you find) and describe what makes them feel distinct. Borrow principles, never copy.

## 2. Banned (the "generic AI" look)
- Purple/indigo-to-blue gradients, glowing blobs, glassmorphism by default
- Inter, Roboto, Arial or system fonts as the main typeface
- Centred hero + three identical feature cards + gradient CTA button
- Emoji used as icons; stock-looking icon grids
- Default Tailwind/shadcn look left unstyled
- Everything rounded-xl with soft grey shadows
- Lorem ipsum or "Acme Inc" placeholders (use realistic pretend data)
- Every section the same width, same padding, same rhythm

## 3. Required
- **Typography:** one distinctive display font plus one refined body font. Use size, weight and contrast boldly. Load fonts properly.
- **Colour:** a committed palette: one dominant colour, one sharp accent, neutrals with character (not pure grey). Use CSS variables.
- **Layout:** make at least one unexpected composition choice per page (asymmetry, overlap, a strong grid, large type, generous or deliberately tight space). Vary rhythm between sections.
- **Detail:** textures, borders, grain, patterns or illustration that suit the direction. Details are what make it feel crafted.
- **Motion:** a few meaningful animations (page-load reveal, hover states, transitions between states). No scattered gimmicks. Respect `prefers-reduced-motion`.
- **Mobile first:** design the phone layout properly, not as a squashed desktop.
- **Real content:** realistic copy, names, numbers and states (empty, loading, error) in pretend data.

## 4. Quality bar (check before saying done)
- Squint test: does it have a clear focal point and hierarchy?
- Could this screenshot belong to any other app? If yes, push the identity further.
- Contrast passes accessibility (WCAG AA), tap targets are comfortable, focus states are visible.
- Nothing from the Banned list slipped in.

## 5. Process
- Build ONE key screen first with pretend data. Show me before building the rest.
- Keep it token-efficient: check numbers and structure first, look at a single combined screenshot at the end, not many.
- After my feedback, update DESIGN.md so the fix sticks for later screens.
- Don't chase trends blindly. "Latest" means fresh and intentional for this audience, not whatever is popular this month.
