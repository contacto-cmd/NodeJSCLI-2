'use strict';
/**
 * THRONE Protocol - Anclaje real a Bitcoin (OpenTimestamps)
 * ---------------------------------------------------------
 * Este modulo cierra el pendiente que lib/seal.js dejaba marcado:
 *   bitcoinAnchor: null  ->  recibo OpenTimestamps real
 *
 * Que hace exactamente, sin adornos:
 *   1. Toma el SHA-256 de un documento (32 bytes).
 *   2. Lo envia a los calendar servers publicos de OpenTimestamps.
 *   3. Guarda el recibo .ots devuelto.
 *   4. Mas tarde (1-6 h), el recibo queda anclado en un bloque de Bitcoin
 *      y `upgrade()` lo completa con la prueba definitiva.
 *
 * Que NO hace, y hay que decirlo claro al cliente:
 *   - No es una constancia NOM-151 (eso requiere un PSC acreditado).
 *   - No es un acto notarial.
 *   - Prueba existencia e integridad del documento en una fecha. Nada mas,
 *     y nada menos: eso es exactamente lo que sirve ante el SAT o un juez
 *     para acreditar que un documento ya existia con ese contenido.
 *
 * El anclaje es gratuito. No hay costo por sello.
 */

const fs = require('fs');
const path = require('path');

const CALENDARS = [
  'https://a.pool.opentimestamps.org',
  'https://b.pool.opentimestamps.org',
  'https://a.pool.eternitywall.com',
];

/** Carga perezosa de la libreria: si no esta instalada, lo decimos claro. */
function loadOTS() {
  try {
    return require('opentimestamps');
  } catch (err) {
    const e = new Error(
      'Falta la dependencia "opentimestamps". Instalala con: npm install opentimestamps'
    );
    e.code = 'OTS_MISSING';
    throw e;
  }
}

/**
 * Ancla un hash SHA-256 (hex de 64 caracteres) a Bitcoin via OpenTimestamps.
 * Devuelve el recibo .ots en base64, listo para guardar junto al certificado.
 */
async function anchorHash(sha256Hex, opts = {}) {
  if (!/^[0-9a-f]{64}$/i.test(sha256Hex)) {
    throw new Error('anchorHash espera un SHA-256 en hexadecimal de 64 caracteres');
  }

  const OpenTimestamps = loadOTS();
  const digest = Buffer.from(sha256Hex, 'hex');
  const detached = OpenTimestamps.DetachedTimestampFile.fromHash(
    new OpenTimestamps.Ops.OpSHA256(),
    digest
  );

  await OpenTimestamps.stamp(detached, {
    calendars: opts.calendars || CALENDARS,
    // Basta con que responda uno para tener un recibo util.
    minimum: opts.minimum || 1,
  });

  const receipt = Buffer.from(detached.serializeToBytes());

  return {
    status: 'pending',
    algorithm: 'SHA-256',
    sha256: sha256Hex.toLowerCase(),
    otsReceiptBase64: receipt.toString('base64'),
    calendars: opts.calendars || CALENDARS,
    submittedAt: new Date().toISOString(),
    // Se llena cuando el recibo madura en un bloque real:
    bitcoinBlock: null,
    blockTime: null,
    note:
      'Recibo enviado a los calendar servers. El anclaje en un bloque de Bitcoin ' +
      'tarda normalmente entre 1 y 6 horas. Usa upgradeReceipt() despues de ese ' +
      'plazo para obtener la prueba definitiva con numero de bloque.',
  };
}

/**
 * Intenta completar un recibo pendiente. Si ya quedo anclado en Bitcoin,
 * devuelve el recibo actualizado y los datos verificables del bloque.
 */
async function upgradeReceipt(otsReceiptBase64) {
  const OpenTimestamps = loadOTS();
  const bytes = Buffer.from(otsReceiptBase64, 'base64');
  const detached = OpenTimestamps.DetachedTimestampFile.deserialize(bytes);

  const changed = await OpenTimestamps.upgrade(detached);
  const upgraded = Buffer.from(detached.serializeToBytes()).toString('base64');

  let verification = null;
  try {
    verification = await OpenTimestamps.verify(detached);
  } catch (err) {
    verification = null;
  }

  const bitcoin =
    verification && verification.bitcoin ? verification.bitcoin : null;

  return {
    status: bitcoin ? 'confirmed' : 'pending',
    changed,
    otsReceiptBase64: upgraded,
    bitcoinBlock: bitcoin ? bitcoin.height : null,
    blockTime: bitcoin ? new Date(bitcoin.timestamp * 1000).toISOString() : null,
    explorerUrl: bitcoin
      ? `https://mempool.space/block/${bitcoin.height}`
      : null,
  };
}

/** Guarda el recibo .ots en disco, en su formato binario estandar. */
function saveReceipt(otsReceiptBase64, outPath) {
  const abs = path.resolve(outPath);
  fs.writeFileSync(abs, Buffer.from(otsReceiptBase64, 'base64'));
  return abs;
}

module.exports = { anchorHash, upgradeReceipt, saveReceipt, CALENDARS };
