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
    { tipo_base_1: "casa_flotante", tipo_base_2: "torre_piramide", altura_m: 45, ancho_m: 30, profundidad_m: 25, num_pisos: 8, terreno: "oceano" },
    { tipo_base_1: "casa_flotante", tipo_base_2: "villa_organica", altura_m: 20, ancho_m: 35, profundidad_m: 30, num_pisos: 4, terreno: "lago" },
    { tipo_base_1: "torre_piramide", tipo_base_2: "complejo_modular", altura_m: 85, ancho_m: 40, profundidad_m: 35, num_pisos: 18, terreno: "desierto" },
    { tipo_base_1: "villa_organica", tipo_base_2: "complejo_modular", altura_m: 28, ancho_m: 50, profundidad_m: 45, num_pisos: 6, terreno: "oceano" },
    { tipo_base_1: "casa_flotante", tipo_base_2: "complejo_modular", altura_m: 35, ancho_m: 60, profundidad_m: 50, num_pisos: 7, terreno: "lago" },
    
    { tipo_base_1: "torre_piramide", tipo_base_2: "casa_flotante", altura_m: 120, ancho_m: 35, profundidad_m: 30, num_pisos: 28, terreno: "desierto" },
    { tipo_base_1: "torre_piramide", tipo_base_2: "villa_organica", altura_m: 95, ancho_m: 42, profundidad_m: 38, num_pisos: 22, terreno: "montana" },
    { tipo_base_1: "villa_organica", tipo_base_2: "casa_flotante", altura_m: 18, ancho_m: 40, profundidad_m: 35, num_pisos: 3, terreno: "oceano" },
    { tipo_base_1: "complejo_modular", tipo_base_2: "torre_piramide", altura_m: 65, ancho_m: 55, profundidad_m: 48, num_pisos: 14, terreno: "lago" },
    { tipo_base_1: "complejo_modular", tipo_base_2: "villa_organica", altura_m: 32, ancho_m: 70, profundidad_m: 60, num_pisos: 8, terreno: "oceano" },
    
    { tipo_base_1: "casa_flotante", tipo_base_2: "casa_flotante", altura_m: 22, ancho_m: 32, profundidad_m: 28, num_pisos: 5, terreno: "oceano" },
    { tipo_base_1: "torre_piramide", tipo_base_2: "torre_piramide", altura_m: 145, ancho_m: 45, profundidad_m: 42, num_pisos: 35, terreno: "desierto" },
    { tipo_base_1: "villa_organica", tipo_base_2: "villa_organica", altura_m: 25, ancho_m: 48, profundidad_m: 42, num_pisos: 5, terreno: "lago" },
    { tipo_base_1: "complejo_modular", tipo_base_2: "complejo_modular", altura_m: 38, ancho_m: 75, profundidad_m: 65, num_pisos: 9, terreno: "oceano" },
    
    // Variaciones extremas
    { tipo_base_1: "torre_piramide", tipo_base_2: "casa_flotante", altura_m: 160, ancho_m: 38, profundidad_m: 35, num_pisos: 42, terreno: "desierto" },
    { tipo_base_1: "casa_flotante", tipo_base_2: "villa_organica", altura_m: 15, ancho_m: 28, profundidad_m: 24, num_pisos: 2, terreno: "lago" },
    { tipo_base_1: "villa_organica", tipo_base_2: "torre_piramide", altura_m: 78, ancho_m: 36, profundidad_m: 32, num_pisos: 16, terreno: "montana" },
    { tipo_base_1: "complejo_modular", tipo_base_2: "casa_flotante", altura_m: 42, ancho_m: 68, profundidad_m: 58, num_pisos: 10, terreno: "oceano" },
    
    // Diseños mega-premium
    { tipo_base_1: "torre_piramide", tipo_base_2: "complejo_modular", altura_m: 110, ancho_m: 62, profundidad_m: 55, num_pisos: 26, terreno: "desierto" },
    { tipo_base_1: "villa_organica", tipo_base_2: "complejo_modular", altura_m: 35, ancho_m: 80, profundidad_m: 70, num_pisos: 8, terreno: "oceano" },
    { tipo_base_1: "casa_flotante", tipo_base_2: "torre_piramide", altura_m: 58, ancho_m: 34, profundidad_m: 30, num_pisos: 12, terreno: "lago" },
    { tipo_base_1: "complejo_modular", tipo_base_2: "villa_organica", altura_m: 40, ancho_m: 85, profundidad_m: 75, num_pisos: 10, terreno: "oceano" },
    
    // Diseños ultra-compactos
    { tipo_base_1: "casa_flotante", tipo_base_2: "villa_organica", altura_m: 12, ancho_m: 22, profundidad_m: 20, num_pisos: 2, terreno: "lago" },
    { tipo_base_1: "villa_organica", tipo_base_2: "casa_flotante", altura_m: 16, ancho_m: 26, profundidad_m: 24, num_pisos: 3, terreno: "oceano" },
    
    // Diseños monumentales
    { tipo_base_1: "torre_piramide", tipo_base_2: "torre_piramide", altura_m: 180, ancho_m: 52, profundidad_m: 48, num_pisos: 48, terreno: "desierto" },
    { tipo_base_1: "complejo_modular", tipo_base_2: "torre_piramide", altura_m: 92, ancho_m: 90, profundidad_m: 80, num_pisos: 20, terreno: "oceano" },
    
    // Diseños híbridos avanzados
    { tipo_base_1: "villa_organica", tipo_base_2: "torre_piramide", altura_m: 68, ancho_m: 38, profundidad_m: 34, num_pisos: 14, terreno: "lago" },
    { tipo_base_1: "casa_flotante", tipo_base_2: "complejo_modular", altura_m: 30, ancho_m: 55, profundidad_m: 48, num_pisos: 6, terreno: "oceano" },
    { tipo_base_1: "torre_piramide", tipo_base_2: "villa_organica", altura_m: 102, ancho_m: 44, profundidad_m: 40, num_pisos: 24, terreno: "montana" },
    { tipo_base_1: "complejo_modular", tipo_base_2: "casa_flotante", altura_m: 35, ancho_m: 72, profundidad_m: 62, num_pisos: 8, terreno: "lago" }
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
            console.log(`\n[${i + 1}/${COMBINACIONES_UNICAS.length}] Generando: ${config.tipo_base_1} × ${config.tipo_base_2}`);
            
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