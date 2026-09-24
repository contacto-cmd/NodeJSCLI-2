# THRONE Seal API - Sellado criptografico de documentos

Servicio de **prueba de existencia** para documentos: calcula el SHA-256 real de
un archivo y lo ancla a la blockchain de Bitcoin mediante OpenTimestamps.

Operado por **Street Emporio Royal**, Playas de Rosarito, Baja California.

---

## Que prueba exactamente (y que no)

**Si prueba:**

- Que un documento con ese contenido exacto **ya existia** en la fecha del sello.
- Que el documento **no ha sido alterado** desde entonces. Si cambia un solo
  byte, la verificacion falla.
- Ambas cosas son **verificables por un tercero** de forma independiente, sin
  necesidad de confiar en nosotros: el ancla vive en la blockchain de Bitcoin.

**No prueba, y lo decimos por escrito:**

- No es una **constancia NOM-151** (eso requiere un PSC acreditado ante la
  Secretaria de Economia).
- No es un **acto notarial** ni sustituye la fe publica.
- No acredita la **veracidad del contenido** ni la identidad del firmante, solo
  la existencia e integridad del archivo en una fecha.

Esta honestidad es parte del producto: un despacho contable serio no compra
promesas que no se sostienen ante un juez.

---

## Privacidad por diseno

El modo recomendado es **`hash-only`**: el cliente calcula el SHA-256 en su
propia maquina y nos envia unicamente ese hash de 64 caracteres.

**Su documento nunca sale de su oficina. Nunca lo vemos, nunca lo almacenamos.**

Para un despacho que maneja informacion fiscal de sus clientes, esto no es un
detalle tecnico: es la diferencia entre poder contratarnos y no poder.

Calcular el hash localmente:

```bash
# macOS / Linux
shasum -a 256 contrato.pdf

# Windows (PowerShell)
Get-FileHash contrato.pdf -Algorithm SHA256
```

---

## Endpoints

Base: `https://<su-dominio>/api/v1`

Autenticacion: encabezado `x-api-key: <clave>` (si el servidor tiene claves
configuradas en la variable de entorno `SEAL_API_KEYS`).

### `GET /health`

Estado del servicio.

```json
{ "service": "throne-seal-api", "version": "SER27-SEAL-1.0", "status": "ok" }
```

### `POST /api/v1/seal`

Sella un documento y lo ancla a Bitcoin.

**Peticion (modo recomendado, hash-only):**

```json
{
  "sha256": "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  "documentName": "Contrato-ACME-2026.pdf"
}
```

**Peticion (alternativa, subiendo el archivo):**

```json
{ "contentBase64": "<archivo en base64>", "documentName": "Contrato.pdf" }
```

**Respuesta `201`:**

```json
{
  "version": "SER27-SEAL-1.0",
  "documentName": "Contrato-ACME-2026.pdf",
  "algorithm": "SHA-256",
  "sha256": "ba7816bf...15ad",
  "privacyMode": "hash-only",
  "sealedAt": "2026-09-23T23:40:00.000Z",
  "owner": "Street Emporio Royal",
  "bitcoinAnchor": {
    "status": "pending",
    "otsReceiptBase64": "AE9wZW5UaW1l...",
    "bitcoinBlock": null,
    "note": "El anclaje tarda entre 1 y 6 horas."
  },
  "disclaimer": "Prueba de existencia e integridad... No constituye constancia NOM-151 ni acto notarial."
}
```

Guarde el campo `otsReceiptBase64`: es el recibo que permite completar la prueba.

### `POST /api/v1/verify`

Verifica un documento contra su certificado.

```json
{
  "sha256": "<hash actual del archivo>",
  "certificate": { "sha256": "<hash del certificado>", "sealedAt": "..." }
}
```

**Respuesta:**

```json
{
  "valid": false,
  "expected": "ba7816bf...15ad",
  "actual": "7d865e95...0c3f",
  "verdict": "El documento NO coincide con el certificado. Fue alterado o es otro archivo."
}
```

### `POST /api/v1/anchor/upgrade`

Completa un recibo pendiente una vez que Bitcoin lo confirmo (1-6 h despues).

```json
{ "otsReceiptBase64": "AE9wZW5UaW1l..." }
```

**Respuesta cuando ya quedo anclado:**

```json
{
  "status": "confirmed",
  "bitcoinBlock": 949596,
  "blockTime": "2026-05-15T10:22:00.000Z",
  "explorerUrl": "https://mempool.space/block/949596"
}
```

El cliente puede abrir ese `explorerUrl` y comprobarlo por su cuenta. Esa
verificacion independiente es el argumento de venta mas fuerte del servicio.

---

## Puesta en marcha

```bash
npm install
npm install opentimestamps      # necesario para el anclaje a Bitcoin
npm test                        # verifica que el sellado funciona
npm run serve                   # levanta la API
```

Variables de entorno:

| Variable        | Uso                                                          |
| --------------- | ------------------------------------------------------------ |
| `PORT`          | Puerto de escucha (por defecto 3000)                          |
| `SEAL_OWNER`    | Nombre que aparece en los certificados                        |
| `SEAL_API_KEYS` | Claves separadas por coma. Si esta vacia, la API queda abierta |

---

## Demostracion en 5 minutos frente a un prospecto

1. Pidale al prospecto un documento suyo cualquiera (no necesita enviarlo).
2. Que calcule el hash en su propia maquina con `shasum -a 256`.
3. Selle ese hash con `POST /api/v1/seal`.
4. Entreguele el certificado JSON.
5. Pidale que cambie una coma del documento y vuelva a calcular el hash.
6. Verifique con `POST /api/v1/verify`: dara `valid: false`.

Ese paso 6 es el que cierra la venta. El prospecto ve, con su propio documento y
sin entregarselo a nadie, que la alteracion queda al descubierto.
