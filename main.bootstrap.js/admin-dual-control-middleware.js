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

class AdminDualControlMiddleware {
    constructor(authMiddleware, masterSecret) {
        this.authMiddleware = authMiddleware;
        this.masterSecret = masterSecret;
        this.rateLimiter = new Map();
    }

    middleware() {
        return async (req, res, next) => {
            try {
                const ip = req.ip || req.connection.remoteAddress;
                const now = Date.now();
                
                if (!this.checkRateLimit(ip, now)) {
                    return res.status(429).json({
                        success: false,
                        error: 'Demasiados intentos. Espere 1 minuto.',
                        tipo: 'rate_limit_admin'
                    });
                }

                const masterSecretProvided = req.headers['x-master-secret'];
                if (!masterSecretProvided) {
                    this.logFailedAttempt(ip, 'master_secret_missing');
                    return res.status(401).json({
                        success: false,
                        error: 'Master Secret requerido',
                        tipo: 'missing_master_secret'
                    });
                }

                if (masterSecretProvided !== this.masterSecret) {
                    this.logFailedAttempt(ip, 'master_secret_invalid');
                    return res.status(403).json({
                        success: false,
                        error: 'Master Secret inválido',
                        tipo: 'invalid_master_secret'
                    });
                }

                const adminAuthMiddleware = this.authMiddleware.middleware(['admin']);
                
                adminAuthMiddleware(req, res, (err) => {
                    if (err) {
                        this.logFailedAttempt(ip, 'api_key_failed');
                        return next(err);
                    }

                    this.logSuccessfulAccess(req);
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
