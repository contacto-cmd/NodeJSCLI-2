#!/usr/bin/env node
'use strict';
/**
 * Demo REAL: sella un archivo, guarda su certificado y lo verifica.
 * Uso:  node bin/seal-demo.js <ruta-al-archivo>
 *
 * Esto es lo unico que de verdad importa de tu producto, funcionando sin adornos.
 */

const { sealFile, verifyFile, saveSeal } = require('../lib/seal');

const file = process.argv[2];
if (!file) {
  console.log('Uso: node bin/seal-demo.js <ruta-al-archivo>');
  process.exit(1);
}

const seal = sealFile(file, { owner: 'Roberto Rivera Gamas - Street Emporio Royal' });
console.log('\n=== CERTIFICADO DE SELLADO (REAL) ===');
console.log(JSON.stringify(seal, null, 2));

const out = saveSeal(seal, file + '.seal.json');
console.log('\nCertificado guardado en: ' + out);

const check = verifyFile(file, seal);
console.log('Verificacion: ' + (check.valid ? 'VALIDO' : 'ALTERADO'));
