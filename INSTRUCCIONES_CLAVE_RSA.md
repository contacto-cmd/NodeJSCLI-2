# 🔐 Instrucciones para Configurar tu Clave RSA 4096

## Paso 1: Preparar tu Clave

Tu clave RSA debe tener este formato completo:

```
-----BEGIN PRIVATE KEY-----
MIIJQgIBADANBgkqhkiG9w0BAQEFAASCCSwwggkoAgEAAoICAQC...
[muchas líneas de texto base64]
...
-----END PRIVATE KEY-----
```

O este formato alternativo:

```
-----BEGIN RSA PRIVATE KEY-----
MIIJKAIBAAKCAgEA...
[muchas líneas de texto base64]
...
-----END RSA PRIVATE KEY-----
```

## Paso 2: Agregar la Clave en Replit Secrets

1. **Abre el panel de Secrets** (Tools → Secrets en la interfaz de Replit)

2. **Crea un nuevo secreto:**
   - **Nombre**: `RSA_4096_PRIVADA`
   - **Valor**: Pega tu clave completa incluyendo las líneas BEGIN y END

3. **IMPORTANTE**: Asegúrate de que la clave:
   - Comience con `-----BEGIN PRIVATE KEY-----` o `-----BEGIN RSA PRIVATE KEY-----`
   - Termine con `-----END PRIVATE KEY-----` o `-----END RSA PRIVATE KEY-----`
   - Incluya todas las líneas intermedias sin modificar

## Paso 3: Configurar SISTEMA_TOKEN_LISTA

Crea otro secreto:
- **Nombre**: `SISTEMA_TOKEN_LISTA`
- **Valor**: `[{"url":"https://api.nodo1.com"}, {"url":"https://api.nodo2.com"}]`

(Puedes personalizar las URLs según tus nodos)

## Paso 4: Verificar

Una vez agregados los secretos, el servidor se iniciará automáticamente y tu aplicación web 3D estará lista.

---

## Si tu clave no tiene BEGIN/END

Si tu clave solo tiene números sin el encabezado BEGIN, necesitas convertirla al formato PEM.
Avísame y te ayudo con el proceso de conversión.
