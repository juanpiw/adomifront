# 🔊 Sonidos de Notificaciones

## Archivo Requerido

**Nombre del archivo**: `notification.mp3`  
**Ubicación**: `adomi-app/public/assets/sounds/notification.mp3`

## Especificaciones del Audio

- **Formato**: MP3 (recomendado) o WAV
- **Duración**: 1-3 segundos (corto y efectivo)
- **Volumen**: Normalizado (el código ya lo ajusta al 50%)
- **Tipo**: Sonido de notificación/alerta no intrusivo

## Dónde Descargar Sonidos Gratis

### Opción 1: Freesound.org
https://freesound.org/search/?q=notification
- Busca "notification" o "alert"
- Descarga archivos con licencia Creative Commons

### Opción 2: Zapsplat
https://www.zapsplat.com/sound-effect-categories/notification-sounds/
- Sonidos de notificación gratis
- Descarga directa en MP3

### Opción 3: Notification Sounds
https://notificationsounds.com/
- Colección específica de notificaciones
- Diversos estilos disponibles

## Recomendaciones

### ✅ Buenos sonidos:
- Tono suave de campana
- "Ding" sutil
- Sonido de mensaje tipo WhatsApp
- Alerta de smartphone moderna

### ❌ Evitar:
- Sonidos muy largos (>3 segundos)
- Alarmas estridentes
- Sonidos muy fuertes

## Ejemplos Específicos Recomendados

1. **"Pristine" de iOS** - Tono suave y profesional
2. **"Notification Sound 1"** de Zapsplat
3. **"Gentle Notification"** de Freesound

## Instalación

1. Descarga el archivo de sonido que prefieras
2. Renómbralo a `notification.mp3`
3. Colócalo en: `adomi-app/public/assets/sounds/notification.mp3`
4. El código ya está listo para usarlo automáticamente

## Activar el Sonido

En el archivo `dash-layout.component.ts`, línea 79, descomenta:

```typescript
// Descomenta esta línea:
this.playNotificationSound();
```

## Notas Técnicas

- Los navegadores bloquean audio automático sin interacción del usuario
- El sonido solo se reproduce después de que el usuario haya interactuado con la página
- El volumen está configurado al 50% por defecto
- El archivo debe ser accesible públicamente (por eso está en `public/assets`)

---

**Estado Actual**: ⚠️ Archivo de sonido pendiente de agregar  
**Código**: ✅ Ya implementado y listo para usar

