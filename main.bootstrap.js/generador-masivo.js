// Archivo: generador-masivo.js (Generador Masivo de Diseños Arquitectónicos)
// Sistema para generar 25-30 diseños únicos automáticamente
// -----------------------------------------------------

const { generarDisenoCompleto, DESIGN_TYPES } = require('./throne-arquitectura');
const fs = require('fs').promises;
const path = require('path');

// =================================================================
// CONFIGURACIONES DE GENERACIÓN
// =================================================================

const COMBINACIONES_UNICAS = [
    { tipo1: "casa_flotante", tipo2: "torre_piramide", altura: 45, ancho: 30, profundidad: 25, pisos: 8, terreno: "oceano" },
    { tipo1: "casa_flotante", tipo2: "villa_organica", altura: 20, ancho: 35, profundidad: 30, pisos: 4, terreno: "lago" },
    { tipo1: "torre_piramide", tipo2: "complejo_modular", altura: 85, ancho: 40, profundidad: 35, pisos: 18, terreno: "desierto" },
    { tipo1: "villa_organica", tipo2: "complejo_modular", altura: 28, ancho: 50, profundidad: 45, pisos: 6, terreno: "oceano" },
    { tipo1: "casa_flotante", tipo2: "complejo_modular", altura: 35, ancho: 60, profundidad: 50, pisos: 7, terreno: "lago" },
    
    { tipo1: "torre_piramide", tipo2: "casa_flotante", altura: 120, ancho: 35, profundidad: 30, pisos: 28, terreno: "desierto" },
    { tipo1: "torre_piramide", tipo2: "villa_organica", altura: 95, ancho: 42, profundidad: 38, pisos: 22, terreno: "montana" },
    { tipo1: "villa_organica", tipo2: "casa_flotante", altura: 18, ancho: 40, profundidad: 35, pisos: 3, terreno: "oceano" },
    { tipo1: "complejo_modular", tipo2: "torre_piramide", altura: 65, ancho: 55, profundidad: 48, pisos: 14, terreno: "lago" },
    { tipo1: "complejo_modular", tipo2: "villa_organica", altura: 32, ancho: 70, profundidad: 60, pisos: 8, terreno: "oceano" },
    
    { tipo1: "casa_flotante", tipo2: "casa_flotante", altura: 22, ancho: 32, profundidad: 28, pisos: 5, terreno: "oceano" },
    { tipo1: "torre_piramide", tipo2: "torre_piramide", altura: 145, ancho: 45, profundidad: 42, pisos: 35, terreno: "desierto" },
    { tipo1: "villa_organica", tipo2: "villa_organica", altura: 25, ancho: 48, profundidad: 42, pisos: 5, terreno: "lago" },
    { tipo1: "complejo_modular", tipo2: "complejo_modular", altura: 38, ancho: 75, profundidad: 65, pisos: 9, terreno: "oceano" },
    
    // Variaciones extremas
    { tipo1: "torre_piramide", tipo2: "casa_flotante", altura: 160, ancho: 38, profundidad: 35, pisos: 42, terreno: "desierto" },
    { tipo1: "casa_flotante", tipo2: "villa_organica", altura: 15, ancho: 28, profundidad: 24, pisos: 2, terreno: "lago" },
    { tipo1: "villa_organica", tipo2: "torre_piramide", altura: 78, ancho: 36, profundidad: 32, pisos: 16, terreno: "montana" },
    { tipo1: "complejo_modular", tipo2: "casa_flotante", altura: 42, ancho: 68, profundidad: 58, pisos: 10, terreno: "oceano" },
    
    // Diseños mega-premium
    { tipo1: "torre_piramide", tipo2: "complejo_modular", altura: 110, ancho: 62, profundidad: 55, pisos: 26, terreno: "desierto" },
    { tipo1: "villa_organica", tipo2: "complejo_modular", altura: 35, ancho: 80, profundidad: 70, pisos: 8, terreno: "oceano" },
    { tipo1: "casa_flotante", tipo2: "torre_piramide", altura: 58, ancho: 34, profundidad: 30, pisos: 12, terreno: "lago" },
    { tipo1: "complejo_modular", tipo2: "villa_organica", altura: 40, ancho: 85, profundidad: 75, pisos: 10, terreno: "oceano" },
    
    // Diseños ultra-compactos
    { tipo1: "casa_flotante", tipo2: "villa_organica", altura: 12, ancho: 22, profundidad: 20, pisos: 2, terreno: "lago" },
    { tipo1: "villa_organica", tipo2: "casa_flotante", altura: 16, ancho: 26, profundidad: 24, pisos: 3, terreno: "oceano" },
    
    // Diseños monumentales
    { tipo1: "torre_piramide", tipo2: "torre_piramide", altura: 180, ancho: 52, profundidad: 48, pisos: 48, terreno: "desierto" },
    { tipo1: "complejo_modular", tipo2: "torre_piramide", altura: 92, ancho: 90, profundidad: 80, pisos: 20, terreno: "oceano" },
    
    // Diseños híbridos avanzados
    { tipo1: "villa_organica", tipo2: "torre_piramide", altura: 68, ancho: 38, profundidad: 34, pisos: 14, terreno: "lago" },
    { tipo1: "casa_flotante", tipo2: "complejo_modular", altura: 30, ancho: 55, profundidad: 48, pisos: 6, terreno: "oceano" },
    { tipo1: "torre_piramide", tipo2: "villa_organica", altura: 102, ancho: 44, profundidad: 40, pisos: 24, terreno: "montana" },
    { tipo1: "complejo_modular", tipo2: "casa_flotante", altura: 35, ancho: 72, profundidad: 62, pisos: 8, terreno: "lago" }
];

// =================================================================
// GENERADOR MASIVO
// =================================================================

async function generarTodosLosDisenos() {
    console.log('🔥 Iniciando generación masiva de diseños arquitectónicos...');
    console.log(`📊 Total de diseños a generar: ${COMBINACIONES_UNICAS.length}`);
    
    const disenosGenerados = [];
    const errores = [];
    
    for (let i = 0; i < COMBINACIONES_UNICAS.length; i++) {
        try {
            const config = COMBINACIONES_UNICAS[i];
            console.log(`\n[${i + 1}/${COMBINACIONES_UNICAS.length}] Generando: ${config.tipo1} × ${config.tipo2}`);
            
            const diseno = await generarDisenoCompleto(config);
            disenosGenerados.push(diseno);
            
            console.log(`✅ ${diseno.id_proyecto} - ${diseno.diseño.nombre}`);
            console.log(`   💰 Valor: $${diseno.valoracion.valor_mercado_usd}`);
            console.log(`   📐 Dimensiones: ${diseno.especificaciones.dimensiones.altura_total_m}m × ${diseno.especificaciones.dimensiones.ancho_m}m`);
            
        } catch (error) {
            console.error(`❌ Error en combinación ${i + 1}:`, error.message);
            errores.push({ index: i, error: error.message });
        }
    }
    
    // Guardar todos los diseños en archivo JSON
    try {
        const outputPath = path.join(__dirname, '..', 'data', 'disenos-arquitectonicos.json');
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, JSON.stringify(disenosGenerados, null, 2));
        console.log(`\n💾 Diseños guardados en: ${outputPath}`);
    } catch (error) {
        console.error('❌ Error guardando archivo:', error.message);
    }
    
    return {
        total_generados: disenosGenerados.length,
        total_errores: errores.length,
        disenos: disenosGenerados,
        errores: errores,
        timestamp: new Date().toISOString()
    };
}

// =================================================================
// ESTADÍSTICAS DE PORTAFOLIO
// =================================================================

function generarEstadisticasPortafolio(disenos) {
    const total = disenos.length;
    
    // Calcular valor total
    const valorTotal = disenos.reduce((sum, d) => {
        const valor = parseFloat(d.valoracion.valor_mercado_usd.replace(/,/g, ''));
        return sum + valor;
    }, 0);
    
    // Agrupar por tipo de terreno
    const porTerreno = disenos.reduce((acc, d) => {
        const terreno = d.ubicacion.terreno_tipo;
        acc[terreno] = (acc[terreno] || 0) + 1;
        return acc;
    }, {});
    
    // Encontrar diseño más alto
    const masAlto = disenos.reduce((max, d) => {
        return d.especificaciones.dimensiones.altura_total_m > max.especificaciones.dimensiones.altura_total_m ? d : max;
    });
    
    // Encontrar diseño más valioso
    const masValioso = disenos.reduce((max, d) => {
        const valorMax = parseFloat(max.valoracion.valor_mercado_usd.replace(/,/g, ''));
        const valorActual = parseFloat(d.valoracion.valor_mercado_usd.replace(/,/g, ''));
        return valorActual > valorMax ? d : max;
    });
    
    return {
        total_diseños: total,
        valor_total_portafolio_usd: valorTotal.toLocaleString(),
        valor_promedio_diseno_usd: (valorTotal / total).toLocaleString(),
        distribucion_terreno: porTerreno,
        diseño_mas_alto: {
            id: masAlto.id_proyecto,
            nombre: masAlto.diseño.nombre,
            altura_m: masAlto.especificaciones.dimensiones.altura_total_m
        },
        diseño_mas_valioso: {
            id: masValioso.id_proyecto,
            nombre: masValioso.diseño.nombre,
            valor_usd: masValioso.valoracion.valor_mercado_usd
        }
    };
}

// =================================================================
// EXPORTAR FUNCIONES
// =================================================================

module.exports = {
    generarTodosLosDisenos,
    generarEstadisticasPortafolio,
    COMBINACIONES_UNICAS
};