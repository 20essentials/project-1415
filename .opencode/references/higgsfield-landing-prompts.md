# Prompts — landing scroll-world con clips YA generados

Adaptado de https://github.com/midudev/mcp-higgsfield-landing/blob/main/PROMPTS.md
(6 de octubre de 2026). **Se quitaron** los pasos del 0 (preparación de Higgsfield),
3 (costes), 4 (prueba de transición), 5 (escribir el prompt de los clips), 6 (generar
los clips con MiniMax H3) y 7 (vídeos optimizados para la web): los 6 clips ya existen
en `public/videos/`, así que no hace falta preparar herramientas, estimar créditos,
generar ni recodificar nada.

Se conservan los pasos de diseño y de cableado del la mecánica scroll-world:

1. [Primera versión de la web (skill landing-page-design)](#1-primera-versión-de-la-web-skill-landing-page-design)
2. [Diseño preparado para el scroll-world](#2-diseño-preparado-para-el-scroll-world)
3. [Escribir el prompt de la web con scroll-world](#3-escribir-el-prompt-de-la-web-con-scroll-world)
4. [Montar la web con la skill scroll-world](#4-montar-la-web-con-la-skill-scroll-world)

> En este proyecto el contenido es de Petals & Predators (plantas), no del restaurante;
> aquí queda la versión original como receta de la MECÁNICA (cómo se cableó Arko).

## 1. Primera versión de la web (skill landing-page-design)

```text
Usa el skill landing-page-design. Vamos a crear la landing de Arko, un restaurante real de cocina nikkei en Barcelona. Como es un negocio real, usa solo los datos de este mensaje, de su web (arkorestaurant.com; compruébalos antes) y de las fotos: no inventes reseñas, premios, platos, precios ni cifras. Si falta algo, márcalo como pendiente.

Intake:
- Acción principal: reservar mesa en https://arkorestaurant.myrestoo.net/en/reservar
- Acción secundaria, solo más abajo: regalar una experiencia en https://www.arkorestaurant.com/es/regala/
- Oferta: Arko Short Experience, menú para 2 personas (sushi, starters, principal y postre), 150 €. Arko Full Experience, menú degustación completo para 2 personas, 11 pases, 250 €. Maridaje, selección de vinos armonizados, +100 €.
- Titular de su web: "Cocina japonesa con alma mediterránea".
- Texto de su web: "Un restaurante donde la disciplina japonesa dialoga con el producto mediterráneo y la herencia peruana. Sin concesiones: técnica nipona, ingredientes del mar y del mercado, sabor de Barcelona."
- Platos destacados: carpaccio de ventresca Bluefin trufado, kizami, wasabi y crema de aguacate; ostra con salsa ponzu de fruta de la pasión; nigiri Selección; picanha de Wagyu a la brasa, yuca frita y salsa tarí; gelato de lúcuma, sablé, nueces pecanas y caramelo salado.
- Prueba: arroz Koshihikari con vinagre de arroz rojo de una casa japonesa fundada en 1937; salmón y atún 100 % libres de anisakis, sin antibióticos ni hormonas; toda la soja que se sirve en sala es sin gluten.
- Datos: Carrer Enric Granados 63, 08008 Barcelona. Abierto de lunes a domingo de 13:00 a 00:00. +34 938 29 95 72. Instagram @arko.barcelona.
- Legal: enlaza sus páginas /es/legal/, /es/privacidad/, /es/cookies/ y /es/terminos-compra/ de arkorestaurant.com.
- Logo: https://www.arkorestaurant.com/logo.svg. Es un PNG dentro de un SVG: vectorízalo con potrace para que quede nítido y se pueda pintar con currentColor. Su A en arco será el favicon.
- Público (asumido): gente de Barcelona y visitantes que buscan una cena especial en el Eixample.
- Objeciones (asumidas): el precio, no saber qué es la cocina nikkei y las dudas con el pescado crudo o el gluten.
- Tráfico: Instagram y Google Maps.
- Tono: cálido, sereno y premium.
- Fotos, en public/photos/: 0-entrada.jpg a 5-barra-lateral.jpg son el recorrido; 6-vinos.jpg es el pasillo de vinos; photo-01.jpg a photo-27.jpg son platos, producto y cócteles. Usa solo los nombres de plato de la lista de destacados; las fotos de platos que no estén en ella, márcalas como pendientes de nombre.
- Diseño: tema oscuro minimal editorial sacado de las fotos. Fondo #131209, texto crema #f3eadb y naranja teja #d0703a solo como acento (el botón, teja con el texto oscuro). Óvalos y arcos como máscaras de imagen, espejos de borde orgánico como marcos y las espirales de arena de la barra como motivo.
- Tipografía: Hina Mincho para los titulares y Zen Kaku Gothic New para el texto, de Google Fonts, servidas en local y recortadas a latín. Queremos algo nipón pero elegante; es una excepción a tu lista de fuentes que pido yo expresamente. Sin cursivas ni negritas sintéticas.
- Prioridad móvil: sí.
- Layout: scroll world con las fotos del local. Vídeo vertical 9:16 fijado a la derecha a toda la altura, con la parte de arriba en arco, y el texto a la izquierda, un bloque por cada una de las seis paradas del recorrido. La cabecera es tu píldora flotante: alineada a la izquierda en escritorio, con el logo a la altura del texto, y centrada en móvil.

Stack: proyecto Astro ya creado con pnpm create astro@latest, con Tailwind, GSAP (ScrollTrigger), Lenis y sharp. Imágenes con <Picture> de astro:assets.

Antes de escribir código, mira las fotos de public/photos/ y devuélveme lo que pide tu Output format, más qué foto va en cada sección.
```

Respuesta a sus preguntas antes de que escribiera el código:

```text
Maridaje +100, enlace de reserva en /es. Usa la cita de El periódico. El vídeo lo generamos después, por ahora ignoralo. No borres los .webp, usalos para que cargue más rápido la web.
```

## 2. Diseño preparado para el scroll-world

```text
Prepara el diseño de la web para cuando tengamos un video (no lo crees ahora) para que haga scroll-world de fondo y vaya mostrando la información correcta. Quita lo del arco, mejor que sea rollo scroll-world y que sea como un paseo por el restaurante conforme vamos haciendo scroll y entonces el vídeo de fondo va avanzando o retrocediendo según la posición del video. Instala ya las dependencias que necesites (GSAP o Lenis, lo que tu veas). Para el diseño usa Tailwind.
```

## 3. Escribir el prompt de la web con scroll-world

```text
Dame un prompt completo para generar la web con la skill de scroll-world pero teniendo en cuenta que ya tengo los videos generados para que no los vuelva a generar.
```

El prompt que devolvió está en `media/scroll-world/prompt-web.md`.

## 4. Montar la web con la skill scroll-world

Es el prompt del paso 8 original, con la dirección de arte y el intake añadidos en lugar
de las respuestas de la entrevista.

```text
Monta la landing de Arko con la skill scroll-world en este proyecto Astro, PERO los vídeos ya están generados. No generes nada: ni stills, ni clips, ni conectores, ni cadena 9:16. No llames a Higgsfield, Codex ni a ningún modelo de imagen o vídeo, y no gastes créditos. Del Step 0 solo comprueba ffmpeg/ffprobe. Sáltate los Steps 2–5. Del Step 6 haz solo encodes con ffmpeg. Haz completos los Steps 7 y 8.

## Dirección de arte

- **Paleta:** yeso crema, nogal, cuero terracota, el índigo y el naranja de la alfombra y luz ámbar. Fondo `#131209`, el casi negro cálido que está en la lista del skill. Texto en crema `#f3eadb` y naranja teja `#d0703a` solo como acento. El botón es teja con el texto oscuro, que es la combinación que pasa el contraste.
- **Marca:** el logo sale de su web (`https://www.arkorestaurant.com/logo.svg`). Ojo: es un PNG metido dentro de un SVG, así que hay que vectorizarlo con potrace para tenerlo nítido y poder pintarlo en crema con `currentColor`. Queda en 4 KB. Su A tiene forma de arco, como el escenario del vídeo, y sirve de favicon. Su azul marino `#06142f` no está en la lista de fondos del skill; si Arko lo quiere, hay que pedirlo de forma explícita.
- **Formas:** óvalos y arcos como máscaras de imagen, espejos de borde orgánico como marcos y las espirales concéntricas de la barra como separador, como ondas por detrás del botón de reservar y como pin del mapa.
- **Movimiento:** lento y pesado, como entrar en un sitio tranquilo. Nada rebota; la curva del skill (`cubic-bezier(0.32, 0.72, 0, 1)`) encaja.
- **Tipografía:** Hina Mincho para los titulares y Zen Kaku Gothic New para el texto, las dos de Google Fonts, servidas en local y recortadas a latín. Buscábamos algo nipón pero elegante: Geist quedaba demasiado genérica y una display occidental como Melodrama, demasiado de revista de moda. Es una excepción a la lista de fuentes del skill y hay que pedirla expresamente. Hina Mincho solo tiene un peso, así que nada de negritas sintéticas.
- **Ambilight:** detrás del arco va el mismo fotograma que se ve dentro, en un lienzo de 36×64 píxeles, ampliado, difuminado y con opacidad baja. Los colores del borde siempre coinciden con los del vídeo y el fondo deja de ser plano.
- **Móvil:** casi todas las fotos de platos son verticales, así que en móvil lucen todavía más. Del recorrido, `2-mesa-especial.jpg` y `4-barra.jpg` ya son verticales; las otras cuatro se recortan a 9:16.
- **Falta:** el nombre de los platos de repuesto. Si hace falta alguna foto más, pídesela a Arko y no la generes con IA: serían platos que no sirven.

Intake:
- Acción principal: reservar mesa en https://arkorestaurant.myrestoo.net/en/reservar
- Acción secundaria, solo más abajo: regalar una experiencia en https://www.arkorestaurant.com/es/regala/
- Oferta: Arko Short Experience, menú para 2 personas (sushi, starters, principal y postre), 150 €. Arko Full Experience, menú degustación completo para 2 personas, 11 pases, 250 €. Maridaje, selección de vinos armonizados, +100 €.
- Titular de su web: "Cocina japonesa con alma mediterránea".
- Texto de su web: "Un restaurante donde la disciplina japonesa dialoga con el producto mediterráneo y la herencia peruana. Sin concesiones: técnica nipona, ingredientes del mar y del mercado, sabor de Barcelona."
- Platos destacados: carpaccio de ventresca Bluefin trufado, kizami, wasabi y crema de aguacate; ostra con salsa ponzu de fruta de la pasión; nigiri Selección; picanha de Wagyu a la brasa, yuca frita y salsa tarí; gelato de lúcuma, sablé, nueces pecanas y caramelo salado.
- Prueba: arroz Koshihikari con vinagre de arroz rojo de una casa japonesa fundada en 1937; salmón y atún 100 % libres de anisakis, sin antibióticos ni hormonas; toda la soja que se sirve en sala es sin gluten.
- Datos: Carrer Enric Granados 63, 08008 Barcelona. Abierto de lunes a domingo de 13:00 a 00:00. +34 938 29 95 72. Instagram @arko.barcelona.
- Legal: enlaza sus páginas /es/legal/, /es/privacidad/, /es/cookies/ y /es/terminos-compra/ de arkorestaurant.com.
- Logo: https://www.arkorestaurant.com/logo.svg. Es un PNG dentro de un SVG: vectorízalo con potrace para que quede nítido y se pueda pintar con currentColor. Su A en arco será el favicon.
- Público (asumido): gente de Barcelona y visitantes que buscan una cena especial en el Eixample.
- Objeciones (asumidas): el precio, no saber qué es la cocina nikkei y las dudas con el pescado crudo o el gluten.
- Tráfico: Instagram y Google Maps.
- Tono: cálido, sereno y premium.
- Fotos, en public/photos/: 0-entrada.jpg a 5-barra-lateral.jpg son el recorrido; 6-vinos.jpg es el pasillo de vinos; photo-01.jpg a photo-27.jpg son platos, producto y cócteles. Usa solo los nombres de plato de la lista de destacados; las fotos de platos que no estén en ella, márcalas como pendientes de nombre.
- Diseño: tema oscuro minimal editorial sacado de las fotos. Fondo #131209, texto crema #f3eadb y naranja teja #d0703a solo como acento (el botón, teja con el texto oscuro). Óvalos y arcos como máscaras de imagen, espejos de borde orgánico como marcos y las espirales de arena de la barra como motivo.
- Tipografía: Hina Mincho para los titulares y Zen Kaku Gothic New para el texto, de Google Fonts, servidas en local y recortadas a latín. Queremos algo nipón pero elegante; es una excepción a tu lista de fuentes que pido yo expresamente. Sin cursivas ni negritas sintéticas.
- Prioridad móvil: sí.
- Layout: scroll world con las fotos del local. Vídeo vertical 9:16 fijado a la derecha a toda la altura, con la parte de arriba en arco, y el texto a la izquierda, un bloque por cada una de las seis paradas del recorrido. La cabecera es tu píldora flotante: alineada a la izquierda en escritorio, con el logo a la altura del texto, y centrada en móvil.

## Vídeos que ya existen (media/scroll-world/h3/)

- web/clip-1.mp4 … web/clip-6.mp4: son los que hay que usar. H.264, 1920×1080, 24 fps, 8 s, sin audio, keyframe cada 0,25 s (GOP 6), entre 4 y 10 MB. Ya cumplen el encode del Step 6: NO los recodifiques, cópialos a public/video/.
- clips/2k/ (2560×1440) y clips/1080p/: masters. Úsalos solo si tienes que recodificar algo.
- No uses web/*.webm, web/paseo.mp4, paseo-h3-1080p.mp4, clips/descartes/ ni pruebas/.
- prompts.md y jobs.json explican cómo se generaron (MiniMax H3 con primer y último frame).
- clip-k va de la parada k-1 a la parada k, con ease-in y ease-out, y se asienta en la foto. Las costuras ya encajan: el PSNR entre el último frame de clip-k y el primero de clip-(k+1) está entre 29 y 37 dB.

## Cómo cablearlo en el engine

Los clips son tramos ENTRE paradas, no "dives" dentro de una escena. El texto de cada parada tiene que verse con la cámara quieta en esa parada, no a mitad de tramo. Por eso:

- sections: las 7 paradas, SIN `clip`. Su `still` es un frame real del vídeo, nunca la foto original (regla de costura del Step 5): parada 0 = primer frame de clip-1; paradas 1–5 = primer frame de clip-(k+1); parada 6 = último frame de clip-6. Extráelos con ffmpeg a webp en public/world/.
- connectors: los 6 clips en orden (clip-1 entre las paradas 0 y 1 … clip-6 entre la 5 y la 6). connectorsMobile: sus encodes 720p del §6.
- crossfade corto (~0.06–0.08). connScroll ~1.4 (los clips duran 8 s), paradas ~0.9, y más scroll en la primera y la última.
- Mantén los ids de las paradas que ya existen (inicio, nikkei, precio, producto, shari, como-reservar) y añade `maridaje` para la séptima.

## Integración en Astro

- Copia references/scrub-engine.js a src/scripts/scroll-world.js como módulo ES (con export) y móntalo desde src/components/ScrollWorld.astro, sustituyendo la implementación actual (GSAP, fotos y vídeo vacío). Borra lo que deje de usarse (`paseo` en arko.ts, world.ts, Stop.astro) si nada más lo importa.
- nav: false y sin brand ni topcta del engine, porque ya está Header.astro. atmosphere: false (es fotorrealista, sin partículas).
- Tema: mapea --sw-bg, --sw-ink, --sw-ink-soft, --sw-accent, --sw-font-display y --sw-font-body a los tokens existentes.
- Copy: reutiliza el que ya hay en ScrollWorld.astro, un bloque por parada y en este orden: 0 hero (h1 "Cocina japonesa con alma mediterránea", botón Reservar mesa y pills), 1 qué es la cocina nikkei, 2 precio cerrado (150 € / 250 € / +100 €), 3 producto (anisakis, soja sin gluten), 4 shari (Koshihikari, 1937), 5 cómo funciona (3 pasos), 6 maridaje (`maridaje` de arko.ts) con CTA final: Reservar mesa (links.reservar) y Regalar una cena (links.regalar). Un solo h1 en toda la página.
- Móvil: el 16:9 se recorta en vertical. Mira cada frame y define un object-position horizontal por parada para que el sujeto (el cerezo, los espejos, la mesa, la barra, el pasillo) quede a la vista. Si el engine no lo admite, añade un campo por sección.
- Deja debajo el resto de la página tal cual: Tagline, Dishes, Press, Experiences, Faq, Gift y FinalCta. Comprueba que Lenis no pelea con el suavizado del engine y que los anchors del Header siguen funcionando.
- prefers-reduced-motion: solo los stills.

## QA (Step 8)

- Arranca con `pnpm astro dev --background` y páralo con `pnpm astro dev stop`.
- Prueba con agent-browser o Playwright, nunca con mi Chrome. Mejor snapshots que screenshots.
- Captura justo antes y justo después de cada una de las 12 costuras (parada→clip y clip→parada) y compara la composición.
- Consola sin errores, video.seekable.end(0) > 0, currentTime siguiendo al scroll en cada tramo, un viewport de móvil (390×844) y reduced-motion.
- `pnpm build` sin errores.
```