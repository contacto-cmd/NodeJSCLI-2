#!/usr/bin/env node
/**
 * 🔱 ÁLGEBRA INVERSA: Wrapper de Deployment
 * 
 * Este script inicia el servidor DIRECTAMENTE sin depender de .replit
 * Bypasea la configuración problemática de múltiples puertos
 */

const { spawn } = require('child_process');

console.log('🔱 ALGORYTHM ANCESTRAL ENGINE - Deployment Wrapper');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Configuración forzada para deployment
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Establecer variables de entorno para el servidor
process.env.PORT = PORT;
process.env.HOST = HOST;

console.log(`✅ Puerto configurado: ${PORT}`);
console.log(`✅ Host configurado: ${HOST}`);
console.log(`🚀 Iniciando servidor...`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Iniciar el servidor directamente
const server = spawn('node', ['main.bootstrap.js/server.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: PORT,
    HOST: HOST,
    NODE_ENV: 'production'
  }
});

server.on('error', (error) => {
  console.error('❌ Error al iniciar servidor:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Servidor terminó con código: ${code}`);
    process.exit(code);
  }
});

// Manejar señales de terminación
process.on('SIGTERM', () => {
  console.log('\n🛑 Señal SIGTERM recibida, cerrando servidor...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('\n🛑 Señal SIGINT recibida, cerrando servidor...');
  server.kill('SIGINT');
});
