#!/bin/sh
set -e

# CONFIG: ajusta aquí si quieres otro folder
PROJECT_DIR="${PROJECT_DIR:-$HOME/royal-bootstrap}"
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

echo "=== Inicializando Royal Bootstrap en $PROJECT_DIR ==="

# 1) Estructura mínima
mkdir -p public scripts keys signatures .github/workflows logs

# 2) package.json (simple)
cat > package.json <<'JSON'
{
  "name": "royal-empire-starter",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "serve-static": "^1.15.0",
    "jsonwebtoken": "^9.0.0"
  }
}
JSON

# 3) server.js (sirve frontend y endpoints de certificado y verificación)
cat > server.js <<'JS'
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(require('serve-static')(path.join(__dirname,'public')));

// health
app.get('/api/health', (req,res) => res.json({ok:true, ts: Date.now()}));

// sirve el payload json del certificado
app.get('/certificate', (req,res) => {
  const p = path.join(__dirname,'signatures','certificate.json');
  if(!fs.existsSync(p)) return res.status(404).json({ok:false, error:'certificate.json missing'});
  res.sendFile(p);
});

// sirve token JWT firmado
app.get('/certificate/token', (req,res) => {
  const p = path.join(__dirname,'signatures','certificate.jwt');
  if(!fs.existsSync(p)) return res.status(404).json({ok:false, error:'certificate.jwt missing'});
  res.type('text/plain').send(fs.readFileSync(p,'utf8'));
});

// fingerprint
app.get('/keys/fingerprint', (req,res) => {
  const p = path.join(__dirname,'keys','fingerprint.txt');
  if(!fs.existsSync(p)) return res.status(404).json({ok:false, error:'fingerprint missing'});
  res.type('text/plain').send(fs.readFileSync(p,'utf8'));
});

app.listen(PORT, ()=> console.log('Royal server listening on', PORT));
JS

# 4) página pública simple para ver el visualizador y link al certificado
cat > public/index.html <<'HTML'
<!doctype html>
<html><head><meta charset="utf-8"><title>Royal Emporio - Visualizador</title>
<style>body{font-family:sans-serif;background:#111;color:#eee} .wrap{padding:18px} a{color:#8fe}</style>
</head><body>
<div class="wrap">
  <h1>Royal Emporio — Visualizador</h1>
  <p>Proyecto: Arte Visualista — Diseño de Arquitectura Empresarial Futurista</p>
  <p><a href="/certificate">Ver certificado (JSON)</a> — <a href="/certificate/token">Descargar token JWT</a></p>
  <p><a href="/keys/fingerprint">Huella pública SHA-256</a></p>
  <div style="width:100%;height:480px;background:#222;color:#777;display:flex;align-items:center;justify-content:center">
    <div>Visualizador 3D (placeholder) — pega tu modelo GLTF en /public y edita index para verlo.</div>
  </div>
</div>
</body></html>
HTML

# 5) Script Node para crear certificado JWT (usa private key si existe)
cat > scripts/create-certificate.js <<'JS'
const fs = require('fs'), path = require('path'), jwt = require('jsonwebtoken');
const keysDir = path.join(process.cwd(),'keys');
const privPath = path.join(keysDir,'rsa-4096-private.pem');
const pubPath = path.join(keysDir,'rsa-4096-public.pem');
if(!fs.existsSync(privPath)) { console.error('PRIVATE KEY MISSING at', privPath); process.exit(2); }
const priv = fs.readFileSync(privPath,'utf8');

// payload: personaliza aquí
const payload = {
  iss: "Royal Emporio",
  sub: "Roberto Rivera Gamas",
  rfc: "RIGR840827PJ0",
  title: "Arte Visualista - Diseñador de Arquitectura Empresarial Futurista",
  domain: "streetemporioroyal.com",
  email: "tu@streetemporioroyal.com",
  iat: Math.floor(Date.now()/1000),
  valid_until: Math.floor(Date.now()/1000) + (60*60*24*365)
};

const token = jwt.sign(payload, priv, { algorithm: 'RS256', expiresIn: '365d' });
fs.writeFileSync(path.join(process.cwd(),'signatures','certificate.jwt'), token, 'utf8');
fs.writeFileSync(path.join(process.cwd(),'signatures','certificate.json'), JSON.stringify(payload,null,2), 'utf8');
console.log('CERTIFICATE CREATED: signatures/certificate.jwt and .json');
console.log('JWT sample (first 200 chars):', token.slice(0,200));
JS

# 6) Si no existe key publica/privada, CREA UNA RSA-4096 (para pruebas)
if [ ! -f keys/rsa-4096-private.pem ] || [ ! -f keys/rsa-4096-public.pem ]; then
  echo "No se encontraron claves en keys/ — generando par RSA-4096 de prueba (guardalo seguro si quieres usarlo)."
  openssl genpkey -algorithm RSA -out keys/rsa-4096-private.pem -pkeyopt rsa_keygen_bits:4096
  openssl rsa -pubout -in keys/rsa-4096-private.pem -out keys/rsa-4096-public.pem
fi

# 7) Generar fingerprint SHA-256 de la public key y guardarlo
openssl pkey -in keys/rsa-4096-public.pem -pubin -outform DER 2>/dev/null | openssl dgst -sha256 | awk '{print $2}' | xxd -r -p | xxd -p -c32 | sed 's/../&&:/g;s/:$//' > keys/fingerprint.txt || true
# produce en hex con ":" separators for readability
# also create base64 fingerprint
openssl pkey -in keys/rsa-4096-public.pem -pubin -outform DER 2>/dev/null | openssl dgst -sha256 -binary | openssl enc -base64 > keys/fingerprint.base64

echo "Fingerprint (hex w/ colons) ->"
cat keys/fingerprint.txt || true
echo ""
echo "Fingerprint (base64) ->"
cat keys/fingerprint.base64 || true

# 8) instalar dependencias si npm disponible
if command -v npm >/dev/null 2>&1; then
  echo "Instalando dependencias npm..."
  npm install --silent
else
  echo "npm no encontrado: instala nodejs/npm en iSH o usa Replit shell."
fi

# 9) crear certificado JWT usando la clave privada (script Node)
node scripts/create-certificate.js || { echo "Fallo creando certificado con private key."; exit 1; }

# 10) arrancar el servidor en background y mantener logs
pkill -f server.js || true
node server.js > logs/server.log 2>&1 &

sleep 1
echo "Servidor arrancado. Revisa logs/server.log para detalles."
echo "Endpoints:"
echo " - Health: http://localhost:3000/api/health"
echo " - Cert JSON: http://localhost:3000/certificate"
echo " - Cert token: http://localhost:3000/certificate/token"
echo " - Fingerprint: http://localhost:3000/keys/fingerprint"
echo ""
echo "Si estás en Replit, abre la URL pública de tu Repl para ver la página (Open)."
echo "Si estás en iSH local y no tienes reenvío, usa ngrok o sube a Replit para exponer URL pública."
echo "Archivos generados:"
ls -la signatures keys public logs
echo "=== FIN DEL BLOQUE ==="