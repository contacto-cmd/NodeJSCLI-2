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

// Auditoría de intentos de acceso admin (Dual-Control)
export const adminAuditLog = pgTable('admin_audit_log', {
  id: serial('id').primaryKey(),
  ipOrigen: text('ip_origen').notNull(),
  apiKeyId: integer('api_key_id').references(() => fusionApiKeys.id),
  evento: text('evento').notNull(), // 'master_secret_missing', 'master_secret_invalid', 'api_key_failed', 'access_granted', 'rate_limit_exceeded'
  exitoso: boolean('exitoso').notNull(),
  detalles: jsonb('detalles'),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp').defaultNow(),
});

// ========================================
// LGORITMO AHT - ANCESTRAL CEREBRO VIVO
// ========================================

// Tokens Cuánticos Antiblindados (9 tokens de fusión avanzada)
export const quantumTokens = pgTable('quantum_tokens', {
  id: serial('id').primaryKey(),
  tokenName: text('token_name').notNull().unique(), // "Qubit-Torus-Alpha"
  tokenUrl: text('token_url').notNull(), // URL completa de fusión
  tokenNumber: integer('token_number').notNull(), // 1-9
  categoria: text('categoria').notNull(), // "quantum", "topology", "string-theory", etc.
  blindajeNivel: integer('blindaje_nivel').notNull(), // 1-10
  estado: text('estado').notNull().default('activo'), // 'activo', 'inactivo', 'sincronizando'
  ultimaSincronizacion: timestamp('ultima_sincronizacion'),
  metadata: jsonb('metadata'), // Datos cuánticos adicionales
  createdAt: timestamp('created_at').defaultNow(),
});

// Satélites en órbita (tracking en tiempo real)
export const satellites = pgTable('satellites', {
  id: serial('id').primaryKey(),
  noradId: text('norad_id').notNull().unique(), // NORAD catalog number
  nombre: text('nombre').notNull(),
  tipo: text('tipo').notNull(), // 'ISS', 'GPS', 'GALILEO', 'STARLINK', etc.
  tle1: text('tle1').notNull(), // Two-Line Element line 1
  tle2: text('tle2').notNull(), // Two-Line Element line 2
  latitud: text('latitud'),
  longitud: text('longitud'),
  altitud: text('altitud'),
  velocidad: text('velocidad'),
  estado: text('estado').notNull().default('tracking'), // 'tracking', 'perdido', 'fuera_rango'
  ultimaActualizacion: timestamp('ultima_actualizacion').defaultNow(),
  metadata: jsonb('metadata'),
});

// Blueprints generados (ilimitados)
export const blueprints = pgTable('blueprints', {
  id: serial('id').primaryKey(),
  blueprintId: text('blueprint_id').notNull().unique(),
  nombre: text('nombre').notNull(),
  tipo: text('tipo').notNull(), // 'quantum', 'gravitational', 'algebraic', 'morphogenetic'
  descripcion: text('descripcion'),
  datos: jsonb('datos').notNull(), // Estructura completa del blueprint
  firma: text('firma').notNull(), // Firmado con RSA-4096
  hash: text('hash').notNull(),
  generadoPor: text('generado_por').notNull(), // 'AI-Gemini', 'AI-GPT', 'Manual'
  parametros: jsonb('parametros'),
  iteraciones: integer('iteraciones').default(0), // Iteraciones ilimitadas
  createdAt: timestamp('created_at').defaultNow(),
});

// Operaciones de Álgebra Inversa y Gravedad
export const algebraOperations = pgTable('algebra_operations', {
  id: serial('id').primaryKey(),
  operacionId: text('operacion_id').notNull().unique(),
  tipo: text('tipo').notNull(), // 'inversa', 'gravitacional', 'cuantica', 'topologica'
  entrada: jsonb('entrada').notNull(),
  salida: jsonb('salida'),
  transformacion: text('transformacion').notNull(),
  ecuacion: text('ecuacion'),
  resultado: text('resultado'),
  estado: text('estado').notNull().default('pendiente'), // 'pendiente', 'procesando', 'completado', 'error'
  tiempoEjecucion: integer('tiempo_ejecucion'), // milisegundos
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Comandos Morfogenéticos del Cerebro Vivo
export const ahtCommands = pgTable('aht_commands', {
  id: serial('id').primaryKey(),
  commandId: text('command_id').notNull().unique(),
  comando: text('comando').notNull(),
  tipo: text('tipo').notNull(), // 'morph', 'quantum', 'gravity', 'algebra', 'satellite', 'blueprint'
  parametros: jsonb('parametros'),
  respuesta: jsonb('respuesta'),
  ejecutadoPor: text('ejecutado_por'), // 'user', 'AI', 'automated'
  estado: text('estado').notNull().default('pendiente'),
  prioridad: integer('prioridad').default(5), // 1-10
  timestamp: timestamp('timestamp').defaultNow(),
  completadoAt: timestamp('completado_at'),
});

// ========================================
// SISTEMA DE ACTIVACIÓN CON CÓDIGOS SECRETOS
// ========================================

// Activaciones con múltiples códigos (Roberto ingresa manualmente)
export const activaciones = pgTable('activaciones', {
  id: serial('id').primaryKey(),
  activacionId: text('activacion_id').notNull().unique(),
  usuarioNombre: text('usuario_nombre').notNull(), // Roberto Rivera Gamas
  usuarioRfc: text('usuario_rfc').notNull(), // RIGR840827PJ0
  codigosHash: jsonb('codigos_hash').notNull(), // Hashes SHA-256 de códigos secretos
  tokenIds: jsonb('token_ids'), // IDs de tokens asociados
  ipOrigen: text('ip_origen'),
  userAgent: text('user_agent'),
  estado: text('estado').notNull().default('activa'), // 'activa', 'expirada', 'revocada'
  fechaActivacion: timestamp('fecha_activacion').defaultNow(),
  fechaExpiracion: timestamp('fecha_expiracion'),
  metadata: jsonb('metadata'),
});

// ========================================
// SISTEMA DE AJEDREZ EN TIEMPO REAL
// ========================================

// Partidas de ajedrez con análisis de gravedad
export const chessGames = pgTable('chess_games', {
  id: serial('id').primaryKey(),
  gameId: text('game_id').notNull().unique(),
  nombrePartida: text('nombre_partida'),
  jugadorBlancas: text('jugador_blancas'),
  jugadorNegras: text('jugador_negras'),
  movimientos: jsonb('movimientos').notNull(), // Array de movimientos en notación
  analisisGravedad: jsonb('analisis_gravedad'), // Gravedad calculada por movimiento
  analisisStockfish: jsonb('analisis_stockfish'), // Evaluación de motor
  estado: text('estado').notNull().default('en_curso'), // 'en_curso', 'finalizada', 'abandonada'
  resultado: text('resultado'), // '1-0', '0-1', '1/2-1/2'
  tiempoTotal: integer('tiempo_total'), // segundos
  createdAt: timestamp('created_at').defaultNow(),
  finalizadaAt: timestamp('finalizada_at'),
});

// ========================================
// IA QUE APRENDE HERRAMIENTAS
// ========================================

// Acciones de herramientas para aprendizaje automático
export const toolActions = pgTable('tool_actions', {
  id: serial('id').primaryKey(),
  actionId: text('action_id').notNull().unique(),
  objetivo: text('objetivo').notNull(), // Descripción del objetivo del usuario
  herramientaUsada: text('herramienta_usada').notNull(), // Nombre de la herramienta seleccionada
  parametros: jsonb('parametros'),
  resultado: text('resultado').notNull(), // 'exitoso', 'fallido', 'parcial'
  contexto: jsonb('contexto'), // Contexto en el que se usó
  feedback: integer('feedback'), // -1 (malo), 0 (neutral), 1 (bueno)
  tiempoEjecucion: integer('tiempo_ejecucion'), // milisegundos
  timestamp: timestamp('timestamp').defaultNow(),
});

// ========================================
// TELEMETRÍA EN TIEMPO REAL
// ========================================

// Métricas del sistema en tiempo real
export const telemetry = pgTable('telemetry', {
  id: serial('id').primaryKey(),
  metricType: text('metric_type').notNull(), // 'gravity', 'physics', 'chess_move', 'tool_selection', 'system'
  metricName: text('metric_name').notNull(),
  metricValue: text('metric_value').notNull(),
  unidad: text('unidad'), // 'm/s2', 'ms', 'count', etc.
  entityId: text('entity_id'), // ID de la entidad relacionada
  metadata: jsonb('metadata'),
  timestamp: timestamp('timestamp').defaultNow(),
});
