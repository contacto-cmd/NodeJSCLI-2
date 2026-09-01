'use strict';
/**
 * THRONE Protocol - Sellado Criptografico REAL
 * ---------------------------------------------
 * A diferencia del core decorativo, este modulo SI hace criptografia de verdad:
 * calcula el SHA-256 real de un documento y produce un certificado de sellado
 * verificable. Esa es la prueba de existencia: demuestra que un archivo existio,
 * con ese contenido exacto, en una fecha dada.
 *
 * Producto real de Street Emporio Royal. Sin teatro: si el archivo cambia un solo
 * byte, el hash cambia y verifyFile lo detecta.
 *
 * Siguiente paso (marcado abajo): anclar el hash a Bitcoin via OpenTimestamps.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SEAL_VERSION = 'SER27-SEAL-1.0';

/** SHA-256 real de un buffer, en hexadecimal. */
function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Sella un archivo: lee sus bytes, calcula el SHA-256 real y devuelve un
 * certificado verificable.
 */
function sealFile(filePath, opts = {}) {
  const abs = path.resolve(filePath);
  const buffer = fs.readFileSync(abs);
  return {
    version: SEAL_VERSION,
    fileName: path.basename(abs),
    sizeBytes: buffer.length,
    algorithm: 'SHA-256',
    sha256: sha256(buffer),
    sealedAt: new Date().toISOString(),
    owner: opts.owner || 'Street Emporio Royal',
    // --- Ancla Bitcoin (siguiente paso, NO simulado) ---
    // Para anclar el hash a Bitcoin de forma real y gratuita, usar OpenTimestamps:
    //   npm i opentimestamps
    // Sella `sha256` contra un calendar server y guarda el recibo .ots junto
    // al certificado. Ese recibo es la prueba anclada a la cadena.
    bitcoinAnchor: null, // pendiente: se llena con el recibo OpenTimestamps real
  };
}

/**
 * Verifica un archivo contra un certificado: recalcula el hash y compara.
 * Devuelve valid=true solo si el contenido es identico al sellado.
 */
function verifyFile(filePath, seal) {
  const buffer = fs.readFileSync(path.resolve(filePath));
  const actual = sha256(buffer);
  return { valid: actual === seal.sha256, expected: seal.sha256, actual };
}

/** Guarda el certificado como JSON. */
function saveSeal(seal, outPath) {
  fs.writeFileSync(outPath, JSON.stringify(seal, null, 2));
  return outPath;
}

module.exports = { sha256, sealFile, verifyFile, saveSeal, SEAL_VERSION };
