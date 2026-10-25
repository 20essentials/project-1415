# setup-opencode-temp

Usa este comando para preparar un proyecto con una carpeta temporal local para OpenCode y evitar el prompt "acceso a carpeta temporal".

## Objetivo

Crear `./.tmp/` en la raíz del proyecto, ignorarlo en `.gitignore` y usarlo como ruta por defecto para archivos temporales (patches, logs, artefactos).

## Pasos

### 1) Crear carpeta temporal
```bash
mkdir -p ./.tmp
```

### 2) Añadir a .gitignore si falta
Añade esta línea si no existe:

```gitignore
# temporary files for opencode
/.tmp/
```

### 3) Permisos en OpenCode (opcional pero recomendado)

Si tu `opencode.json` / `.opencode/opencode.json` soporta `permission`, añade:

```json
{
  "permission": {
    "filesystem": {
      "allow": ["./.tmp/**"]
    }
  }
}
```

> En Windows también funciona con rutas relativas. Si persiste el prompt para `AppData\Local\Temp\*`, puedes autorizar ese patrón puntualmente, pero lo ideal es usar `./.tmp/`.

## Uso

**Regla dura: jamás usar `/tmp`, `C:\Temp`, `AppData\Local\Temp` ni ninguna ruta fuera del workspace.** El shell de opencode no tiene acceso autorizado ahí y cada escritura fuera del workspace dispara el prompt de permisos. Si un futuro agente está a punto de redirigir salida a `/tmp/...`, está cometiendo el error.

Usa siempre `./.tmp/` (y siempre con prefijo `./`, nunca rutas absolutas al home del usuario) para:
- Parchear archivos
- Generar dumps/logs
- Descargas temporales
- Cualquier fichero intermedio que no deba commitearse
- Output de comandos de verificación (`curl ... > ./.tmp/fetch.json`), incluido si el comando se repite en un loop

Ejemplos correctos vs incorrectos:

```bash
curl -s http://localhost:4321/api/slots > ./.tmp/slots.json        # ✅
curl -s http://localhost:4321/api/slots > /tmp/slots.json          # ❌ dispara prompt
npm run dev > ./.tmp/dev.log 2>&1 &                                 # ✅
npm run dev > /tmp/dev.log 2>&1 &                                   # ❌ dispara prompt
```

## Limpieza

```bash
# limpiar todo el contenido de .tmp
rm -rf ./.tmp/* ./.tmp/.* 2>/dev/null || true
```

> Copia este comando a `.opencode/commands/` de cualquier otro proyecto para replicar el setup.
