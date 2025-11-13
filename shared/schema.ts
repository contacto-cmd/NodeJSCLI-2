import { pgTable, text, timestamp, integer, jsonb, boolean, serial } from 'drizzle-orm/pg-core';

// Tabla de transacciones firmadas digitalmente
export const transacciones = pgTable('transacciones', {
  id: serial('id').primaryKey(),
  tipo: text('tipo').notNull(), // 'certificado', 'whitepaper', 'validacion', 'compra'
  datos: jsonb('datos').notNull(),
  firma_rsa: text('firma_rsa').notNull(), // Firma RSA-4096
  firma_ec: text('firma_ec'), // Firma EC P-256 (opcional)
  hash_sha256: text('hash_sha256').notNull(),
  verificado: boolean('verificado').default(false),
  timestamp: timestamp('timestamp').defaultNow(),
  propietario: text('propietario').notNull(), // Roberto Rivera Gamas
  rfc: text('rfc').notNull(), // RIGR840827PJ0
});

// Tabla de certificados emitidos
export const certificados = pgTable('certificados', {
  id: serial('id').primaryKey(),
  numero_certificado: text('numero_certificado').notNull().unique(),
  tipo: text('tipo').notNull(), // 'whitepaper', 'validacion', 'propiedad'
  propietario: text('propietario').notNull(),
  email: text('email').notNull(),
  firma_digital: text('firma_digital').notNull(),
  hash_documento: text('hash_documento').notNull(),
  fecha_emision: timestamp('fecha_emision').defaultNow(),
  valido_hasta: timestamp('valido_hasta'),
  revocado: boolean('revocado').default(false),
  metadata: jsonb('metadata'),
});

// Tabla de verificaciones de firma
export const verificaciones = pgTable('verificaciones', {
  id: serial('id').primaryKey(),
  documento_hash: text('documento_hash').notNull(),
  firma: text('firma').notNull(),
  algoritmo: text('algoritmo').notNull(), // 'RS256', 'ES256'
  resultado: boolean('resultado').notNull(),
  timestamp: timestamp('timestamp').defaultNow(),
  ip_origen: text('ip_origen'),
});

// Tabla de nodos (40 nodos cuánticos)
export const nodos = pgTable('nodos', {
  id: serial('id').primaryKey(),
  nodo_id: text('nodo_id').notNull().unique(),
  nombre: text('nombre').notNull(),
  ubicacion: text('ubicacion'),
  latitud: text('latitud'),
  longitud: text('longitud'),
  estado: text('estado').notNull(), // 'activo', 'inactivo', 'mantenimiento'
  ultimo_ping: timestamp('ultimo_ping'),
  clave_publica_rsa: text('clave_publica_rsa'),
  metadata: jsonb('metadata'),
});

// Tabla de blockchain simplificado
export const blockchain = pgTable('blockchain', {
  id: serial('id').primaryKey(),
  bloque_id: text('bloque_id').notNull().unique(),
  bloque_anterior: text('bloque_anterior'),
  datos: jsonb('datos').notNull(),
  firma_rsa: text('firma_rsa').notNull(),
  hash: text('hash').notNull(),
  timestamp: timestamp('timestamp').defaultNow(),
  validado: boolean('validado').default(true),
});

// ========================================
// SISTEMA FUSION TOKENS - PRODUCCIÓN REAL
// ========================================

// Catálogo de 40 tokens FUSION
export const fusionTokens = pgTable('fusion_tokens', {
  id: serial('id').primaryKey(),
  tokenCode: text('token_code').notNull().unique(), // "AETHER-TORUS-01"
  nombre: text('nombre').notNull(), // "Aether Torus Quantum Module"
  tier: integer('tier').notNull(), // 1, 2, 3
  precioUsd: integer('precio_usd').notNull(), // 25000, 35000, 75000
  servicios: jsonb('servicios').notNull(), // Array de servicios incluidos
  domain: text('domain'), // "aether-torus.fusion-throne.com"
  activo: boolean('activo').default(true),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Licencias emitidas a clientes
export const fusionLicenses = pgTable('fusion_licenses', {
  id: serial('id').primaryKey(),
  tokenId: integer('token_id').notNull().references(() => fusionTokens.id),
  licenseId: text('license_id').notNull().unique(), // UUID único
  clienteNombre: text('cliente_nombre').notNull(),
  clienteEmail: text('cliente_email').notNull(),
  clienteRfc: text('cliente_rfc'),
  jwtFirmado: text('jwt_firmado').notNull(), // Firmado con RSA-4096
  firmaRsa: text('firma_rsa').notNull(), // Firma adicional
  hashSha256: text('hash_sha256').notNull(),
  fechaEmision: timestamp('fecha_emision').defaultNow(),
  fechaExpiracion: timestamp('fecha_expiracion').notNull(),
  revocado: boolean('revocado').default(false),
  motivoRevocacion: text('motivo_revocacion'),
  metadata: jsonb('metadata'),
});

// Auditoría de eventos de tokens
export const fusionAudit = pgTable('fusion_audit', {
  id: serial('id').primaryKey(),
  licenseId: integer('license_id').references(() => fusionLicenses.id),
  tokenCode: text('token_code'),
  evento: text('evento').notNull(), // 'issued', 'verified', 'revoked', 'accessed'
  ipOrigen: text('ip_origen'),
  userAgent: text('user_agent'),
  resultado: boolean('resultado'),
  detalles: jsonb('detalles'),
  timestamp: timestamp('timestamp').defaultNow(),
});

// API Keys para autenticación
export const fusionApiKeys = pgTable('fusion_api_keys', {
  id: serial('id').primaryKey(),
  keyHash: text('key_hash').notNull().unique(), // SHA-256 del API key
  nombre: text('nombre').notNull(), // Nombre descriptivo
  propietario: text('propietario').notNull(), // Empresa/persona
  email: text('email').notNull(),
  activo: boolean('activo').default(true),
  permisos: jsonb('permisos').notNull(), // ["issue", "verify", "read"]
  rateLimit: integer('rate_limit').default(10), // requests por minuto
  ultimoUso: timestamp('ultimo_uso'),
  createdAt: timestamp('created_at').defaultNow(),
  expiresAt: timestamp('expires_at'),
});
