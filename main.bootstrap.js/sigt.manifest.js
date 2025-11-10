// scripts/sign-manifest.js
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

const [
  ,
  ,
  manifestPath = "package.json",
  outSig = "signatures/package.json.sig",
] = process.argv;

if (!fs.existsSync(manifestPath)) {
  console.error("Manifest no existe:", manifestPath);
  process.exit(2);
}

// Cargar private key: preferir variable de entorno RSA_PRIVATE (base64) o fichero local
let privateKeyPem = process.env.RSA_PRIVATE_PEM || null;
if (privateKeyPem) {
  // si viene en base64, decodificar
  try {
    const maybeDecoded = Buffer.from(privateKeyPem, "base64").toString();
    // detectar si es pem o base64 de pem
    if (
      maybeDecoded.includes("BEGIN RSA PRIVATE KEY") ||
      maybeDecoded.includes("BEGIN PRIVATE KEY")
    ) {
      privateKeyPem = maybeDecoded;
    } else {
      // si no contiene PEM, asumimos la variable ya es PEM
      // en caso contrario, mantenemos la original
    }
  } catch (e) {
    // keep original
  }
} else {
  const localPath = path.join(process.cwd(), "keys", "rsa-4096-private.pem");
  if (fs.existsSync(localPath)) {
    privateKeyPem = fs.readFileSync(localPath, "utf8");
  } else {
    console.error(
      "No se encontró private key en RSA_PRIVATE_PEM (env) ni en keys/rsa-4096-private.pem",
    );
    process.exit(3);
  }
}

const manifest = fs.readFileSync(manifestPath);
const sign = crypto.createSign("RSA-SHA256");
sign.update(manifest);
const signature = sign.sign(privateKeyPem);
fs.mkdirSync(path.dirname(outSig), { recursive: true });
fs.writeFileSync(outSig, signature);
console.log("Manifest firmado:", manifestPath, "->", outSig);
process.exit(0);