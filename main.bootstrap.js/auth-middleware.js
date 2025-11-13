const crypto = require('crypto');

class AuthMiddleware {
  constructor(databaseService) {
    this.pool = databaseService.pool;
    this.rateLimitMap = new Map();
  }

  generateApiKey() {
    return 'fus_' + crypto.randomBytes(32).toString('hex');
  }

  hashApiKey(apiKey) {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  async createApiKey(nombre, propietario, email, permisos = ['read'], rateLimit = 10, expiresInDays = 365) {
    const apiKey = this.generateApiKey();
    const keyHash = this.hashApiKey(apiKey);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const query = `
      INSERT INTO fusion_api_keys 
      (key_hash, nombre, propietario, email, activo, permisos, rate_limit, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, nombre, propietario, created_at
    `;

    const result = await this.pool.query(query, [
      keyHash,
      nombre,
      propietario,
      email,
      true,
      JSON.stringify(permisos),
      rateLimit,
      expiresAt
    ]);

    return {
      success: true,
      apiKey,
      keyInfo: result.rows[0],
      mensaje: '⚠️ GUARDA ESTA API KEY - No se mostrará de nuevo',
      expiresAt
    };
  }

  async verificarApiKey(apiKey) {
    if (!apiKey || !apiKey.startsWith('fus_')) {
      return { valido: false, error: 'API key inválida' };
    }

    const keyHash = this.hashApiKey(apiKey);

    const query = `
      SELECT id, nombre, propietario, email, activo, permisos, rate_limit, expires_at, ultimo_uso
      FROM fusion_api_keys
      WHERE key_hash = $1
    `;

    const result = await this.pool.query(query, [keyHash]);

    if (result.rows.length === 0) {
      return { valido: false, error: 'API key no encontrada' };
    }

    const keyData = result.rows[0];

    if (!keyData.activo) {
      return { valido: false, error: 'API key desactivada' };
    }

    if (keyData.expires_at && new Date() > new Date(keyData.expires_at)) {
      return { valido: false, error: 'API key expirada' };
    }

    await this.pool.query(
      'UPDATE fusion_api_keys SET ultimo_uso = NOW() WHERE id = $1',
      [keyData.id]
    );

    return {
      valido: true,
      keyData: {
        id: keyData.id,
        nombre: keyData.nombre,
        propietario: keyData.propietario,
        permisos: keyData.permisos,
        rateLimit: keyData.rate_limit
      }
    };
  }

  checkRateLimit(keyId, limit) {
    const now = Date.now();
    const windowMs = 60000;
    const key = `key_${keyId}`;

    if (!this.rateLimitMap.has(key)) {
      this.rateLimitMap.set(key, []);
    }

    const requests = this.rateLimitMap.get(key);
    const recentRequests = requests.filter(timestamp => now - timestamp < windowMs);

    if (recentRequests.length >= limit) {
      return {
        permitido: false,
        mensaje: `Rate limit excedido. Máximo ${limit} requests por minuto`,
        resetEn: Math.ceil((recentRequests[0] + windowMs - now) / 1000)
      };
    }

    recentRequests.push(now);
    this.rateLimitMap.set(key, recentRequests);

    return {
      permitido: true,
      restantes: limit - recentRequests.length
    };
  }

  middleware(requierePermisos = []) {
    return async (req, res, next) => {
      try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            success: false,
            error: 'API key requerida. Formato: Authorization: Bearer fus_...'
          });
        }

        const apiKey = authHeader.substring(7);

        const verificacion = await this.verificarApiKey(apiKey);

        if (!verificacion.valido) {
          return res.status(401).json({
            success: false,
            error: verificacion.error
          });
        }

        const rateLimit = this.checkRateLimit(
          verificacion.keyData.id,
          verificacion.keyData.rateLimit
        );

        if (!rateLimit.permitido) {
          return res.status(429).json({
            success: false,
            error: rateLimit.mensaje,
            resetEn: rateLimit.resetEn
          });
        }

        if (requierePermisos.length > 0) {
          const permisos = verificacion.keyData.permisos;
          const tienePermiso = requierePermisos.some(p => permisos.includes(p));

          if (!tienePermiso) {
            return res.status(403).json({
              success: false,
              error: `Permisos insuficientes. Requiere: ${requierePermisos.join(' o ')}`
            });
          }
        }

        req.apiKeyData = verificacion.keyData;
        req.rateLimitRestantes = rateLimit.restantes;
        next();
      } catch (error) {
        console.error('Error en autenticación:', error);
        res.status(500).json({
          success: false,
          error: 'Error verificando autenticación'
        });
      }
    };
  }

  async listarApiKeys() {
    const query = `
      SELECT id, nombre, propietario, email, activo, permisos, rate_limit, 
             ultimo_uso, created_at, expires_at
      FROM fusion_api_keys
      ORDER BY created_at DESC
    `;

    const result = await this.pool.query(query);
    return {
      success: true,
      total: result.rows.length,
      keys: result.rows
    };
  }

  async desactivarApiKey(keyId) {
    const query = `
      UPDATE fusion_api_keys
      SET activo = false
      WHERE id = $1
      RETURNING nombre, propietario
    `;

    const result = await this.pool.query(query, [keyId]);

    if (result.rows.length === 0) {
      return { success: false, error: 'API key no encontrada' };
    }

    return {
      success: true,
      mensaje: `API key desactivada: ${result.rows[0].nombre}`
    };
  }
}

module.exports = AuthMiddleware;
