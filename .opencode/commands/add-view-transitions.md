---
description: Agrega view transitions (morph de imagen) entre la lista y el detalle de una collection (products, blog, events...) usando transition:name emparejado + ClientRouter
agent: build
---

# Add view transitions (listing -> detail)

Agrega View Transitions de Astro entre la **pagina de lista** y la **pagina
de detalle** de una collection: la imagen de la tarjeta hace morph hacia la
imagen principal del detalle. Funciona para products, blog, events, workshops,
gift-cards o cualquier otro par listado/detalle del proyecto.

## Paso 0 — Preguntar ANTES de tocar codigo

Usa la herramienta `question` de opencode para preguntar al usuario (todas en
una sola llamada, con opciones si aplica):

1. **Collection objetivo**: sobre que lista/detalle se aplicara. Ofrece como
   opciones las collections que detectes explorando `src/pages/` (p. ej.
   products, blog, events, workshops), mas "Other" para una propia.
2. **Identificador unico del item** para el nombre de la transicion (el mas
   estable disponible): recomendado `slug` (`seoName`/`handle` segun el SDK);
   alternativas: `_id`, `title` normalizado.
3. **Alcance de paginas a enlazar**: solo lista -> detalle, o tambien
   listados secundarios (related, lookbook, feed del home) hacia el mismo
   detalle.
4. (Si la respuesta 3 incluye paginas secundarias) affinity de duplicados:
   por defecto los cards de paginas secundarias NO llevan `transition:name`
   a menos que el usuario pida el morph desde ahi.

Si en `$ARGUMENTS` ya viene la collection y el identificador, confirma lo
demas y sigue; no repreguntes lo ya respondido.

## Paso 1 — Detectar la architectura del proyecto

Explora y anota (no adivines):

- **Layout raiz** (p. ej. `src/app/layout.astro`): incluye `<ClientRouter />`
  de `astro:transitions`? Si no esta, AGREGALO: es obligatorio, sin
  navegacion SPA el `transition:name` no hace nada.
- **Componente de card/lista**: archivo que renderiza cada item del listado
  (p. ej. `src/features/<collection>/<item>-card.astro`).
- **Pagina de detalle**: ruta dinamica que recibe el slug/id
  (p. ej. `src/pages/<collection>/[slug].astro` o `src/pages/[slug].astro`).
- **Imagenes**: la card usa `<img>` directo o un helper tipo
  `resolveWixImageUrl` (proyecto Wix)? Mismo aspect-ratio en lista y detalle
  es deseable (si difieren el morph igual funciona, pero queda mejor igualado).
- **Framework**: si el proyecto NO es Astro, esta receta no aplica tal cual;
  reporta el equivalente nativo (CSS `@view-transition` cross-document, API
  del framework correspondiente) y espera confirmacion antes de improvisar.

Respeta la arquitectura del proyecto receptor (Screaming Architecture,
kebab-case, exports nombrados — ver AGENTS.md si aplica).

## Paso 2 — Emparejar transition:name

Regla central: **el mismo `transition:name` en ambos lados**, derivado del
identificador del paso 0, prefijado para que siempre sea un identificador
CSS valido (un `view-transition-name` no puede empezar con digito):

```astro
<!-- Card (listado) -->
<div class="…aspect… overflow-hidden …" transition:name={id ? `view-${id}` : undefined}>
  <img … />
</div>

<!-- Detalle (imagen principal) -->
<div class="…aspect… overflow-hidden …" transition:name={id ? `view-${id}` : undefined}>
  <img … />
</div>
```

Detalles obligatorios:

- `transition:name` va en el **contenedor** de la imagen (no el `<img>`),
  asi el morph incluye el marco (esquinas, ring, overflow).
- `?: undefined` cuando falte el id: un item sin id NO debe llevar name
  (dos elementos con el mismo name y view-transition = error del navegador).
- **Unicidad por pagina**: es un error tener el mismo `view-transition-name`
  dos veces en el render de una pagina. Chequea:
  - paginas de detalle con cards related/similar del mismo tipo: excluye al
    propio item (si el codigo aun no lo hace, filtra) o usa un name distinto
    para los related (p. ej. `view-related-<id>`).
  - listados con el item repetido (featured + feed): mismo trato.
- Deja los componentes hidratados superpuestos (heart de wishlist, botones
  overlay) FUERA del elemento con `transition:name`: la animacion los
  desplaza con su marco y se ve mal.
- Si la card envuelve todo en un `<a>` de item completo, el `transition:name`
  sigue funcionando (el link puede envolver al contenedor).

## Paso 3 — Pulir la animacion (opcional)

Solo si el usuario lo pide o el morph default queda mal:

- Preservar el chrome entre paginas: `transition:persist` en el nav/header
  del layout (evita flash de re-render).
- Animacion custom via `::view-transition-old/new-*` en `<style is:global>`
  con el sheet de `astro:transitions/client` — nunca inline en pseudoelementos.
- Respetar `prefers-reduced-motion` (Astro la respeta en el default; no la
  rompas con animaciones custom).

## Paso 4 — Verificar (obligatorio, sino reportarlo)

1. `npm run check` — 0 errores (los hints preexistentes no cuentan).
2. `npx astro build` — compila.
3. Verificar unicidad de `view-transition-name` por pagina: grep el HTML
   compilado del build (`view-transition-name:`) y comprobar que cada name
   aparece una vez por render (lista y cada detalle).
4. Si hay `npm run test:e2e`, correrlo y confirmar que nada rompio.
5. Manual en `npm run dev`: click en un card -> el morph corre contra el
   detalle. Accesible con F12: `document.getAnimations()` incluye el
   `ViewTransition` durante el cambio.
6. Reporta que se verifico y como (comando + resultado); lo que no se pudo
   verificar, dilo explicito.

## Gotchas conocidos

- **Olvidar el `<ClientRouter />`**: el transition silenciosamente no corre
  (la page naviga full-load y parece "que el morph no se ve").
- **Item sin slug/id, dos con el mismo name**: undefined-safe y checkeo de
  duplicados, siempre.
- **Card con `loading="lazy"` y morph**: puede llegar sin decodificar y el
  morph muestra la caja vacia; si molesta, usa `decoding` rapido o
  `fetchpriority` en la imagen de destino (el PDP main ya lleva
  `fetchpriority="high"` en los detalles de producto).
- **Wix translations/multilingual**: el slug por idioma puede variar; usa el
  slug que la card misma pone en su href (misma fuente para link y name).
