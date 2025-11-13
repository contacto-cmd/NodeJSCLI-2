/**
 * ADMIN DUAL-CONTROL MIDDLEWARE
 * Protección de doble factor para endpoints críticos de administración
 * 
 * Requiere AMBOS:
 * 1. API Key válida con rol 'admin'
 * 2. Master Secret en header x-master-secret
 * 
 * Si falta cualquiera de los dos: ACCESO DENEGADO
 */

const { Pool } = require('pg');

class AdminDualControlMiddleware {
    constructor(authMiddleware, masterSecret, dbPool = null) {
        this.authMiddleware = authMiddleware;
        this.masterSecret = masterSecret;
        this.rateLimiter = new Map();
        this.dbPool = dbPool || new Pool({ connectionString: process.env.DATABASE_URL });
    }

    middleware() {
        return async (req, res, next) => {
            try {
                const ip = req.ip || req.connection.remoteAddress;
                const now = Date.now();
                
                if (!this.checkRateLimit(ip, now)) {
                    await this.logToDatabase(ip, null, 'rate_limit_exceeded', false, req);
                    return res.status(429).json({
                        success: false,
                        error: 'Demasiados intentos. Espere 1 minuto.',
                        tipo: 'rate_limit_admin'
                    });
                }

                const masterSecretProvided = req.headers['x-master-secret'];
                if (!masterSecretProvided) {
                    this.logFailedAttempt(ip, 'master_secret_missing');
                    await this.logToDatabase(ip, null, 'master_secret_missing', false, req);
                    return res.status(401).json({
                        success: false,
                        error: 'Master Secret requerido',
                        tipo: 'missing_master_secret'
                    });
                }

                if (!this.timingSafeEqual(masterSecretProvided, this.masterSecret)) {
                    this.logFailedAttempt(ip, 'master_secret_invalid');
                    await this.logToDatabase(ip, null, 'master_secret_invalid', false, req);
                    return res.status(403).json({
                        success: false,
                        error: 'Master Secret inválido',
                        tipo: 'invalid_master_secret'
                    });
                }

                const adminAuthMiddleware = this.authMiddleware.middleware(['admin']);
                
                adminAuthMiddleware(req, res, async (err) => {
                    if (err) {
                        this.logFailedAttempt(ip, 'api_key_failed');
                        await this.logToDatabase(ip, null, 'api_key_failed', false, req);
                        return next(err);
                    }

                    this.logSuccessfulAccess(req);
                    const apiKeyId = req.apiKeyData?.id || null;
                    await this.logToDatabase(ip, apiKeyId, 'access_granted', true, req);
                    next();
                });

            } catch (error) {
                console.error('Error en AdminDualControlMiddleware:', error);
                res.status(500).json({
                    success: false,
                    error: 'Error interno de autenticación'
                });
            }
        };
    }

    checkRateLimit(ip, now) {
        const WINDOW_MS = 60000;
        const MAX_ATTEMPTS = 5;

        if (!this.rateLimiter.has(ip)) {
            this.rateLimiter.set(ip, []);
        }

        const attempts = this.rateLimiter.get(ip);
        const recentAttempts = attempts.filter(timestamp => now - timestamp < WINDOW_MS);
        
        if (recentAttempts.length >= MAX_ATTEMPTS) {
            return false;
        }

        recentAttempts.push(now);
        this.rateLimiter.set(ip, recentAttempts);
        
        return true;
    }

    logFailedAttempt(ip, reason) {
        console.warn(`⚠️ ADMIN ACCESS DENIED: IP=${ip}, Reason=${reason}, Time=${new Date().toISOString()}`);
    }

    logSuccessfulAccess(req) {
        const ip = req.ip || req.connection.remoteAddress;
        const apiKeyName = req.apiKeyData?.nombre || 'Unknown';
        console.log(`✅ ADMIN ACCESS GRANTED: IP=${ip}, APIKey=${apiKeyName}, Time=${new Date().toISOString()}`);
    }

    async logToDatabase(ip, apiKeyId, evento, exitoso, req) {
        try {
            const userAgent = req.headers['user-agent'] || null;
            const detalles = {
                endpoint: req.path,
                method: req.method,
                headers: {
                    'x-master-secret': req.headers['x-master-secret'] ? '[REDACTED]' : null,
                    'authorization': req.headers['authorization'] ? '[REDACTED]' : null
                }
            };

            await this.dbPool.query(`
                INSERT INTO admin_audit_log 
                (ip_origen, api_key_id, evento, exitoso, detalles, user_agent)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [ip, apiKeyId, evento, exitoso, JSON.stringify(detalles), userAgent]);
        } catch (error) {
            console.error('Error guardando en admin_audit_log:', error);
        }
    }

    timingSafeEqual(a, b) {
        if (typeof a !== 'string' || typeof b !== 'string') {
            return false;
        }
        
        if (a.length !== b.length) {
            return false;
        }
        
        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }
        
        return result === 0;
    }

    cleanupOldEntries() {
        const now = Date.now();
        const WINDOW_MS = 60000;
        
        for (const [ip, attempts] of this.rateLimiter.entries()) {
            const recentAttempts = attempts.filter(timestamp => now - timestamp < WINDOW_MS);
            if (recentAttempts.length === 0) {
                this.rateLimiter.delete(ip);
            } else {
                this.rateLimiter.set(ip, recentAttempts);
            }
        }
    }
}

setInterval(() => {
    if (global.adminDualControlMiddleware) {
        global.adminDualControlMiddleware.cleanupOldEntries();
    }
}, 60000);

module.exports = AdminDualControlMiddleware;
