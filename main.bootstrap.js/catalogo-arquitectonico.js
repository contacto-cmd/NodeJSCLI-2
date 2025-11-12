// ============================================================
// CATÁLOGO ARQUITECTÓNICO - 30 DISEÑOS FUTURISTAS
// Street Emporio Royal - Roberto Rivera Gamas
// Valoración Total: $229,800,000,000 USD
// ============================================================

const CATALOGO_ARQUITECTONICO = [
    {
        id: "ARQ-001",
        nombre: "Torre Futurista Antigravedad Alpha",
        tipo: "Torre Comercial",
        imagen: "Torre_Futurista_Antigravedad_01_5bbc70f0.png",
        precio_usd: 12500000000,
        coordenadas: { lat: 25.6866, lon: -100.3161, altitud: 540 },
        especificaciones: {
            altura_metros: 680,
            plantas: 145,
            area_construida_m2: 285000,
            capacidad_gravedad: "0.85G compensada",
            materiales: ["Titanio aeroespacial", "Cristal nanotecnológico", "Aleaciones cuánticas"],
            tecnologia: "Sistema antigravitacional magnético cuántico"
        }
    },
    {
        id: "ARQ-002",
        nombre: "Casa Flotante Oceánica Neptuno",
        tipo: "Residencia Flotante",
        imagen: "Casa_Flotante_Oceánica_01_3bd252c1.png",
        precio_usd: 8750000000,
        coordenadas: { lat: 20.6597, lon: -105.2275, altitud: 85 },
        especificaciones: {
            altura_metros: 45,
            plantas: 3,
            area_construida_m2: 2400,
            capacidad_gravedad: "0.92G estabilizada",
            materiales: ["Vidrio marino reforzado", "Acero inoxidable 316L", "Polímeros hidrofóbicos"],
            tecnologia: "Suspensión electromagnética sobre agua"
        }
    },
    {
        id: "ARQ-003",
        nombre: "Torre Espiral Rotativa Helix",
        tipo: "Torre Mixta",
        imagen: "Torre_Espiral_Rotativa_01_0f22358f.png",
        precio_usd: 15200000000,
        coordenadas: { lat: 19.4326, lon: -99.1332, altitud: 2240 },
        especificaciones: {
            altura_metros: 820,
            plantas: 180,
            area_construida_m2: 420000,
            capacidad_gravedad: "0.88G con rotación controlada",
            materiales: ["Oro arquitectónico 24K", "Carbono nanocristalino", "Acero tensado"],
            tecnologia: "Rotación giroscópica independiente por sección"
        }
    },
    {
        id: "ARQ-004",
        nombre: "Complejo Residencial Suspendido Nimbus",
        tipo: "Complejo Residencial",
        imagen: "Complejo_Residencial_Suspendido_01_5e767d00.png",
        precio_usd: 22300000000,
        coordenadas: { lat: 32.5149, lon: -116.9719, altitud: 1820 },
        especificaciones: {
            altura_metros: 420,
            plantas: 85,
            area_construida_m2: 680000,
            capacidad_gravedad: "0.95G distribuida",
            materiales: ["Cristal autolimpiable", "Aluminio aeronáutico", "Jardines hidropónicos"],
            tecnologia: "Red de plataformas antigravitacionales interconectadas"
        }
    },
    {
        id: "ARQ-005",
        nombre: "Torre Cristalina Geométrica Diamond",
        tipo: "Torre Corporativa",
        imagen: "Torre_Cristalina_Geométrica_01_ee259d0f.png",
        precio_usd: 18900000000,
        coordenadas: { lat: 21.1619, lon: -86.8515, altitud: 15 },
        especificaciones: {
            altura_metros: 755,
            plantas: 165,
            area_construida_m2: 390000,
            capacidad_gravedad: "0.90G facetada",
            materiales: ["Diamante sintético estructural", "Cristal holográfico", "Titanio pulido"],
            tecnologia: "Facetas prismaticas con orientación solar automática"
        }
    },
    {
        id: "ARQ-006",
        nombre: "Pirámide Flotante Monumental Giza-X",
        tipo: "Complejo Cultural",
        imagen: "Pirámide_Flotante_Monumental_01_6312b487.png",
        precio_usd: 28500000000,
        coordenadas: { lat: 26.0285, lon: -111.3479, altitud: 480 },
        especificaciones: {
            altura_metros: 280,
            plantas: 45,
            area_construida_m2: 520000,
            capacidad_gravedad: "0.82G levitante",
            materiales: ["Oro macizo laminado", "Piedra cuántica", "Energía plasmática"],
            tecnologia: "Levitación piramidal por resonancia electromagnética"
        }
    },
    {
        id: "ARQ-007",
        nombre: "Torre Bosque Vertical EcoSphere",
        tipo: "Torre Ecológica",
        imagen: "Torre_Bosque_Vertical_01_7342501b.png",
        precio_usd: 11200000000,
        coordenadas: { lat: 23.6345, lon: -102.5528, altitud: 1850 },
        especificaciones: {
            altura_metros: 590,
            plantas: 120,
            area_construida_m2: 245000,
            capacidad_gravedad: "0.96G orgánica",
            materiales: ["Madera tecnificada", "Bioconcreto", "Sistemas radiculares integrados"],
            tecnologia: "Fotosíntesis arquitectónica + purificación aire 360°"
        }
    },
    {
        id: "ARQ-008",
        nombre: "Estación Anillo Orbital Terrestre Halo",
        tipo: "Estación Residencial",
        imagen: "Estación_Anillo_Orbital_Terrestre_01_bd0fb3bd.png",
        precio_usd: 45600000000,
        coordenadas: { lat: 19.0414, lon: -98.2063, altitud: 3500 },
        especificaciones: {
            altura_metros: 180,
            plantas: 25,
            area_construida_m2: 1200000,
            capacidad_gravedad: "0.75G rotacional",
            materiales: ["Aleación espacial", "Escudos de plasma", "Generadores cuánticos"],
            tecnologia: "Anillo de gravedad artificial por rotación centrífuga"
        }
    },
    {
        id: "ARQ-009",
        nombre: "Ciudad Domo Submarina Atlantis-II",
        tipo: "Ciudad Submarina",
        imagen: "Ciudad_Dópula_Submarina_01_02acd31a.png",
        precio_usd: 38400000000,
        coordenadas: { lat: 18.2658, lon: -87.6789, altitud: -125 },
        especificaciones: {
            altura_metros: 95,
            plantas: 12,
            area_construida_m2: 980000,
            capacidad_gravedad: "1.08G presión compensada",
            materiales: ["Cristal presurizado ultra-resistente", "Titanio marino", "Bioluminiscencia"],
            tecnologia: "Cúpula de presión activa + ecosistema acuático integrado"
        }
    },
    {
        id: "ARQ-010",
        nombre: "Torre Hélice ADN Genesis",
        tipo: "Torre Biotecnológica",
        imagen: "Torre_Hélice_ADN_01_eaeeda80.png",
        precio_usd: 16700000000,
        coordenadas: { lat: 20.6737, lon: -103.3444, altitud: 1540 },
        especificaciones: {
            altura_metros: 710,
            plantas: 155,
            area_construida_m2: 340000,
            capacidad_gravedad: "0.89G helicoidal",
            materiales: ["Cromo espejado", "Polímeros bioactivos", "Cristal inteligente"],
            tecnologia: "Estructura de doble hélice con rotación sincronizada"
        }
    },
    {
        id: "ARQ-011",
        nombre: "Mansión Cubo Flotante SkyBox",
        tipo: "Residencia Privada",
        imagen: "Mansión_Cubo_Flotante_01_a8424a78.png",
        precio_usd: 5900000000,
        coordenadas: { lat: 28.6353, lon: -106.0889, altitud: 2680 },
        especificaciones: {
            altura_metros: 85,
            plantas: 6,
            area_construida_m2: 3800,
            capacidad_gravedad: "0.94G cúbica",
            materiales: ["Vidrio blindado", "Marco de carbono negro", "Mármol suspendido"],
            tecnologia: "Suspensión cuántica de 6 ejes independientes"
        }
    },
    {
        id: "ARQ-012",
        nombre: "Torre Ola Fluida WaveForm",
        tipo: "Torre Hotelera",
        imagen: "Torre_Ola_Fluida_01_a1730a68.png",
        precio_usd: 13400000000,
        coordenadas: { lat: 16.8531, lon: -99.8237, altitud: 3 },
        especificaciones: {
            altura_metros: 625,
            plantas: 135,
            area_construida_m2: 295000,
            capacidad_gravedad: "0.91G ondulante",
            materiales: ["Acero líquido moldeado", "Plata arquitectónica", "Paneles solares fluidos"],
            tecnologia: "Fachada ondulante con memoria de forma adaptativa"
        }
    },
    {
        id: "ARQ-013",
        nombre: "Torre Prisma Triangular Apex",
        tipo: "Torre Financiera",
        imagen: "Torre_Prisma_Triangular_01_dd7ca07d.png",
        precio_usd: 19800000000,
        coordenadas: { lat: 25.6714, lon: -100.3089, altitud: 540 },
        especificaciones: {
            altura_metros: 890,
            plantas: 195,
            area_construida_m2: 485000,
            capacidad_gravedad: "0.87G triangulada",
            materiales: ["Vidrio negro nano-recubierto", "Oro de 18K esquinas", "Acero prismático"],
            tecnologia: "Estructura triangular con núcleo de levitación central"
        }
    },
    {
        id: "ARQ-014",
        nombre: "Cluster Esferas Residenciales Nebula",
        tipo: "Complejo Residencial",
        imagen: "Cluster_Esferas_Residenciales_01_a66dfa1b.png",
        precio_usd: 24100000000,
        coordenadas: { lat: 31.6904, lon: -106.4245, altitud: 3120 },
        especificaciones: {
            altura_metros: 340,
            plantas: 65,
            area_construida_m2: 720000,
            capacidad_gravedad: "0.93G esférica distribuida",
            materiales: ["Cúpulas de cristal curvado", "Puentes de carbono", "Jardines aéreos"],
            tecnologia: "Red de esferas conectadas por pasarelas antigravitacionales"
        }
    },
    {
        id: "ARQ-015",
        nombre: "Pirámide Invertida Antigravedad Upsilon",
        tipo: "Torre Comercial",
        imagen: "Pirámide_Invertida_Antigravedad_01_19993671.png",
        precio_usd: 17500000000,
        coordenadas: { lat: 20.9674, lon: -89.5926, altitud: 8 },
        especificaciones: {
            altura_metros: 480,
            plantas: 95,
            area_construida_m2: 365000,
            capacidad_gravedad: "0.78G invertida estabilizada",
            materiales: ["Oro reflectivo", "Cristal tintado dorado", "Base cuántica de anclaje"],
            tecnologia: "Pirámide invertida con contrapeso gravitacional superior"
        }
    },
    {
        id: "ARQ-016",
        nombre: "Mega Puente Ciudad Integrada Atlas",
        tipo: "Infraestructura Urbana",
        imagen: "Mega_Puente_Ciudad_Integrada_01_abb93077.png",
        precio_usd: 52000000000,
        coordenadas: { lat: 22.1565, lon: -100.9855, altitud: 1890 },
        especificaciones: {
            altura_metros: 380,
            plantas: 45,
            area_construida_m2: 1850000,
            capacidad_gravedad: "0.97G distribuida longitudinalmente",
            materiales: ["Acero de ultra-resistencia", "Hormigón tecnológico", "Vidrio estructural"],
            tecnologia: "Puente habitado con ciudad suspendida en vano principal"
        }
    },
    {
        id: "ARQ-017",
        nombre: "Hotel Resort Flotante Tropical Paradise",
        tipo: "Resort Flotante",
        imagen: "Hotel_Resort_Flotante_Tropical_01_f351c4c0.png",
        precio_usd: 9600000000,
        coordenadas: { lat: 21.0285, lon: -86.7739, altitud: 120 },
        especificaciones: {
            altura_metros: 65,
            plantas: 8,
            area_construida_m2: 48000,
            capacidad_gravedad: "0.95G resort",
            materiales: ["Vidrio tropical", "Madera exótica tratada", "Piscinas de cristal"],
            tecnologia: "Plataforma flotante con piscinas infinitas suspendidas"
        }
    },
    {
        id: "ARQ-018",
        nombre: "Torre Cono Invertido Vertex",
        tipo: "Torre Oficinas",
        imagen: "Torre_Cono_Invertido_01_b796b707.png",
        precio_usd: 14300000000,
        coordenadas: { lat: 19.4969, lon: -99.1242, altitud: 2250 },
        especificaciones: {
            altura_metros: 560,
            plantas: 115,
            area_construida_m2: 275000,
            capacidad_gravedad: "0.84G punto de equilibrio",
            materiales: ["Plata pulida", "Cristal ahumado", "Base reforzada cuántica"],
            tecnologia: "Cono balanceado en un solo punto con estabilización magnética"
        }
    },
    {
        id: "ARQ-019",
        nombre: "Torre Módulos Cúbicos Apilados Tetris",
        tipo: "Torre Residencial",
        imagen: "Torre_Módulos_Cúbicos_Apilados_01_63a25c17.png",
        precio_usd: 10800000000,
        coordenadas: { lat: 32.6278, lon: -115.4545, altitud: 40 },
        especificaciones: {
            altura_metros: 485,
            plantas: 95,
            area_construida_m2: 220000,
            capacidad_gravedad: "0.92G modular",
            materiales: ["Concreto prefabricado", "Acero negro mate", "Terrazas verdes"],
            tecnologia: "Módulos apilados con juntas sísmicas inteligentes"
        }
    },
    {
        id: "ARQ-020",
        nombre: "Museo Arte Flotante Mirage",
        tipo: "Museo Cultural",
        imagen: "Museo_Arte_Flotante_01_5e4cdca4.png",
        precio_usd: 7200000000,
        coordenadas: { lat: 25.7939, lon: -109.0119, altitud: 85 },
        especificaciones: {
            altura_metros: 55,
            plantas: 5,
            area_construida_m2: 35000,
            capacidad_gravedad: "0.96G cultural",
            materiales: ["Cristal curvado", "Mármol blanco Carrara", "Iluminación LED integrada"],
            tecnologia: "Museo flotante con reflejos sobre espejo de agua"
        }
    },
    {
        id: "ARQ-021",
        nombre: "Torre Jardín Vertical Vivo BioTower",
        tipo: "Torre Ecológica",
        imagen: "Torre_Jardín_Vertical_Vivo_01_82c526bd.png",
        precio_usd: 12100000000,
        coordenadas: { lat: 17.0654, lon: -96.7236, altitud: 1550 },
        especificaciones: {
            altura_metros: 640,
            plantas: 130,
            area_construida_m2: 265000,
            capacidad_gravedad: "0.94G vegetal",
            materiales: ["Sustrato orgánico estructural", "Riego automatizado", "Paneles fotovoltaicos"],
            tecnologia: "Fachada viva con 85,000 plantas y sistema de riego vertical"
        }
    },
    {
        id: "ARQ-022",
        nombre: "Observatorio Esfera Flotante Montaña Cosmos",
        tipo: "Observatorio Científico",
        imagen: "Observatorio_Esfera_Flotante_Montaña_01_2f1f793f.png",
        precio_usd: 6400000000,
        coordenadas: { lat: 18.9862, lon: -97.4214, altitud: 4580 },
        especificaciones: {
            altura_metros: 75,
            plantas: 4,
            area_construida_m2: 12000,
            capacidad_gravedad: "0.89G alta montaña",
            materiales: ["Cúpula de cristal astronómico", "Titanio resistente", "Telescopios integrados"],
            tecnologia: "Esfera flotante con eliminación de vibraciones sísmicas"
        }
    },
    {
        id: "ARQ-023",
        nombre: "Torre Helicoidal Rotativa Vortex",
        tipo: "Torre Mixta",
        imagen: "Torre_Helicoidal_Rotativa_01_8e38e6d0.png",
        precio_usd: 21700000000,
        coordenadas: { lat: 20.6597, lon: -103.3496, altitud: 1566 },
        especificaciones: {
            altura_metros: 775,
            plantas: 170,
            area_construida_m2: 445000,
            capacidad_gravedad: "0.86G espiral",
            materiales: ["Oro negro arquitectónico", "Cristal rotativo", "Motores cuánticos"],
            tecnologia: "Pisos rotatorios independientes con hélice completa"
        }
    },
    {
        id: "ARQ-024",
        nombre: "Isla Residencial Flotante Elysium",
        tipo: "Comunidad Flotante",
        imagen: "Isla_Residencial_Flotante_01_0a67cb9a.png",
        precio_usd: 42800000000,
        coordenadas: { lat: 24.1426, lon: -110.3129, altitud: 850 },
        especificaciones: {
            altura_metros: 280,
            plantas: 35,
            area_construida_m2: 1450000,
            capacidad_gravedad: "0.98G comunitaria",
            materiales: ["Tierra sintética estabilizada", "Vegetación real", "Infraestructura oculta"],
            tecnologia: "Isla completa flotante con calles, parques y 500 residencias"
        }
    },
    {
        id: "ARQ-025",
        nombre: "Torre Zigzag Angular Fractal",
        tipo: "Torre Corporativa",
        imagen: "Torre_Zigzag_Angular_01_095cca30.png",
        precio_usd: 16200000000,
        coordenadas: { lat: 19.3910, lon: -99.2837, altitud: 2240 },
        especificaciones: {
            altura_metros: 695,
            plantas: 150,
            area_construida_m2: 355000,
            capacidad_gravedad: "0.90G angular",
            materiales: ["Vidrio negro espejado", "Acero angulado", "Juntas flexibles"],
            tecnologia: "Diseño zigzag con amortiguación sísmica avanzada"
        }
    },
    {
        id: "ARQ-026",
        nombre: "Torre Tetris Modular Colorida ChromaStack",
        tipo: "Torre Residencial",
        imagen: "Torre_Tetris_Modular_Colorida_01_d74b96b9.png",
        precio_usd: 9100000000,
        coordenadas: { lat: 22.2710, lon: -97.8446, altitud: 18 },
        especificaciones: {
            altura_metros: 420,
            plantas: 85,
            area_construida_m2: 195000,
            capacidad_gravedad: "0.95G lúdica",
            materiales: ["Paneles de colores resistentes UV", "Acero modular", "Conexiones tipo Tetris"],
            tecnologia: "Módulos intercambiables con ensamblaje tipo bloques"
        }
    },
    {
        id: "ARQ-027",
        nombre: "Yate-Mansión Flotante Lujo Poseidon",
        tipo: "Residencia Náutica Flotante",
        imagen: "Yate-Mansión_Flotante_Lujo_01_5642269e.png",
        precio_usd: 8300000000,
        coordenadas: { lat: 23.6345, lon: -109.3922, altitud: 95 },
        especificaciones: {
            altura_metros: 55,
            plantas: 5,
            area_construida_m2: 6200,
            capacidad_gravedad: "0.93G náutica",
            materiales: ["Fibra de carbono naval", "Vidrio marino", "Madera de teca premium"],
            tecnologia: "Superyate suspendido en aire con vistas submarinas"
        }
    },
    {
        id: "ARQ-028",
        nombre: "Edificio Loop Infinito Möbius",
        tipo: "Complejo Comercial",
        imagen: "Edificio_Loop_Infinito_01_d490b2fc.png",
        precio_usd: 26900000000,
        coordenadas: { lat: 19.7025, lon: -101.1846, altitud: 1930 },
        especificaciones: {
            altura_metros: 320,
            plantas: 55,
            area_construida_m2: 580000,
            capacidad_gravedad: "0.88G continua",
            materiales: ["Plata pulida", "Cristal curvado continuo", "Acero torsional"],
            tecnologia: "Banda de Möbius arquitectónica con recorrido infinito"
        }
    },
    {
        id: "ARQ-029",
        nombre: "Torre Cuchilla Vertical Ultra-Delgada Blade",
        tipo: "Torre Residencial Premium",
        imagen: "Torre_Cuchilla_Vertical_Ultra-Delgada_01_2e5a3827.png",
        precio_usd: 13900000000,
        coordenadas: { lat: 25.6488, lon: -100.2974, altitud: 540 },
        especificaciones: {
            altura_metros: 720,
            plantas: 160,
            area_construida_m2: 115000,
            capacidad_gravedad: "0.91G ultra-delgada",
            materiales: ["Acero ultra-resistente", "Vidrio de seguridad delgado", "Contrapesos internos"],
            tecnologia: "Torre de apenas 12 metros de ancho con perfil mínimo"
        }
    },
    {
        id: "ARQ-030",
        nombre: "Anfiteatro Flotante Bosque Sylvan",
        tipo: "Venue Cultural",
        imagen: "Anfiteatro_Flotante_Bosque_01_555dabca.png",
        precio_usd: 4800000000,
        coordenadas: { lat: 19.5652, lon: -96.9269, altitud: 1320 },
        especificaciones: {
            altura_metros: 45,
            plantas: 3,
            area_construida_m2: 18500,
            capacidad_gravedad: "0.97G acústica",
            materiales: ["Madera acústica natural", "Cristal protector", "Asientos levitantes"],
            tecnologia: "Anfiteatro suspendido con acústica natural mejorada"
        }
    }
];

// Valoración total
const VALORACION_TOTAL = CATALOGO_ARQUITECTONICO.reduce((sum, item) => sum + item.precio_usd, 0);

console.log(`📊 Catálogo cargado: ${CATALOGO_ARQUITECTONICO.length} diseños arquitectónicos`);
console.log(`💰 Valoración total: $${(VALORACION_TOTAL / 1000000000).toFixed(1)}B USD`);

module.exports = {
    CATALOGO_ARQUITECTONICO,
    VALORACION_TOTAL
};
