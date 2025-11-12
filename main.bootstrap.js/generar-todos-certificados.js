// ============================================================
// GENERADOR MASIVO DE CERTIFICADOS
// Genera certificados para todos los diseños arquitectónicos
// ============================================================

const axios = require('axios');
const fs = require('fs');

const API_BASE = 'http://localhost:5000';

async function generarTodosCertificados() {
    console.log('🏆 GENERADOR MASIVO DE CERTIFICADOS - STREET EMPORIO ROYAL');
    console.log('=' .repeat(60));
    
    try {
        // Obtener todos los proyectos
        console.log('\n📋 Obteniendo lista de proyectos...');
        const response = await axios.get(`${API_BASE}/api/arquitectura/proyectos`);
        
        if (!response.data.success) {
            throw new Error('Error al obtener proyectos');
        }
        
        const proyectos = response.data.disenos;
        console.log(`✅ Encontrados ${proyectos.length} proyectos arquitectónicos`);
        
        // Generar certificado para cada proyecto
        const resultados = {
            exitosos: [],
            fallidos: [],
            total: proyectos.length
        };
        
        console.log('\n🔨 Generando certificados...\n');
        
        for (let i = 0; i < proyectos.length; i++) {
            const proyecto = proyectos[i];
            const numero = i + 1;
            
            try {
                console.log(`[${numero}/${proyectos.length}] Generando certificado para: ${proyecto.diseño.nombre}`);
                
                const certResponse = await axios.post(
                    `${API_BASE}/api/certificados/generar/${proyecto.id_proyecto}`
                );
                
                if (certResponse.data.success) {
                    resultados.exitosos.push({
                        proyecto_id: proyecto.id_proyecto,
                        certificado_id: certResponse.data.certificado.certificado_id,
                        nombre: proyecto.diseño.nombre,
                        url_verificacion: certResponse.data.certificado.url_verificacion
                    });
                    console.log(`   ✅ Certificado generado: ${certResponse.data.certificado.certificado_id}`);
                } else {
                    throw new Error('Respuesta no exitosa');
                }
                
                // Pausa breve entre cada generación
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                resultados.fallidos.push({
                    proyecto_id: proyecto.id_proyecto,
                    nombre: proyecto.diseño.nombre,
                    error: error.message
                });
                console.log(`   ❌ Error: ${error.message}`);
            }
        }
        
        // Resumen final
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMEN DE GENERACIÓN DE CERTIFICADOS');
        console.log('='.repeat(60));
        console.log(`Total de proyectos: ${resultados.total}`);
        console.log(`✅ Certificados exitosos: ${resultados.exitosos.length}`);
        console.log(`❌ Certificados fallidos: ${resultados.fallidos.length}`);
        
        // Guardar reporte
        const reporte = {
            timestamp: new Date().toISOString(),
            autor: 'Roberto Rivera Gamas - Royal (Arquitecto)',
            empresa: 'Street Emporio Royal',
            ...resultados
        };
        
        const reportePath = './data/reporte-certificados.json';
        fs.writeFileSync(reportePath, JSON.stringify(reporte, null, 2));
        console.log(`\n💾 Reporte guardado en: ${reportePath}`);
        
        // Mostrar certificados generados
        if (resultados.exitosos.length > 0) {
            console.log('\n🎯 CERTIFICADOS GENERADOS:');
            console.log('-'.repeat(60));
            resultados.exitosos.forEach((cert, idx) => {
                console.log(`${idx + 1}. ${cert.nombre}`);
                console.log(`   ID: ${cert.certificado_id}`);
                console.log(`   Verificar: ${cert.url_verificacion}`);
                console.log('');
            });
        }
        
        if (resultados.fallidos.length > 0) {
            console.log('\n⚠️ CERTIFICADOS CON ERROR:');
            console.log('-'.repeat(60));
            resultados.fallidos.forEach((fail, idx) => {
                console.log(`${idx + 1}. ${fail.nombre}`);
                console.log(`   Error: ${fail.error}`);
                console.log('');
            });
        }
        
        console.log('\n✨ Proceso completado exitosamente!');
        console.log('🏆 Street Emporio Royal - Throne Protocol V3.0\n');
        
    } catch (error) {
        console.error('\n❌ ERROR FATAL:', error.message);
        process.exit(1);
    }
}

// Ejecutar
generarTodosCertificados();
