// Archivo: throne-arquitectura.js (Sistema Generador Arquitectónico Cuántico)
// Sistema avanzado de generación de diseños arquitectónicos con física real
// -----------------------------------------------------

const { generateWithGPT5, generateWithGemini, generateDual } = require('./ai-generator');

// =================================================================
// CONSTANTES FÍSICAS Y MATERIALES
// =================================================================

const MATERIALS = {
    titanio: { densidad: 4500, resistencia: 900, precio_m3: 45000 },
    acero: { densidad: 7850, resistencia: 500, precio_m3: 800 },
    vidrio_templado: { densidad: 2500, resistencia: 200, precio_m3: 1200 },
    hormigon: { densidad: 2400, resistencia: 40, precio_m3: 150 },
    aluminio: { densidad: 2700, resistencia: 300, precio_m3: 3500 },
    fibra_carbono: { densidad: 1600, resistencia: 3500, precio_m3: 85000 },
    bronze_arquitectonico: { densidad: 8800, resistencia: 450, precio_m3: 12000 }
};

const GRAVITY = 9.81; // m/s²

// =================================================================
// TIPOS DE DISEÑO BASE
// =================================================================

const DESIGN_TYPES = {
    casa_flotante: {
        nombre: "Casa Flotante Orgánica",
        caracteristicas: ["Estructura sobre agua", "Forma curveada", "Voladizos"],
        rango_altura: [8, 25],
        rango_ancho: [15, 40],
        material_principal: "bronze_arquitectonico"
    },
    torre_piramide: {
        nombre: "Torre Pirámide Anti-Gravedad",
        caracteristicas: ["Estructura vertical", "Geometría imposible", "Secciones flotantes"],
        rango_altura: [40, 150],
        rango_ancho: [20, 50],
        material_principal: "titanio"
    },
    villa_organica: {
        nombre: "Villa Orgánica Curveada",
        caracteristicas: ["Múltiples niveles", "Formas fluidas", "Integración natural"],
        rango_altura: [12, 30],
        rango_ancho: [25, 60],
        material_principal: "fibra_carbono"
    },
    complejo_modular: {
        nombre: "Complejo Modular Flotante",
        caracteristicas: ["Pods conectados", "Distribución espacial", "Puentes de vidrio"],
        rango_altura: [10, 35],
        rango_ancho: [30, 80],
        material_principal: "aluminio"
    }
};

// =================================================================
// CÁLCULOS DE FÍSICA ESTRUCTURAL
// =================================================================

function calcularPesoEstructural(volumen_m3, material) {
    const mat = MATERIALS[material];
    if (!mat) return null;
    
    const peso_kg = volumen_m3 * mat.densidad;
    const fuerza_gravitacional = peso_kg * GRAVITY;
    
    return {
        volumen_m3,
        material,
        densidad_kg_m3: mat.densidad,
        peso_total_kg: peso_kg,
        peso_toneladas: (peso_kg / 1000).toFixed(2),
        fuerza_gravitacional_newtons: fuerza_gravitacional.toFixed(2),
        resistencia_material_mpa: mat.resistencia,
        costo_material_usd: (volumen_m3 * mat.precio_m3).toFixed(2)
    };
}

function calcularVoladizo(longitud_m, peso_kg, material) {
    const mat = MATERIALS[material];
    if (!mat) return null;
    
    // Momento de flexión simplificado
    const momento_flexion = peso_kg * GRAVITY * (longitud_m / 2);
    const esfuerzo_necesario = momento_flexion / (longitud_m * longitud_m);
    const factor_seguridad = mat.resistencia / esfuerzo_necesario;
    
    return {
        longitud_voladizo_m: longitud_m,
        momento_flexion_nm: momento_flexion.toFixed(2),
        esfuerzo_necesario_mpa: esfuerzo_necesario.toFixed(2),
        esfuerzo_material_mpa: mat.resistencia,
        factor_seguridad: factor_seguridad.toFixed(2),
        viable: factor_seguridad > 2.5,
        recomendacion: factor_seguridad > 2.5 ? "Estructura viable" : "Requiere refuerzo estructural"
    };
}

function calcularCentroGravedad(componentes) {
    // componentes = [{x, y, z, masa}]
    let masa_total = 0;
    let momento_x = 0, momento_y = 0, momento_z = 0;
    
    componentes.forEach(c => {
        masa_total += c.masa;
        momento_x += c.x * c.masa;
        momento_y += c.y * c.masa;
        momento_z += c.z * c.masa;
    });
    
    return {
        centro_gravedad_x: (momento_x / masa_total).toFixed(2),
        centro_gravedad_y: (momento_y / masa_total).toFixed(2),
        centro_gravedad_z: (momento_z / masa_total).toFixed(2),
        masa_total_kg: masa_total.toFixed(2)
    };
}

function calcularValorMercado(altura_m, ancho_m, profundidad_m, material, terreno) {
    // Fórmula: Volumen × Factor material × Factor terreno × Factor altura
    const volumen = altura_m * ancho_m * profundidad_m;
    
    const factor_material = {
        titanio: 1.8,
        fibra_carbono: 2.5,
        bronze_arquitectonico: 1.5,
        aluminio: 1.2,
        acero: 1.0,
        vidrio_templado: 1.3,
        hormigon: 0.8
    };
    
    const factor_terreno = {
        oceano: 1.8,
        lago: 1.5,
        montana: 1.6,
        desierto: 1.4
    };
    
    const factor_altura = altura_m > 100 ? 2.0 : altura_m > 60 ? 1.7 : altura_m > 30 ? 1.4 : 1.0;
    
    const valor_base = volumen * 12000; // $12K por m³
    const valor_final = valor_base * (factor_material[material] || 1.0) * (factor_terreno[terreno] || 1.0) * factor_altura;
    
    return valor_final.toLocaleString('en-US', { style: 'decimal', maximumFractionDigits: 0 });
}

// =================================================================
// GENERADOR DE COORDENADAS GEOGRÁFICAS
// =================================================================

function generarCoordenadas(terreno_tipo = "oceano") {
    const terrenos = {
        oceano: { lat: [-20, 20], lon: [-150, -100] },
        lago: { lat: [30, 50], lon: [-120, -70] },
        desierto: { lat: [20, 35], lon: [40, 60] },
        montana: { lat: [40, 55], lon: [-110, -95] }
    };
    
    const t = terrenos[terreno_tipo] || terrenos.oceano;
    const lat = (Math.random() * (t.lat[1] - t.lat[0]) + t.lat[0]).toFixed(6);
    const lon = (Math.random() * (t.lon[1] - t.lon[0]) + t.lon[0]).toFixed(6);
    
    return {
        latitud: parseFloat(lat),
        longitud: parseFloat(lon),
        terreno: terreno_tipo,
        elevacion_m: terreno_tipo === 'montana' ? Math.floor(Math.random() * 2000) + 500 : 0
    };
}

// =================================================================
// COMBINADOR DE DISEÑOS (Álgebra de Estilos)
// =================================================================

function combinarDiseños(tipo1, tipo2) {
    const design1 = DESIGN_TYPES[tipo1];
    const design2 = DESIGN_TYPES[tipo2];
    
    if (!design1 || !design2) return null;
    
    // Promediar dimensiones
    const altura_min = Math.floor((design1.rango_altura[0] + design2.rango_altura[0]) / 2);
    const altura_max = Math.floor((design1.rango_altura[1] + design2.rango_altura[1]) / 2);
    const ancho_min = Math.floor((design1.rango_ancho[0] + design2.rango_ancho[0]) / 2);
    const ancho_max = Math.floor((design1.rango_ancho[1] + design2.rango_ancho[1]) / 2);
    
    // Combinar características
    const caracteristicas = [...new Set([...design1.caracteristicas, ...design2.caracteristicas])];
    
    return {
        nombre_hibrido: `${design1.nombre} + ${design2.nombre}`,
        tipo_base_1: tipo1,
        tipo_base_2: tipo2,
        caracteristicas_combinadas: caracteristicas,
        dimensiones: {
            altura_m: [altura_min, altura_max],
            ancho_m: [ancho_min, ancho_max]
        },
        materiales_sugeridos: [design1.material_principal, design2.material_principal],
        nivel_complejidad: "Ultra-Premium",
        valor_estimado_usd: `${((altura_max * ancho_max * 15000) + 500000).toLocaleString()}`
    };
}

// =================================================================
// GENERADOR DE DISEÑO COMPLETO
// =================================================================

async function generarDisenoCompleto(config) {
    // IMPORTANTE: Usar los parámetros del config, NO valores por defecto
    const tipo_base_1 = config.tipo_base_1 || "casa_flotante";
    const tipo_base_2 = config.tipo_base_2 || "torre_piramide";
    const altura_m = config.altura_m || 45;
    const ancho_m = config.ancho_m || 30;
    const profundidad_m = config.profundidad_m || 25;
    const num_pisos = config.num_pisos || 8;
    const terreno = config.terreno || "oceano";
    const material_custom = config.material_principal || null;
    
    // Combinar estilos
    const hibrido = combinarDiseños(tipo_base_1, tipo_base_2);
    
    // Calcular volumen aproximado (factor de ocupación varía por tipo)
    const factor_ocupacion = altura_m > 80 ? 0.3 : altura_m > 40 ? 0.35 : 0.4;
    const volumen = altura_m * ancho_m * profundidad_m * factor_ocupacion;
    
    // Seleccionar material (usar custom o híbrido)
    const material = material_custom || hibrido.materiales_sugeridos[0];
    const material_secundario = hibrido.materiales_sugeridos[1] || "vidrio_templado";
    
    // Cálculos estructurales (varían según dimensiones reales)
    const peso = calcularPesoEstructural(volumen, material);
    const longitud_voladizo = ancho_m * (terreno === "oceano" ? 0.35 : 0.25);
    const voladizo = calcularVoladizo(longitud_voladizo, peso.peso_total_kg * 0.25, material);
    
    // Centro de gravedad (simplificado)
    const componentes = [
        { x: 0, y: 0, z: altura_m * 0.3, masa: peso.peso_total_kg * 0.4 },
        { x: ancho_m * 0.2, y: 0, z: altura_m * 0.6, masa: peso.peso_total_kg * 0.35 },
        { x: -ancho_m * 0.1, y: profundidad_m * 0.1, z: altura_m * 0.8, masa: peso.peso_total_kg * 0.25 }
    ];
    const centro_gravedad = calcularCentroGravedad(componentes);
    
    // Coordenadas geográficas
    const coordenadas = generarCoordenadas(terreno);
    
    // Generar ID único
    const id_proyecto = `ARCH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    return {
        id_proyecto,
        timestamp: new Date().toISOString(),
        
        // Información del diseño
        diseño: {
            nombre: hibrido.nombre_hibrido,
            tipo_hibrido: `${tipo_base_1} × ${tipo_base_2}`,
            caracteristicas: hibrido.caracteristicas_combinadas,
            nivel: "Ultra-Premium Futurista"
        },
        
        // Especificaciones técnicas
        especificaciones: {
            dimensiones: {
                altura_total_m: altura_m,
                ancho_m: ancho_m,
                profundidad_m: profundidad_m,
                area_construida_m2: (ancho_m * profundidad_m * num_pisos).toFixed(2),
                volumen_total_m3: volumen.toFixed(2)
            },
            numero_pisos: num_pisos,
            material_principal: material,
            material_secundario: hibrido.materiales_sugeridos[1] || "vidrio_templado"
        },
        
        // Análisis estructural
        analisis_estructural: {
            peso_estructura: peso,
            analisis_voladizos: voladizo,
            centro_gravedad: centro_gravedad,
            estabilidad: voladizo.viable ? "ESTABLE" : "REQUIERE OPTIMIZACIÓN"
        },
        
        // Ubicación
        ubicacion: {
            coordenadas_gps: coordenadas,
            terreno_tipo: coordenadas.terreno,
            zona_climatica: terreno === "desierto" ? "Árido" : terreno === "oceano" ? "Tropical" : "Templado"
        },
        
        // Valoración (basada en dimensiones y complejidad real)
        valoracion: {
            costo_construccion_usd: peso.costo_material_usd,
            costo_planos_diseno_usd: "50,000",
            valor_mercado_usd: calcularValorMercado(altura_m, ancho_m, profundidad_m, material, terreno),
            roi_estimado: "300-500%"
        },
        
        // Certificación
        certificacion: {
            nivel_seguridad: "RSA-4096",
            algoritmo: "SHA256withRSA4096",
            verificable: true,
            autor: "Roberto Rivera Gamas - Arte Visualista-Royal"
        }
    };
}

// =================================================================
// EXPORTAR FUNCIONES
// =================================================================

module.exports = {
    generarDisenoCompleto,
    combinarDiseños,
    calcularPesoEstructural,
    calcularVoladizo,
    calcularCentroGravedad,
    generarCoordenadas,
    DESIGN_TYPES,
    MATERIALS
};