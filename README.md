# AmphibiaApp — Guía de instalación

App mobile de captura y clasificación de documentos para Digitrack.  
**Stack:** React Native (Expo) + Node.js middleware + SOAP webservice Amphibia.

---

## Requisitos previos

Instalar en la PC antes de arrancar:

| Herramienta | Versión | Link |
|---|---|---|
| Node.js | 18 o superior | https://nodejs.org |
| Expo Go (celular) | SDK 54 | App Store / Play Store |
| Tesseract OCR | 5.x | https://github.com/UB-Mannheim/tesseract/wiki |

> **Tesseract**: durante la instalación tildar **Spanish** en "Additional language data". Instalar en `D:\Tesseract` (o ajustar la ruta en el paso de configuración).

---

## 1. Clonar el repositorio

```bash
git clone https://github.com/vgnFran/AmphibiaApp
cd AmphibiaApp
```

---

## 2. Configurar el middleware

```bash
cd middleware
npm install
```

Crear el archivo `.env` en la carpeta `middleware/`:

```
PORT=3000
SOAP_WSDL=https://amphibiaqa.digitrack.com.ar/webservice/amphibiawebservice.asmx?WSDL
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> La API key de OpenRouter se obtiene gratis en https://openrouter.ai

**Si Tesseract se instaló en una ruta distinta a `D:\Tesseract`**, editar la línea en `middleware/src/routes/ocr.js`:

```js
binary: 'D:\\Tesseract\\tesseract.exe',  // ← cambiar esta ruta
```

Levantar el middleware:

```bash
node src/index.js
```

Debería aparecer: `Middleware corriendo en http://localhost:3000`

---

## 3. Configurar la app mobile

```bash
cd ../mobile
npm install --legacy-peer-deps
```

Editar la IP del middleware en `mobile/src/services/api.ts`:

```ts
const MIDDLEWARE_URL = 'http://TU_IP_LOCAL:3000';
```

> Para ver tu IP local en Windows: `ipconfig` → buscar **Dirección IPv4**

Levantar la app:

```bash
npx expo start --clear
```

Escanear el QR con la cámara del iPhone (abre en Expo Go).  
El celular debe estar en la **misma red WiFi** que la PC.

---

## 4. Levantar todo junto (resumen rápido)

**Consola 1 — Middleware:**
```bash
cd D:\proyects\digitrack-app\middleware
node src/index.js
```

**Consola 2 — App:**
```bash
cd D:\proyects\digitrack-app\mobile
npx expo start --clear
```

---

## Credenciales de prueba

| Campo | Valor |
|---|---|
| Empresa | Digitrack |
| Usuario | fhoyos |
| Contraseña | 54321 |

---

## Funcionalidades implementadas

- Login con usuario y contraseña
- Login con Face ID / huella dactilar (requiere build nativo, no funciona en Expo Go)
- Selección de sector → documento → campos dinámicos
- Captura de imagen con cámara o galería
- OCR automático al sacar foto (Tesseract + IA via OpenRouter)
- Clasificación de documentos via webservice SOAP Amphibia

---

## Notas importantes

- El middleware debe estar corriendo en la misma red que el celular
- La IP en `api.ts` cambia según la red (casa vs trabajo) — actualizarla cada vez que cambie de red
- Los modelos gratuitos de OpenRouter pueden estar saturados en horas pico — si el OCR falla, los campos se pueden completar a mano
- Para producción: hostear el middleware en un servidor fijo y usar un modelo pago de OpenRouter

---

## Repositorio

https://github.com/vgnFran/AmphibiaApp
