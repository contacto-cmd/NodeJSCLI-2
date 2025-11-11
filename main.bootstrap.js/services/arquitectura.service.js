// Archivo: services/arquitectura.service.js (Servicio de Arquitectura)
// Capa de servicio que encapsula lógica de negocio y persistencia
// -----------------------------------------------------

const { generarDisenoCompleto, combinarDiseños } = require('../throne-arquitectura');
const fs = require('fs').promises;
const path = require('path');

const DESIGNS_FILE = path.join(__dirname, '../../data/disenos-arquitectonicos.json');

// =================================================================
// PERSISTENCIA
// =================================================================

async function cargarDisenos() {
    try {
        const data = await fs.readFile(DESIGNS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Si no existe el archivo, retornar array vacío
        return [];
    }
}

async function guardarDisenos(disenos) {
    try {
        await fs.mkdir(path.dirname(DESIGNS_FILE), { recursive: true });
        await fs.writeFile(DESIGNS_FILE, JSON.stringify(disenos, null, 2));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// =================================================================
// SERVICIO: GENERAR DISEÑO
// =================================================================

async function generateDesign(config, userToken = null) {
    try {
        // Validar configuración
        if (!config.tipo_base_1 || !config.tipo_base_2) {
            return {
                success: false,
                error: "Se requieren tipo_base_1 y tipo_base_2"
            };
        }
        
        // Generar diseño
        const diseno = await generarDisenoCompleto(config);
        
        // Cargar diseños existentes
        const disenosExistentes = await cargarDisenos();
        
        // Agregar nuevo diseño
        disenosExistentes.push(diseno);
        
        // Guardar
        await guardarDisenos(disenosExistentes);
        
        return {
            success: true,
            diseno,
            total_disenos: disenosExistentes.length
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// =================================================================
// SERVICIO: LISTAR DISEÑOS
// =================================================================

async function listDesigns(filtros = {}) {
    try {
        let disenos = await cargarDisenos();
        
        // Aplicar filtros si existen
        if (filtros.terreno) {
            disenos = disenos.filter(d => d.ubicacion.terreno_tipo === filtros.terreno);
        }
        
        if (filtros.altura_min) {
            disenos = disenos.filter(d => d.especificaciones.dimensiones.altura_total_m >= filtros.altura_min);
        }
        
        if (filtros.altura_max) {
            disenos = disenos.filter(d => d.especificaciones.dimensiones.altura_total_m <= filtros.altura_max);
        }
        
        return {
            success: true,
            total: disenos.length,
            disenos: disenos
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// =================================================================
// SERVICIO: OBTENER DISEÑO POR ID
// =================================================================

async function getDesignById(id_proyecto) {
    try {
        const disenos = await cargarDisenos();
        const diseno = disenos.find(d => d.id_proyecto === id_proyecto);
        
        if (!diseno) {
            return {
                success: false,
                error: "Diseño no encontrado"
            };
        }
        
        return {
            success: true,
            diseno
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// =================================================================
// SERVICIO: GENERACIÓN MASIVA
// =================================================================

async function generateBulk(combinaciones, limite = 30) {
    try {
        const disenosGenerados = [];
        const errores = [];
        const maxGeneraciones = Math.min(combinaciones.length, limite);
        
        for (let i = 0; i < maxGeneraciones; i++) {
            try {
                const config = combinaciones[i];
                const diseno = await generarDisenoCompleto(config);
                disenosGenerados.push(diseno);
            } catch (error) {
                errores.push({
                    index: i,
                    config: combinaciones[i],
                    error: error.message
                });
            }
        }
        
        // Cargar diseños existentes y agregar nuevos
        const disenosExistentes = await cargarDisenos();
        const disenosCombinados = [...disenosExistentes, ...disenosGenerados];
        await guardarDisenos(disenosCombinados);
        
        return {
            success: true,
            generados: disenosGenerados.length,
            errores: errores.length,
            total_portafolio: disenosCombinados.length,
            detalles_errores: errores
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// =================================================================
// SERVICIO: ESTADÍSTICAS
// =================================================================

async function getStats() {
    try {
        const disenos = await cargarDisenos();
        
        if (disenos.length === 0) {
            return {
                success: true,
                total_disenos: 0,
                mensaje: "No hay diseños generados aún"
            };
        }
        
        // Calcular valor total
        const valorTotal = disenos.reduce((sum, d) => {
            const valor = parseFloat(d.valoracion.valor_mercado_usd.replace(/,/g, ''));
            return sum + (isNaN(valor) ? 0 : valor);
        }, 0);
        
        // Agrupar por tipo de terreno
        const porTerreno = disenos.reduce((acc, d) => {
            const terreno = d.ubicacion.terreno_tipo;
            acc[terreno] = (acc[terreno] || 0) + 1;
            return acc;
        }, {});
        
        // Diseño más alto
        const masAlto = disenos.reduce((max, d) => {
            return d.especificaciones.dimensiones.altura_total_m > (max?.especificaciones?.dimensiones?.altura_total_m || 0) ? d : max;
        }, disenos[0]);
        
        return {
            success: true,
            total_disenos: disenos.length,
            valor_total_portafolio_usd: valorTotal.toLocaleString(),
            valor_promedio_usd: (valorTotal / disenos.length).toLocaleString(),
            distribucion_terreno: porTerreno,
            diseño_mas_alto: {
                id: masAlto.id_proyecto,
                nombre: masAlto.diseño.nombre,
                altura_m: masAlto.especificaciones.dimensiones.altura_total_m
            }
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// =================================================================
// EXPORTAR SERVICIOS
// =================================================================

module.exports = {
    generateDesign,
    listDesigns,
    getDesignById,
    generateBulk,
    getStats
};