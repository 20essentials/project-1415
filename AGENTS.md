- Nos inspiraremos en la web de: https://www.mintlify.com/
- Un punto de referencia es la documentation de Wix Managed Headless: https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/about-the-astro-integration

## Gestor de paquetes al crear el proyecto

- Crear el proyecto se puede con pnpm: `pnpm create @wix/new@latest headless --skip-install`
- Instalar dependencias requiere npm: `pnpm install` falla con la plantilla de `@wix/cli` (conflictos de peer-deps). Usar siempre: `npm install --legacy-peer-deps`

## Flujo de trabajo por comandos

- El sitio se construye por pasos: cada `.opencode/commands/step-N-*.md` es la **fuente de verdad** de qué hacer a continuación. Ejecutar en orden (`/step-0-scaffold-and-setup`, `/step-1-create-hero-section`, …).
- `ROADMAP.md` (raíz) lleva el estado del backlog: `pending` → `materialized` → `done`. Cada paso se marca `done` al terminar.
- Cuando no exista el siguiente `step-N`, ejecutar `/generate-next-steps`: materializa los próximos items `pending` del roadmap con la plantilla fija.
- **Marca:** Petals & Predators — e-commerce en inglés (plantas carnívoras + flores). Design system en `DESIGN.md` (frontmatter = tokens canónicos; body = captura de referencia).
- **Recetas Wix:** skill `wix-headless` (`C:\Users\amoil\.agents\skills\wix-headless`) y skill `wix-manage` (apps + seeding).