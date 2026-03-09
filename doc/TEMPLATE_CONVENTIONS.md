# Template conventions

When implementing or updating resume templates (from user-provided template code or new designs), follow these rules:

## Skills: category is mandatory

- **Skill category** will be mandatory. Each skill must have a `category` (e.g. "Languages", "Frameworks", "Tools").
- **Templates must show skills grouped by category**, with a **category header** per group (e.g. "Languages" then the tags, "Frameworks" then the tags), not a single flat list under "Skills".
- Use `groupSkillsByCategory(skills)` from `lib/templates/template-utils` and render each group with its category label.

Do not implement skills as a flat list without category headers when adding or updating templates.
