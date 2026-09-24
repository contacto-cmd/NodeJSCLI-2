'use strict';
/**
 * Pruebas del sellado real. Nada de teatro: si estas pasan, el producto funciona.
 * Ejecutar con: npm test
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { sha256, sealFile, verifyFile } = require('../lib/seal');

function tmpFile(contents) {
  const p = path.join(os.tmpdir(), `seal-test-${crypto.randomUUID()}.txt`);
  fs.writeFileSync(p, contents);
  return p;
}

describe('sellado criptografico SHA-256', () => {
  test('el hash coincide con el SHA-256 conocido de una cadena', () => {
    // Vector de prueba publico y verificable de SHA-256.
    expect(sha256(Buffer.from('abc'))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );
  });

  test('sellar un documento produce un certificado con hash real', () => {
    const file = tmpFile('Contrato de prestacion de servicios - v1');
    const seal = sealFile(file);

    expect(seal.algorithm).toBe('SHA-256');
    expect(seal.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(seal.sizeBytes).toBeGreaterThan(0);
    expect(new Date(seal.sealedAt).toString()).not.toBe('Invalid Date');

    fs.unlinkSync(file);
  });

  test('verificar un documento intacto devuelve valid=true', () => {
    const file = tmpFile('Factura A-001 por 10,000 MXN');
    const seal = sealFile(file);

    expect(verifyFile(file, seal).valid).toBe(true);

    fs.unlinkSync(file);
  });

  test('alterar un solo byte rompe la verificacion', () => {
    const file = tmpFile('Factura A-001 por 10,000 MXN');
    const seal = sealFile(file);

    // El fraude clasico: cambiar el monto despues de firmado.
    fs.writeFileSync(file, 'Factura A-001 por 90,000 MXN');

    const result = verifyFile(file, seal);
    expect(result.valid).toBe(false);
    expect(result.actual).not.toBe(result.expected);

    fs.unlinkSync(file);
  });

  test('dos documentos identicos producen el mismo sello', () => {
    const a = tmpFile('mismo contenido exacto');
    const b = tmpFile('mismo contenido exacto');

    expect(sealFile(a).sha256).toBe(sealFile(b).sha256);

    fs.unlinkSync(a);
    fs.unlinkSync(b);
  });
});
