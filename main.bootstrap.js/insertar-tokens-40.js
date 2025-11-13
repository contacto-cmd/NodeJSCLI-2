/**
 * Script para insertar los 40 tokens FUSION en PostgreSQL
 * Ejecutar UNA VEZ
 */

const { Pool } = require('pg');
const { TOKENS_FUSION_40 } = require('./tokens-completos-40');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function insertarTokens() {
  try {
    console.log('🚀 Insertando 40 tokens FUSION...\n');

    for (const token of TOKENS_FUSION_40) {
      try {
        // Verificar si ya existe
        const existe = await pool.query(
          'SELECT token_code FROM fusion_tokens WHERE token_code = $1',
          [token.tokenCode]
        );

        if (existe.rows.length > 0) {
          console.log(`⏭️  ${token.tokenCode} ya existe - saltando`);
          continue;
        }

        // Insertar nuevo token
        await pool.query(`
          INSERT INTO fusion_tokens 
          (token_code, nombre, tier, precio_usd, servicios, activo)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          token.tokenCode,
          token.nombre,
          token.tier,
          token.precioUsd,
          JSON.stringify(token.servicios),
          true
        ]);

        console.log(`✅ ${token.tokenCode} - ${token.nombre} ($${token.precioUsd.toLocaleString()})`);
      } catch (err) {
        console.error(`❌ Error insertando ${token.tokenCode}:`, err.message);
      }
    }

    // Verificar total
    const total = await pool.query('SELECT COUNT(*) FROM fusion_tokens');
    const valorTotal = await pool.query('SELECT SUM(precio_usd) FROM fusion_tokens');

    console.log('\n📊 RESUMEN FINAL:');
    console.log(`Total tokens: ${total.rows[0].count}`);
    console.log(`Valor total: $${parseInt(valorTotal.rows[0].sum).toLocaleString()} USD`);

    await pool.end();
    console.log('\n✅ Inserción completada');
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

insertarTokens();
