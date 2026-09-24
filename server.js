'use strict';
/**
 * THRONE Protocol - API de Sellado (Street Emporio Royal)
 * -------------------------------------------------------
 * Servicio HTTP real para sellado criptografico de documentos.
 * Esto es lo que un cliente contrata y consume: no es una pantalla, es una API.
 *
 * Endpoints:
 *   GET  /health                 Estado del servicio.
 *   POST /api/v1/seal            Sella un documento. Acepta un hash ya calculado
 *                                (recomendado: el archivo nunca sale de casa del
 *                                cliente) o el contenido en base64.
 *   POST /api/v1/verify          Verifica un documento contra un certificado.
 *   POST /api/v1/anchor/upgrade  Completa un recibo pendiente con el bloque de
 *                                Bitcoin ya confirmado.
 *
 * Nota de diseno que vale dinero frente a un despacho:
 * el modo recomendado es que el cliente calcule el SHA-256 en su maquina y nos
 * mande SOLO el hash. Asi su documento confidencial nunca viaja ni se almacena
 * aqui. Eso es privacidad por diseno, y es un argumento de venta real.
 */

const express = require('express');
const crypto = require('crypto');
const { sha256, SEAL_VERSION } = require('./lib/seal');
const { anchorHash, upgradeReceipt } = require('./lib/anchor');

const app = express();
app.use(express.json({ limit: '25mb' }));

const OWNER = process.env.SEAL_OWNER || 'Street Emporio Royal';
const API_KEYS = (process.env.SEAL_API_KEYS || '')
  .split(',')
  .map((k) => k.trim())
  .filter(Boolean);

/** Autenticacion simple por API key. Si no hay claves configuradas, queda abierto. */
function requireKey(req, res, next) {
  if (API_KEYS.length === 0) return next();
  const provided = req.get('x-api-key') || '';
  const ok = API_KEYS.some((k) => {
    const a = Buffer.from(k);
    const b = Buffer.from(provided);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
  if (!ok) return res.status(401).json({ error: 'API key invalida o ausente' });
  next();
}

const HEX64 = /^[0-9a-f]{64}$/i;

/** Obtiene el SHA-256 del cuerpo, venga como hash directo o como contenido. */
function resolveHash(body) {
  if (body.sha256) {
    if (!HEX64.test(body.sha256)) {
      throw Object.assign(new Error('sha256 debe ser hexadecimal de 64 caracteres'), {
        status: 400,
      });
    }
    return { hash: body.sha256.toLowerCase(), sizeBytes: null, mode: 'hash-only' };
  }
  if (body.contentBase64) {
    const buf = Buffer.from(body.contentBase64, 'base64');
    if (buf.length === 0) {
      throw Object.assign(new Error('contentBase64 esta vacio o mal codificado'), {
        status: 400,
      });
    }
    return { hash: sha256(buf), sizeBytes: buf.length, mode: 'content-upload' };
  }
  throw Object.assign(
    new Error('Envia "sha256" (recomendado) o "contentBase64"'),
    { status: 400 }
  );
}

app.get('/health', (req, res) => {
  res.json({
    service: 'throne-seal-api',
    version: SEAL_VERSION,
    status: 'ok',
    time: new Date().toISOString(),
  });
});

app.post('/api/v1/seal', requireKey, async (req, res) => {
  try {
    const { hash, sizeBytes, mode } = resolveHash(req.body || {});

    const certificate = {
      version: SEAL_VERSION,
      documentName: req.body.documentName || null,
      algorithm: 'SHA-256',
      sha256: hash,
      sizeBytes,
      privacyMode: mode,
      sealedAt: new Date().toISOString(),
      owner: OWNER,
      bitcoinAnchor: null,
      disclaimer:
        'Prueba de existencia e integridad del documento en la fecha indicada. ' +
        'No constituye constancia NOM-151 ni acto notarial.',
    };

    if (req.body.anchor !== false) {
      try {
        certificate.bitcoinAnchor = await anchorHash(hash);
      } catch (err) {
        certificate.bitcoinAnchor = { status: 'failed', reason: err.message };
      }
    }

    res.status(201).json(certificate);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.post('/api/v1/verify', requireKey, (req, res) => {
  try {
    const { certificate } = req.body || {};
    if (!certificate || !HEX64.test(certificate.sha256 || '')) {
      return res.status(400).json({ error: 'Falta un certificado valido con sha256' });
    }
    const { hash } = resolveHash(req.body || {});
    const valid = hash === certificate.sha256.toLowerCase();

    res.json({
      valid,
      expected: certificate.sha256.toLowerCase(),
      actual: hash,
      sealedAt: certificate.sealedAt || null,
      verdict: valid
        ? 'El documento es identico al que fue sellado. Integridad intacta.'
        : 'El documento NO coincide con el certificado. Fue alterado o es otro archivo.',
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.post('/api/v1/anchor/upgrade', requireKey, async (req, res) => {
  try {
    const { otsReceiptBase64 } = req.body || {};
    if (!otsReceiptBase64) {
      return res.status(400).json({ error: 'Falta otsReceiptBase64' });
    }
    res.json(await upgradeReceipt(otsReceiptBase64));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.use((req, res) => res.status(404).json({ error: 'Endpoint no encontrado' }));

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`THRONE Seal API escuchando en puerto ${PORT}`);
  });
}

module.exports = app;
