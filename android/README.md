# Reacción en cadena — proyecto Android
WebView que carga assets/www/index.html desde https://appassets.androidplatform.net/ (servido desde los assets, con soporte de Range para audio).
- Paquete com.ikeriano.reaccionencadena, actividad com.ikeriano.webjuego.MainActivity (misma base que Millonario 1.13).
- versionName 1.0, versionCode 1, minSdk 24, targetSdk/compileSdk 34. Apaisado. El botón atrás llama a window.__back() del juego.

## Compilar
    ../tools/apk.sh        (compila el juego, copia la web a assets/www, gradle assembleRelease y verifica la firma)
Requisitos: JDK 17+ y Android SDK (platform 34, build-tools 34) en local.properties (sdk.dir=...).
Firma: copiar ikeriano-2026.jks y keystore.properties a android/keystore/ (carpeta ignorada por git). NUNCA subir el keystore.

## Siguiente versión
Sube versionCode y versionName en app/build.gradle, version.json, src/cfg.js (VERSION) y el meta app-version de index.html.
