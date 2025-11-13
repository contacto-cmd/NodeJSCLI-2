const crypto = require('crypto');

class FusionService {
  constructor(cryptoService, databaseService) {
    this.cryptoService = cryptoService;
    this.pool = databaseService.pool;
    this.clavePublica = cryptoService.extraerClavePublica();
  }

  async listarTokens(activo = true) {
    try {
      const query = activo 
        ? 'SELECT * FROM fusion_tokens WHERE activo = true ORDER BY tier, precio_usd'
        : 'SELECT * FROM fusion_tokens ORDER BY tier, precio_usd';
      
      const result = await this.pool.query(query);
      return {
        success: true,
        total: result.rows.length,
        tokens: result.rows
      };
    } catch (error) {
      console.error('Error listando tokens:', error);
      return { success: false, error: error.message };
    }
  }

  async obtenerToken(tokenCode) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM fusion_tokens WHERE token_code = $1',
        [tokenCode]
      );
      
      if (result.rows.length === 0) {
        return { success: false, error: 'Token no encontrado' };
      }

      return { success: true, token: result.rows[0] };
    } catch (error) {
      console.error('Error obteniendo token:', error);
      return { success: false, error: error.message };
    }
  }

  async emitirLicencia(tokenCode, clienteData) {
    try {
      const tokenResult = await this.obtenerToken(tokenCode);
      if (!tokenResult.success) {
        return tokenResult;
      }

      const token = tokenResult.token;
      
      if (!token.activo) {
        return { success: false, error: 'Token no disponible' };
      }

      const licenseId = crypto.randomUUID();
      const fechaEmision = new Date();
      const fechaExpiracion = new Date(fechaEmision);
      fechaExpiracion.setFullYear(fechaExpiracion.getFullYear() + 1);

      const licensePayload = {
        licenseId,
        tokenCode: token.token_code,
        tokenNombre: token.nombre,
        tier: token.tier,
        precioUsd: token.precio_usd,
        servicios: token.servicios,
        cliente: {
          nombre: clienteData.nombre,
          email: clienteData.email,
          rfc: clienteData.rfc || null
        },
        fechaEmision: fechaEmision.toISOString(),
        fechaExpiracion: fechaExpiracion.toISOString(),
        emisor: 'Roberto Rivera Gamas',
        rfcEmisor: 'RIGR840827PJ0'
      };

      const jwtFirmado = this.cryptoService.generarJWT(licensePayload, '1y');
      const hashSha256 = this.cryptoService.generarHash(JSON.stringify(licensePayload));
      const firmaResult = this.cryptoService.firmarRSA(licensePayload);

      const insertQuery = `
        INSERT INTO fusion_licenses 
        (token_id, license_id, cliente_nombre, cliente_email, cliente_rfc, 
         jwt_firmado, firma_rsa, hash_sha256, fecha_emision, fecha_expiracion, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const insertResult = await this.pool.query(insertQuery, [
        token.id,
        licenseId,
        clienteData.nombre,
        clienteData.email,
        clienteData.rfc || null,
        jwtFirmado,
        firmaResult.firma,
        hashSha256,
        fechaEmision,
        fechaExpiracion,
        JSON.stringify({
          ipOrigen: clienteData.ipOrigen || null,
          userAgent: clienteData.userAgent || null
        })
      ]);

      const insertedLicense = insertResult.rows[0];

      await this.pool.query(`
        INSERT INTO fusion_audit 
        (license_id, token_code, evento, ip_origen, user_agent, resultado, detalles)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        insertedLicense.id,
        token.token_code,
        'issued',
        clienteData.ipOrigen || null,
        clienteData.userAgent || null,
        true,
        JSON.stringify({
          cliente: clienteData.nombre,
          precio: token.precio_usd
        })
      ]);

      console.log(`✅ Licencia ${licenseId} emitida para ${clienteData.nombre}`);

      const fingerprint = this.cryptoService.generarFingerprint(this.clavePublica);

      return {
        success: true,
        license: {
          licenseId,
          tokenCode: token.token_code,
          tokenNombre: token.nombre,
          tier: token.tier,
          precioUsd: token.precio_usd,
          cliente: licensePayload.cliente,
          fechaEmision,
          fechaExpiracion,
          jwtFirmado,
          firmaRsa: firmaResult.firma,
          fingerprint
        }
      };
    } catch (error) {
      console.error('Error emitiendo licencia:', error);
      return { success: false, error: error.message };
    }
  }

  async verificarLicencia(licenseId, jwtFirmado) {
    try {
      const verifyResult = this.cryptoService.verificarJWT(jwtFirmado, this.clavePublica);
      
      if (!verifyResult.valido) {
        await this.pool.query(`
          INSERT INTO fusion_audit (token_code, evento, resultado, detalles)
          VALUES ($1, $2, $3, $4)
        `, ['UNKNOWN', 'verified', false, JSON.stringify({ error: verifyResult.error })]);

        return {
          success: false,
          valido: false,
          error: verifyResult.error
        };
      }

      const result = await this.pool.query(
        'SELECT * FROM fusion_licenses WHERE license_id = $1',
        [licenseId]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'Licencia no encontrada' };
      }

      const license = result.rows[0];

      if (license.revocado) {
        await this.pool.query(`
          INSERT INTO fusion_audit (license_id, token_code, evento, resultado, detalles)
          VALUES ($1, $2, $3, $4, $5)
        `, [license.id, verifyResult.payload.tokenCode, 'verified', false, 
            JSON.stringify({ error: 'Licencia revocada' })]);

        return {
          success: true,
          valido: false,
          error: 'Licencia revocada',
          motivo: license.motivo_revocacion
        };
      }

      const ahora = new Date();
      if (ahora > license.fecha_expiracion) {
        await this.pool.query(`
          INSERT INTO fusion_audit (license_id, token_code, evento, resultado, detalles)
          VALUES ($1, $2, $3, $4, $5)
        `, [license.id, verifyResult.payload.tokenCode, 'verified', false,
            JSON.stringify({ error: 'Licencia expirada' })]);

        return {
          success: true,
          valido: false,
          error: 'Licencia expirada'
        };
      }

      await this.pool.query(`
        INSERT INTO fusion_audit (license_id, token_code, evento, resultado, detalles)
        VALUES ($1, $2, $3, $4, $5)
      `, [license.id, verifyResult.payload.tokenCode, 'verified', true,
          JSON.stringify({ cliente: license.cliente_nombre })]);

      return {
        success: true,
        valido: true,
        license: {
          licenseId: license.license_id,
          tokenCode: verifyResult.payload.tokenCode,
          cliente: license.cliente_nombre,
          fechaEmision: license.fecha_emision,
          fechaExpiracion: license.fecha_expiracion
        }
      };
    } catch (error) {
      console.error('Error verificando licencia:', error);
      return { success: false, error: error.message };
    }
  }

  async obtenerLicencia(licenseId) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM fusion_licenses WHERE license_id = $1',
        [licenseId]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'Licencia no encontrada' };
      }

      return { success: true, license: result.rows[0] };
    } catch (error) {
      console.error('Error obteniendo licencia:', error);
      return { success: false, error: error.message };
    }
  }

  async revocarLicencia(licenseId, motivo) {
    try {
      const result = await this.pool.query(`
        UPDATE fusion_licenses
        SET revocado = true, motivo_revocacion = $1
        WHERE license_id = $2
        RETURNING *
      `, [motivo, licenseId]);

      if (result.rows.length === 0) {
        return { success: false, error: 'Licencia no encontrada' };
      }

      const updated = result.rows[0];

      await this.pool.query(`
        INSERT INTO fusion_audit (license_id, evento, resultado, detalles)
        VALUES ($1, $2, $3, $4)
      `, [updated.id, 'revoked', true, JSON.stringify({ motivo })]);

      return {
        success: true,
        message: 'Licencia revocada exitosamente'
      };
    } catch (error) {
      console.error('Error revocando licencia:', error);
      return { success: false, error: error.message };
    }
  }

  async obtenerEstadisticas() {
    try {
      const tokensResult = await this.pool.query('SELECT * FROM fusion_tokens');
      const licensesResult = await this.pool.query('SELECT * FROM fusion_licenses');
      
      const totalTokens = tokensResult.rows;
      const totalLicenses = licensesResult.rows;
      const licensesActivas = totalLicenses.filter(l => !l.revocado && new Date() < new Date(l.fecha_expiracion));
      
      const ingresosTotales = licensesActivas.reduce((sum, lic) => {
        const token = totalTokens.find(t => t.id === lic.token_id);
        return sum + (token ? token.precio_usd : 0);
      }, 0);

      return {
        success: true,
        estadisticas: {
          totalTokens: totalTokens.length,
          tokensActivos: totalTokens.filter(t => t.activo).length,
          totalLicencias: totalLicenses.length,
          licenciasActivas: licensesActivas.length,
          licenciasRevocadas: totalLicenses.filter(l => l.revocado).length,
          ingresosTotalesUsd: ingresosTotales
        }
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = FusionService;
