/**
 * Script de prueba para generar certificados para clientes
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const API_BASE = 'http://localhost:5000';

async function test() {
  try {
    console.log('🧪 PRUEBA: Generación de Certificados para Clientes\n');

    // 1. Obtener API Key
    console.log('[1/5] Obteniendo API Key...');
    const keyQuery = await pool.query(
      'SELECT * FROM fusion_api_keys WHERE activo = true LIMIT 1'
    );

    if (keyQuery.rows.length === 0) {
      console.error('❌ No hay API keys activas');
      process.exit(1);
    }

    const apiKeyData = keyQuery.rows[0];
    console.log(`✅ API Key encontrada: ${apiKeyData.nombre}`);

    // Generar API key real (simulada - en producción se guarda al crear)
    const testApiKey = `fus_test_${crypto.randomBytes(32).toString('hex')}`;

    // 2. Seleccionar token de prueba
    console.log('\n[2/5] Seleccionando token de prueba...');
    const tokenQuery = await pool.query(
      "SELECT * FROM fusion_tokens WHERE token_code = 'AETHER-TORUS-01' LIMIT 1"
    );

    if (tokenQuery.rows.length === 0) {
      console.error('❌ Token AETHER-TORUS-01 no encontrado');
      process.exit(1);
    }

    const token = tokenQuery.rows[0];
    console.log(`✅ Token: ${token.nombre} ($${token.precio_usd})`);

    // 3. Crear licencia de prueba (directamente en DB para prueba)
    console.log('\n[3/5] Creando licencia de prueba...');
    
    const licenseId = crypto.randomUUID();
    const fechaEmision = new Date();
    const fechaExpiracion = new Date(fechaEmision);
    fechaExpiracion.setFullYear(fechaExpiracion.getFullYear() + 1);

    const insertQuery = await pool.query(`
      INSERT INTO fusion_licenses 
      (token_id, license_id, cliente_nombre, cliente_email, cliente_rfc, 
       jwt_firmado, firma_rsa, hash_sha256, fecha_emision, fecha_expiracion, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      token.id,
      licenseId,
      'Microsoft Corporation',
      'licensing@microsoft.com',
      'MSO123456XXX',
      'test_jwt_token',
      'test_firma_rsa',
      crypto.createHash('sha256').update(licenseId).digest('hex'),
      fechaEmision,
      fechaExpiracion,
      JSON.stringify({ test: true })
    ]);

    console.log(`✅ Licencia creada: ${licenseId}`);

    // 4. Generar certificado PDF
    console.log('\n[4/5] Generando certificado PDF...');
    
    const ClientCertificateService = require('./client-certificate-service');
    const CryptoService = require('./crypto-service');
    const DatabaseService = require('./db-service');

    const MASTER_KEY_RSA = process.env.RSA_4096_PRIVADA;
    if (!MASTER_KEY_RSA) {
      console.error('❌ RSA_4096_PRIVADA no configurada');
      process.exit(1);
    }

    const cryptoService = new CryptoService(MASTER_KEY_RSA);
    const dbService = new DatabaseService();
    const certService = new ClientCertificateService(cryptoService, dbService);

    const result = await certService.generarCertificadoCliente(licenseId);

    if (!result.success) {
      console.error('❌ Error generando certificado:', result.error);
      process.exit(1);
    }

    console.log(`✅ Certificado generado: ${result.certificado.archivo}`);
    console.log(`   Path: ${result.certificado.pdfPath}`);
    console.log(`   Cliente: ${result.certificado.clienteNombre}`);
    console.log(`   Token: ${result.certificado.tokenNombre}`);

    // 5. Verificar archivo
    console.log('\n[5/5] Verificando archivo generado...');
    
    const fs = require('fs');
    if (!fs.existsSync(result.certificado.pdfPath)) {
      console.error('❌ Archivo PDF no encontrado');
      process.exit(1);
    }

    const stats = fs.statSync(result.certificado.pdfPath);
    console.log(`✅ Archivo existe: ${(stats.size / 1024).toFixed(2)} KB`);

    // Limpiar (eliminar licencia de prueba)
    await pool.query('DELETE FROM fusion_licenses WHERE license_id = $1', [licenseId]);
    console.log('\n🧹 Licencia de prueba eliminada');

    await pool.end();
    await dbService.pool.end();

    console.log('\n✅ PRUEBA COMPLETADA EXITOSAMENTE\n');
    console.log('📊 RESUMEN:');
    console.log(`   - Licencia de prueba creada: ${licenseId}`);
    console.log(`   - Certificado PDF generado: ${result.certificado.archivo}`);
    console.log(`   - Tamaño del PDF: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`\n🎯 Sistema de certificados para clientes: FUNCIONANDO`);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    await pool.end();
    process.exit(1);
  }
}

test();
