# Guía para Generar APK (Android)

## Requisitos Previos
1. **Instalar JDK 17** (Adoptium / Oracle).
2. **Instalar Android Studio** (incluye SDK, Build Tools y Platform Tools).
3. Asegurarte de que el backend corra en tu PC en el puerto 3001.
4. Abrir puertos en firewall si usarás dispositivo físico (ej. 3001).

## Variables de Entorno
Configura JAVA_HOME (ejemplo Windows):
```
JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.x
PATH=%JAVA_HOME%\bin;%PATH%
```

## API URL Según Entorno
| Entorno | Valor sugerido REACT_APP_API_URL |
|---------|----------------------------------|
| Web dev | http://localhost:3001/api         |
| Emulador | http://10.0.2.2:3001/api         |
| Dispositivo físico | http://<TU_IP_LAN>:3001/api |

Para cambiarlo en build Android: edita `.env.production` y luego ejecuta sync.

## Scripts Disponibles
Dentro de `frontend/` puedes usar:
```
npm run android:open           # Abre Android Studio
npm run android:sync           # Build web + sync con Android
npm run android:build:debug    # Genera app-debug.apk
npm run android:build:release  # Genera app-release.apk (sin firmar)
```

## Pasos Rápidos (Debug APK)
```
cd frontend
npm install
npm run android:build:debug
```
APK resultante: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

## Generar APK Release Firmado
1. Android Studio > Build > Generate Signed Bundle / APK.
2. Selecciona APK.
3. Crea o selecciona un **keystore**.
4. Elige variante `release`.
5. Build.
6. Ubicación: `frontend/android/app/build/outputs/apk/release/app-release.apk`

## Backend Accesible desde Android
- Emulador: backend accesible en `http://10.0.2.2:3001`
- Dispositivo físico: usar IP LAN (ej. `http://192.168.1.50:3001`)
- Asegúrate de que el backend permita CORS (config ya incluida).

## Problemas Comunes
| Problema | Causa | Solución |
|----------|-------|----------|
| ECONNREFUSED | Backend apagado | Iniciar servidor Node.js |
| Network Error | IP incorrecta | Ajustar `.env.production` |
| CORS blocked | Origen no permitido | Verificar `server.js` CORS |
| `JAVA_HOME not set` | Falta JDK | Instalar y definir variable |
| `Could not resolve ...` | SDK faltante | Instalar plataformas en Android Studio |

## Limpiar y Reintentar
```
cd frontend/android
./gradlew clean
cd ..
npm run android:build:debug
```

## Notas de Seguridad
- No subir el keystore a repositorios.
- Al firmar, guarda: alias, password keystore y password de key.
- Para Play Store necesitas un release firmado y alineado (Gradle lo hace).

## Roadmap Opcional
- Añadir splash screen nativo.
- Integrar iconos adaptivos personalizados.
- Permitir notificaciones push (FCM + plugin Capacitor).
- Modo offline/PWA avanzado con Service Worker.

---
© 2025 Sistema de Recursos Audiovisuales - Guía Android
