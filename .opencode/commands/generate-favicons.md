---
description: Generate all favicon assets from a source PNG and wire them into the project
---
# Generar favicons completos desde una imagen

## Objetivo
Generar todo el set de favicons necesario desde un PNG fuente (preferentemente con fondo transparente o un logo), creando:
- `favicon.svg` (vector trazado con potrace, optimizado con svgo, color de marca)
- `mask-icon.svg` (monocromo para Safari pinned tabs)
- Múltiples PNGs rasterizados: `favicon-16x16.png`, `favicon-32x32.png`, `favicon-48x48.png`, `favicon-96x96.png`, `favicon-512x512.png`
- `apple-touch-icon.png` (180x180 sobre fondo del tema)
- `android-chrome-192x192.png`, `android-chrome-512x512.png` (sobre fondo del tema)
- `favicon.ico` con entradas PNG 16/32/48

Y actualizar `src/app/layout.astro`, `public/site.webmanifest` según corresponda.

## Requisitos
- Tener `sharp` y `svgo` instalados (npm)
- Tener Node.js disponible
- Imagen fuente en `public/` (por defecto: `public/favicon-without-compress.png`). Si el nombre es distinto, ajustarlo.

## Parámetros (ajustables)
- `SOURCE_PNG`: `public/favicon-without-compress.png` (o ruta absoluta/relativa)
- `BRAND_COLOR`: color hex del logo (ej. `#0fb681`)
- `PAPER_COLOR`: color hex de fondo para iconos opacos (ej. `#08090a`)
- `ALPHA_CUT`: umbral para binarización (128 por defecto)

## Flujo de trabajo

### 1. Analizar la imagen fuente
Ejecutar un script rápido para obtener metadatos, bbox alfa, colores dominantes.
```bash
node << 'EOF'
const sharp = require('sharp');
(async()=>{
  const img = sharp('public/favicon-without-compress.png');
  console.log(JSON.stringify(await img.metadata(),null,2));
  const s = await sharp('public/favicon-without-compress.png').resize(200,200,{fit:'inside'}).raw().toBuffer({resolveWithObject:true});
  const counts = new Map();
  for(let i=0;i<s.data.length;i+=s.info.channels){
    const a=s.data[i+3]; if(a<10) continue;
    const key=[s.data[i],s.data[i+1],s.data[i+2]].join(',');
    counts.set(key,(counts.get(key)||0)+1);
  }
  const top=[...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8);
  console.log('top:', top.map(([k,v])=>'#'+k.split(',').map(n=>Number(n).toString(16).padStart(2,'0')).join('')+':'+v).join(' '));
})();
EOF
```

### 2. Trazar a SVG con potrace
Instalar potrace temporal si no existe: `npm install --no-save potrace jimp@^0.14.0` (o usar uno existente). Trazar el canal alfa (binarizar >128 = forma, else blanco).

Script de trazado:
```js
const fs=require('fs'), path=require('path'), sharp=require('sharp'), potrace=require('potrace');
const SRC='public/favicon-without-compress.png', OUT=path.join(process.cwd(),'tmp-fav');
fs.mkdirSync(OUT,{recursive:true});
(async()=>{
  const {data,info}=await sharp(SRC).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const W=info.width,H=info.height;
  const bin=Buffer.alloc(W*H,255);
  for(let i=0;i<W*H;i++) bin[i]=data[i*info.channels+3]>128?0:255;
  const binPath=path.join(OUT,'binary.png');
  await sharp(bin,{raw:{width:W,height:H,channels:1}}).png({compressionLevel:9,palette:true}).toFile(binPath);
  const svg=await new Promise((res,rej)=>potrace.trace(binPath,{threshold:128,turdSize:20,optCurve:true,optTolerance:0.5,alphaMax:1.0},(e,s)=>(e?rej(e):res(s))));
  fs.writeFileSync(path.join(OUT,'raw.svg'),svg);
  const d=svg.match(/<path[^>]*\sd="([^"]*)"/s)[1];
  const master=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><path fill="#0fb681" fill-rule="evenodd" d="${d}"/></svg>`;
  fs.writeFileSync(path.join(OUT,'master.svg'),master);
  console.log('ok', W,H, (svg.match(/<path/g)||[]).length);
})();
```

### 3. Optimizar SVG con svgo
```js
const fs=require('fs'), {pathToFileURL}=require('url');
const {optimize}=await import(pathToFileURL(require.resolve('svgo/lib/svgo-node.js')).href);
const master=fs.readFileSync('tmp-fav/master.svg','utf8');
const optimized=optimize(master,{multipass:true,plugins:[{name:'preset-default',params:{overrides:{convertPathData:{floatPrecision:2}}}},{name:'removeDimensions',active:false}]}).data;
fs.writeFileSync('public/favicon.svg', optimized);
```
Crear `mask-icon.svg` reemplazando fill por `#000000`.

### 4. Generar todos los PNGs e ICO
Usar sharp para rasterizar desde el master SVG a las resoluciones necesarias.
- 16,32,48,96,512 transparentes (para favicons)
- 192,512 sobre fondo `#08090a` centrados (~78%)
- 180x180 apple-touch sobre `#08090a` con logo centrado (~140px)

Construir `favicon.ico` con entradas PNG 16/32/48 (estructura estándar ICO).

```js
function buildIco(entries){
  const header=Buffer.alloc(6); header.writeUInt16LE(0,0); header.writeUInt16LE(1,2); header.writeUInt16LE(entries.length,4);
  const dir=Buffer.alloc(16*entries.length);
  let offset=6+dir.length;
  entries.forEach((e,i)=>{
    const o=i*16; dir[o]=e.size>=256?0:e.size; dir[o+1]=e.size>=256?0:e.size; dir[o+2]=0; dir[o+3]=0;
    dir.writeUInt16LE(1,o+4); dir.writeUInt16LE(32,o+6); dir.writeUInt32LE(e.data.length,o+8); dir.writeUInt32LE(offset,o+12); offset+=e.data.length;
  });
  return Buffer.concat([header,dir,...entries.map(e=>e.data)]);
}
```

### 5. Actualizar layout y manifest
- `src/app/layout.astro`: añadir links para 16/32, `mask-icon` con color de marca
- `public/site.webmanifest`: añadir android-chrome 192/512, mantener apple-touch-icon

### 6. Verificar
- Comprobar fidelidad (alpha MAE) con sharp
- Verificar ICO estructura y PNG entries
- Verificar SVGs renderizan correctamente

### 7. Limpiar
Eliminar `tmp-fav/` y archivos temporales.

## Tips
- Potrace funciona mejor con alta resolución fuente (>=512px). 1254x1254 fue óptimo aquí.
- Usar `turdSize=20`, `optTolerance=0.5` para buen balance entre fidelidad/tamaño.
- Para ICO usar entradas PNG (soportado por todos los navegadores modernos).
- Siempre mantener `favicon.svg` como primario (mejor en vector).
- `mask-icon.svg` debe ser monocromo negro para Safari.

## Resultado esperado
Todos los archivos en `public/`, links actualizados, sin errores de build.
