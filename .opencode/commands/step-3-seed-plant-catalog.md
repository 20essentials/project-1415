---
description: Step 3 — Seed del catálogo de plantas · Petals & Predators
---
# Step 3 — Seed del catálogo de plantas

> **Siguiente:** `/step-4-create-home-page`

## Objetivo

Sembrar el backend de Wix Stores: 3 categorías, 5 productos (uno con opciones de
variantes), imágenes, y el handoff `.wix/seeded.json` que leerán los pasos de frontend.

## Contexto

- **Marca:** Petals & Predators — plantas carnívoras + flores, sitio en inglés.
- **Recetas:** wix-manage = `C:\Users\amoil\.agents\skills\wix-manage` (usa
  `references\stores\setup-online-store-catalog-v3.md` y
  `references\stores\bulk-create-products-with-options.md`) · SKILL_ROOT =
  `C:\Users\amoil\.agents\skills\wix-headless`.
- **Comandos:** !`ls .opencode/commands` · ¿ya seeded? !`ls .wix/seeded.json 2>/dev/null || echo "(aún sin sembrar)"`

## Functionality

### 1. Preparación frontend (idempotente)

```bash
bash "C:\Users\amoil\.agents\skills\wix-headless\scripts\seed-utilities.sh" --template astro
```

### 2. Catálogo (recetas wix-manage)

Seguir `references/stores/setup-online-store-catalog-v3.md` (setup idempotente) +
`references/stores/bulk-create-products-with-options.md` (**bulk: los 5 productos en
una sola llamada** — cap del endpoint). Categorías vía Categories API en llamadas
paralelas y asignar productos.

| Producto | Slug | Precio | Categoría | Opciones |
|---|---|---|---|---|
| 'Akai Ryu' Venus Flytrap | `venus-flytrap-akai-ryu` | $24.00 | Carnivorous | — |
| Tropical Pitcher Plant | `nepenthes-pitcher-plant` | Small $24 / Medium $36 / Large $52 | Carnivorous | **Size** (S/M/L) |
| Cape Sundew | `cape-sundew` | $18.00 | Carnivorous | — |
| Moonlight Orchid | `moonlight-orchid` | $32.00 | Flowers | — |
| Carnivorous Starter Kit | `carnivorous-starter-kit` | $45.00 | Kits & Accessories | — |

- SKU: `<slug>-001` (variantes: `<slug>-001-sm`…).
- Descripciones reales en inglés (cuidado, luz, hábito de crecimiento) — 2-3 frases.
- El bulk es **text-only**: usa el placeholder de imagen documentado en la receta.

### 3. Imágenes (opcional pero deseado)

1. Mintear token una vez: `TOKEN=$(npx @wix/cli@latest token --site "$SITE_ID")`.
2. Generar + importar con el script paralelo (5 productos + 1 hero decorativo):
   ```bash
   echo '{"siteId":"'"$SITE_ID"'","model":"google:4@2","projectDir":"'"$PWD"'","images":[
     {"key":"<productId-or-hero>","positivePrompt":"…","width":1024,"height":1024}, …
   ]}' | WIX_TOKEN="$TOKEN" node "C:\Users\amoil\.agents\skills\wix-headless\scripts\generate-images.mjs"
   ```
3. Adjuntar los URLs a cada entidad siguiendo `references/images/INSTRUCTIONS.md`
   (fase entity PATCH). Si la generación falla o no hay créditos: deja los
   placeholders y anótalo en ROADMAP — no bloquea el paso.

### 4. Handoff `.wix/seeded.json` (escritor único = este paso)

```json
{
  "stores": {
    "productIds": ["…"],
    "categoryIds": { "carnivorous": "…", "flowers": "…", "kits-accessories": "…" },
    "products": [
      { "id": "…", "name": "…", "slug": "…", "variantId": "…", "price": 24 }
    ]
  },
  "ecom": { "status": "skipped" },
  "gift-cards": { "status": "skipped" }
}
```

Slug/variantId de cada producto — los necesitan steps 5-7. **No se importa en rutas
.astro** (solo para slugs/getStaticPaths; el runtime consulta el SDK en vivo).

## Verificación

- [ ] Query de productos devuelve los 5 (nombre, precio, categoría correctos)
- [ ] La variante Size del Nepenthes tiene 3 precios distintos
- [ ] `.wix/seeded.json` completo y parsea como JSON
- [ ] `npx @wix/cli@latest build` sigue en verde

## Al terminar

1. Marca el paso 3 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-4-create-home-page`
