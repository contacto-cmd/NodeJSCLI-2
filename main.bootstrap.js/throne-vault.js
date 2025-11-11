// Archivo: throne-vault.js (Sistema de Bóveda Personal con Encriptación RSA)
// -----------------------------------------------------

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// =================================================================
// CONFIGURACIÓN DE CLAVES
// =================================================================

// Cargar las claves RSA del usuario desde el sistema de archivos
let THRONE_PRIVATE_KEY = null;
let THRONE_PUBLIC_KEY = null;
let DIPLONAT_KEY = null;
let HP_KEY = null;

try {
    const keysPath = path.join(__dirname, '..', 'keys');
    const throneKeyPath = path.join(keysPath, 'throne_key.pem');
    
    if (fs.existsSync(throneKeyPath)) {
        // Cargar clave privada
        THRONE_PRIVATE_KEY = fs.readFileSync(throneKeyPath, 'utf8');
        
        // Derivar clave pública de la privada
        THRONE_PUBLIC_KEY = crypto.createPublicKey(THRONE_PRIVATE_KEY).export({
            type: 'spki',
            format: 'pem'
        });
        
        console.log("✅ Throne Keys cargadas para Vault (pública + privada)");
    }
} catch (e) {
    console.warn("⚠️  Error cargando claves para Vault:", e.message);
}

// =================================================================
// ALMACENAMIENTO DE SECRETOS (En memoria + archivo encriptado)
// =================================================================

const VAULT_FILE = path.join(__dirname, '..', 'vault-encrypted.json');
let vaultData = {
    passwords: [],
    apiKeys: [],
    certificates: [],
    documents: [],
    metadata: {
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        totalEntries: 0
    }
};

// =================================================================
// FUNCIONES DE ENCRIPTACIÓN/DESENCRIPTACIÓN (Híbrida AES + RSA)
// =================================================================

function encryptData(plaintext, publicKey = THRONE_PUBLIC_KEY) {
    try {
        // ENCRIPTACIÓN HÍBRIDA: AES-256-GCM para datos + RSA para la llave AES
        // Esto permite encriptar datos de cualquier tamaño (certificados, documentos, etc.)
        
        // 1. Generar llave AES-256 aleatoria
        const aesKey = crypto.randomBytes(32); // 256 bits
        const iv = crypto.randomBytes(16); // 128 bits IV para GCM
        
        // 2. Encriptar datos con AES-256-GCM
        const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
        let encrypted = cipher.update(plaintext, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        const authTag = cipher.getAuthTag(); // Tag de autenticación GCM
        
        // 3. Encriptar la llave AES con RSA (solo 32 bytes, cabe perfecto)
        const encryptedAesKey = crypto.publicEncrypt(
            {
                key: publicKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256'
            },
            aesKey
        );
        
        // 4. Retornar todo junto como JSON en base64
        const bundle = {
            ciphertext: encrypted,
            iv: iv.toString('base64'),
            authTag: authTag.toString('base64'),
            encryptedKey: encryptedAesKey.toString('base64')
        };
        
        return Buffer.from(JSON.stringify(bundle)).toString('base64');
    } catch (error) {
        console.error("Error encriptando:", error.message);
        throw new Error("Fallo en encriptación");
    }
}

function decryptData(encryptedData, privateKey = THRONE_PRIVATE_KEY) {
    try {
        // DESENCRIPTACIÓN HÍBRIDA: Recuperar llave AES con RSA, luego desencriptar datos con AES
        
        // 1. Decodificar el bundle
        const bundle = JSON.parse(Buffer.from(encryptedData, 'base64').toString('utf8'));
        
        // 2. Desencriptar la llave AES con RSA
        const aesKey = crypto.privateDecrypt(
            {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256'
            },
            Buffer.from(bundle.encryptedKey, 'base64')
        );
        
        // 3. Desencriptar datos con AES-256-GCM
        const iv = Buffer.from(bundle.iv, 'base64');
        const authTag = Buffer.from(bundle.authTag, 'base64');
        
        const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(bundle.ciphertext, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error("Error desencriptando:", error.message);
        throw new Error("Fallo en desencriptación");
    }
}

// =================================================================
// FIRMA DIGITAL
// =================================================================

function signData(data, privateKey = THRONE_PRIVATE_KEY) {
    try {
        const sign = crypto.createSign('SHA256');
        sign.update(data);
        sign.end();
        return sign.sign(privateKey, 'base64');
    } catch (error) {
        console.error("Error firmando:", error.message);
        throw new Error("Fallo en firma digital");
    }
}

function verifySignature(data, signature, publicKey = THRONE_PUBLIC_KEY) {
    try {
        const verify = crypto.createVerify('SHA256');
        verify.update(data);
        verify.end();
        return verify.verify(publicKey, signature, 'base64');
    } catch (error) {
        console.error("Error verificando firma:", error.message);
        return false;
    }
}

// =================================================================
// GESTIÓN DE SECRETOS
// =================================================================

function addSecret(category, name, value, metadata = {}) {
    if (!THRONE_PRIVATE_KEY || !THRONE_PUBLIC_KEY) {
        throw new Error("No hay clave disponible para encriptar");
    }

    const secretId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    // Encriptar el valor del secreto
    const encryptedValue = encryptData(value);
    
    // Crear firma digital del secreto
    const dataToSign = JSON.stringify({ name, value, timestamp });
    const signature = signData(dataToSign);

    const secret = {
        id: secretId,
        name,
        encryptedValue,
        signature,
        metadata: {
            ...metadata,
            created: timestamp,
            lastAccessed: timestamp,
            category
        }
    };

    // Agregar a la categoría correspondiente
    if (!vaultData[category]) {
        vaultData[category] = [];
    }
    vaultData[category].push(secret);
    vaultData.metadata.totalEntries++;
    vaultData.metadata.lastModified = timestamp;

    console.log(`✅ Secreto agregado: ${name} (${category})`);
    return { success: true, id: secretId, name };
}

function getSecret(category, secretId) {
    if (!THRONE_PRIVATE_KEY || !THRONE_PUBLIC_KEY) {
        throw new Error("No hay clave disponible para desencriptar");
    }

    const categoryData = vaultData[category] || [];
    const secret = categoryData.find(s => s.id === secretId);

    if (!secret) {
        throw new Error("Secreto no encontrado");
    }

    // Desencriptar el valor
    const decryptedValue = decryptData(secret.encryptedValue);

    // Actualizar último acceso
    secret.metadata.lastAccessed = new Date().toISOString();

    return {
        id: secret.id,
        name: secret.name,
        value: decryptedValue,
        metadata: secret.metadata,
        signature: secret.signature
    };
}

function listSecrets(category) {
    const categoryData = vaultData[category] || [];
    return categoryData.map(s => ({
        id: s.id,
        name: s.name,
        created: s.metadata.created,
        lastAccessed: s.metadata.lastAccessed
    }));
}

function deleteSecret(category, secretId) {
    const categoryData = vaultData[category] || [];
    const index = categoryData.findIndex(s => s.id === secretId);

    if (index === -1) {
        throw new Error("Secreto no encontrado");
    }

    const deleted = categoryData.splice(index, 1)[0];
    vaultData.metadata.totalEntries--;
    vaultData.metadata.lastModified = new Date().toISOString();

    console.log(`🗑️  Secreto eliminado: ${deleted.name}`);
    return { success: true, name: deleted.name };
}

// =================================================================
// GUARDAR/CARGAR VAULT DESDE ARCHIVO
// =================================================================

function saveVault() {
    try {
        // Guardar el vault completo en archivo JSON
        fs.writeFileSync(VAULT_FILE, JSON.stringify(vaultData, null, 2), 'utf8');
        console.log("💾 Vault guardado exitosamente");
        return { success: true };
    } catch (error) {
        console.error("Error guardando vault:", error.message);
        return { success: false, error: error.message };
    }
}

function loadVault() {
    try {
        if (fs.existsSync(VAULT_FILE)) {
            const data = fs.readFileSync(VAULT_FILE, 'utf8');
            vaultData = JSON.parse(data);
            console.log(`✅ Vault cargado: ${vaultData.metadata.totalEntries} secretos`);
            return { success: true, entries: vaultData.metadata.totalEntries };
        } else {
            console.log("📦 Vault nuevo - no existe archivo previo");
            return { success: true, entries: 0 };
        }
    } catch (error) {
        console.error("Error cargando vault:", error.message);
        return { success: false, error: error.message };
    }
}

// =================================================================
// ESTADÍSTICAS
// =================================================================

function getVaultStats() {
    return {
        totalSecrets: vaultData.metadata.totalEntries,
        passwords: (vaultData.passwords || []).length,
        apiKeys: (vaultData.apiKeys || []).length,
        certificates: (vaultData.certificates || []).length,
        documents: (vaultData.documents || []).length,
        created: vaultData.metadata.created,
        lastModified: vaultData.metadata.lastModified,
        vaultLocked: !THRONE_PRIVATE_KEY
    };
}

// Cargar vault al inicio
loadVault();

// =================================================================
// EXPORTAR FUNCIONES
// =================================================================

module.exports = {
    addSecret,
    getSecret,
    listSecrets,
    deleteSecret,
    saveVault,
    loadVault,
    getVaultStats,
    encryptData,
    decryptData,
    signData,
    verifySignature
};
