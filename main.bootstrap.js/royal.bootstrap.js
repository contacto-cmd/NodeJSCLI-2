#!/bin/sh
set -e
echo "=== Escaneo y verificación segura de claves privadas (auto-run) ==="
BASE_DIRS="/root $HOME/royal-bootstrap/keys $HOME/keys $HOME"
TMP="/tmp/royal_key_check_$$"
mkdir -p "$TMP"
MAN="$TMP/manifest.txt"
echo "Manifest Royal Emporio - $(date -u) - prueba" > "$MAN"

# patrones de nombre que buscaremos
PATTERNS="*key* *priv* *.pem *.key *.pem.b64 aht_* nueva*"

# función para chequear un archivo candidato
check_file() {
  F="$1"
  echo ""
  echo "---- Revisando: $F ----"
  # permisos y tamaño
  ls -l "$F" 2>/dev/null || echo "No se puede listar $F"
  # mostrar solo cabecera y pie (no todo)
  echo "HEAD (1..3):"
  head -n 3 "$F" 2>/dev/null | sed -n '1,3p'
  echo "TAIL (last 3):"
  tail -n 3 "$F" 2>/dev/null | sed -n '1,3p'

  # intentar detectar tipo con openssl (no mostrará la private key completa)
  echo "Intentando openssl pkey -text -noout (detect type)..."
  OUT=$(openssl pkey -in "$F" -text -noout 2>&1) || OUT=$(openssl rsa -in "$F" -check -noout 2>&1) || OUT=$(openssl ec -in "$F" -check -noout 2>&1) || true
  if [ -z "$OUT" ]; then
    echo "openssl no pudo leer $F (posible formato desconocido o clave truncada)."
    return 0
  fi
  echo "$OUT" | sed -n '1,40p'

  # intentar extraer public key a tmp (silencioso)
  PUB="$TMP/$(basename "$F").pub.pem"
  if openssl pkey -in "$F" -pubout -out "$PUB" 2>/dev/null; then
    echo "Publica extraida a: $PUB"
    # fingerprint hex con :
    HEXFP=$(openssl pkey -in "$PUB" -pubin -outform DER 2>/dev/null | openssl dgst -sha256 -binary | xxd -p -c32 | sed 's/../&:/g;s/:$//')
    B64FP=$(openssl pkey -in "$PUB" -pubin -outform DER 2>/dev/null | openssl dgst -sha256 -binary | openssl enc -base64)
    echo "Fingerprint (hex   :): $HEXFP"
    echo "Fingerprint (base64): $B64FP"
    # intentar firmar manifest y verificar
    SIG="$TMP/$(basename "$F").sig"
    if openssl dgst -sha256 -sign "$F" -out "$SIG" "$MAN" 2>/dev/null; then
      if openssl dgst -sha256 -verify "$PUB" -signature "$SIG" "$MAN" >/dev/null 2>&1; then
        echo "Firma y verificación: OK (control total de la private key)"
      else
        echo "Firma OK pero verificación FALLÓ (raro, revisar public extraction)."
      fi
    else
      echo "No se pudo firmar con $F (posible clave no apta para firma o formato incompatible)."
    fi
  else
    echo "No se pudo extraer la clave pública (archivo posiblemente truncado o formato no soportado)."
  fi
}

# buscar candidatos
echo "Buscando archivos candidatos en: $BASE_DIRS"
FOUND=0
for D in $BASE_DIRS; do
  if [ -d "$D" ]; then
    for P in $PATTERNS; do
      for f in $(find "$D" -maxdepth 2 -type f -name "$P" 2>/dev/null || true); do
        FOUND=1
        check_file "$f"
      done
    done
  fi
done

if [ "$FOUND" -eq 0 ]; then
  echo ""
  echo "No se encontraron archivos candidatos en las rutas típicas."
  echo "Lista manual recomendada: ls -la /root ; ls -la ~/royal-bootstrap/keys"
fi

echo ""
echo "==== Escaneo terminado. Archivos temporales en: $TMP ===="
echo "Si quieres borrar los temporales: rm -rf $TMP"