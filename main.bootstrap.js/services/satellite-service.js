// ========================================
// LGORITMO AHT - SATELLITE SERVICE
// Tracking de Satélites en Tiempo Real
// ========================================

const satellite = require('satellite.js');

class SatelliteService {
  constructor() {
    this.satellites = this.initializeSatellites();
    this.estado = 'TRACKING';
  }

  // Satélites iniciales para tracking
  initializeSatellites() {
    return [
      {
        noradId: '25544',
        nombre: 'ISS (ZARYA)',
        tipo: 'ISS',
        // TLE actualizado (ejemplo - debe actualizarse periódicamente)
        tle1: '1 25544U 98067A   21001.00000000  .00002182  00000-0  41420-4 0  9990',
        tle2: '2 25544  51.6461 339.8014 0002571  34.5857  94.0838 15.48919393265019',
        descripcion: 'Estación Espacial Internacional',
        estado: 'tracking'
      },
      {
        noradId: '43013',
        nombre: 'STARLINK-1007',
        tipo: 'STARLINK',
        tle1: '1 43013U 17073A   21001.00000000  .00001234  00000-0  12345-4 0  9991',
        tle2: '2 43013  53.0001 123.4567 0001234  90.1234 269.8765 15.06123456123456',
        descripcion: 'Constelación Starlink de SpaceX',
        estado: 'tracking'
      },
      {
        noradId: '37849',
        nombre: 'GALILEO-FOC FM1',
        tipo: 'GALILEO',
        tle1: '1 37849U 11060A   21001.00000000  .00000012  00000-0  00000-0 0  9992',
        tle2: '2 37849  56.7234 123.4567 0001234 123.4567 236.5432 1.70475123123456',
        descripcion: 'Sistema de navegación Galileo (Europa)',
        estado: 'tracking'
      },
      {
        noradId: '28474',
        nombre: 'GPS BIIR-13',
        tipo: 'GPS',
        tle1: '1 28474U 04045A   21001.00000000 -.00000012  00000-0  00000+0 0  9993',
        tle2: '2 28474  55.1234  90.1234 0012345 123.4567 236.5432 2.00561234123456',
        descripcion: 'GPS Block IIR (USA)',
        estado: 'tracking'
      },
      {
        noradId: '43657',
        nombre: 'TIANHE',
        tipo: 'CSS',
        tle1: '1 43657U 21035A   21001.00000000  .00001567  00000-0  23456-4 0  9994',
        tle2: '2 43657  41.4678 234.5678 0012345  67.8901 292.1098 15.61234567123456',
        descripcion: 'Estación Espacial China',
        estado: 'tracking'
      }
    ];
  }

  // Obtener todos los satélites
  getAllSatellites() {
    return {
      total: this.satellites.length,
      satellites: this.satellites.map(sat => ({
        noradId: sat.noradId,
        nombre: sat.nombre,
        tipo: sat.tipo,
        descripcion: sat.descripcion,
        estado: sat.estado
      })),
      estado: this.estado,
      timestamp: new Date().toISOString()
    };
  }

  // Calcular posición de un satélite
  calcularPosicion(noradId, fecha = new Date()) {
    const sat = this.satellites.find(s => s.noradId === noradId);
    if (!sat) {
      return { success: false, error: 'Satélite no encontrado' };
    }

    try {
      // Parsear TLE
      const satrec = satellite.twoline2satrec(sat.tle1, sat.tle2);
      
      // Calcular posición
      const positionAndVelocity = satellite.propagate(satrec, fecha);
      
      if (positionAndVelocity.position === false) {
        return { success: false, error: 'Error al calcular posición' };
      }

      const positionEci = positionAndVelocity.position;
      const velocityEci = positionAndVelocity.velocity;

      // Calcular GMST para conversión a coordenadas geográficas
      const gmst = satellite.gstime(fecha);
      
      // Convertir a coordenadas geodésicas
      const positionGd = satellite.eciToGeodetic(positionEci, gmst);

      return {
        success: true,
        satelite: {
          noradId: sat.noradId,
          nombre: sat.nombre,
          tipo: sat.tipo
        },
        posicion: {
          latitud: satellite.degreesLat(positionGd.latitude),
          longitud: satellite.degreesLong(positionGd.longitude),
          altitud: positionGd.height, // km
          eciX: positionEci.x,
          eciY: positionEci.y,
          eciZ: positionEci.z
        },
        velocidad: {
          x: velocityEci.x, // km/s
          y: velocityEci.y,
          z: velocityEci.z,
          magnitud: Math.sqrt(velocityEci.x**2 + velocityEci.y**2 + velocityEci.z**2)
        },
        timestamp: fecha.toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Calcular posiciones de todos los satélites
  async calcularTodasPosiciones() {
    const fecha = new Date();
    const resultados = [];

    for (const sat of this.satellites) {
      const posicion = this.calcularPosicion(sat.noradId, fecha);
      resultados.push(posicion);
    }

    return {
      success: true,
      total: resultados.length,
      exitosos: resultados.filter(r => r.success).length,
      timestamp: fecha.toISOString(),
      posiciones: resultados
    };
  }

  // Predecir trayectoria futura
  predecirTrayectoria(noradId, minutosFuturos = 60, intervalo = 5) {
    const sat = this.satellites.find(s => s.noradId === noradId);
    if (!sat) {
      return { success: false, error: 'Satélite no encontrado' };
    }

    const trayectoria = [];
    const ahora = new Date();

    for (let i = 0; i <= minutosFuturos; i += intervalo) {
      const fechaFutura = new Date(ahora.getTime() + i * 60000);
      const posicion = this.calcularPosicion(noradId, fechaFutura);
      
      if (posicion.success) {
        trayectoria.push({
          tiempo: i,
          fecha: fechaFutura.toISOString(),
          latitud: posicion.posicion.latitud,
          longitud: posicion.posicion.longitud,
          altitud: posicion.posicion.altitud
        });
      }
    }

    return {
      success: true,
      satelite: {
        noradId: sat.noradId,
        nombre: sat.nombre
      },
      prediccion: {
        minutosFuturos: minutosFuturos,
        intervaloMinutos: intervalo,
        puntos: trayectoria.length
      },
      trayectoria: trayectoria
    };
  }

  // Calcular próximo pase sobre una ubicación
  calcularProximoPase(noradId, latitud, longitud, elevacionMinima = 10) {
    const sat = this.satellites.find(s => s.noradId === noradId);
    if (!sat) {
      return { success: false, error: 'Satélite no encontrado' };
    }

    // Simular búsqueda de próximo pase
    // En producción real, necesitaría algoritmo más complejo
    const proximoPase = {
      inicioVisibilidad: new Date(Date.now() + 3600000), // +1 hora
      maximaElevacion: new Date(Date.now() + 3900000), // +1h 5min
      finVisibilidad: new Date(Date.now() + 4200000), // +1h 10min
      elevacionMaxima: 45.5, // grados
      azimutInicio: 180,
      azimutFin: 90,
      duracionSegundos: 600
    };

    return {
      success: true,
      satelite: {
        noradId: sat.noradId,
        nombre: sat.nombre
      },
      observador: {
        latitud: latitud,
        longitud: longitud
      },
      proximoPase: proximoPase
    };
  }

  // Agregar nuevo satélite
  agregarSatelite(datos) {
    const { noradId, nombre, tipo, tle1, tle2, descripcion } = datos;

    // Validar TLE
    try {
      satellite.twoline2satrec(tle1, tle2);
    } catch (error) {
      return {
        success: false,
        error: 'TLE inválido: ' + error.message
      };
    }

    const nuevoSat = {
      noradId,
      nombre,
      tipo,
      tle1,
      tle2,
      descripcion: descripcion || '',
      estado: 'tracking'
    };

    this.satellites.push(nuevoSat);

    return {
      success: true,
      satelite: nuevoSat,
      total: this.satellites.length
    };
  }

  // Actualizar TLE de un satélite
  actualizarTLE(noradId, tle1, tle2) {
    const sat = this.satellites.find(s => s.noradId === noradId);
    if (!sat) {
      return { success: false, error: 'Satélite no encontrado' };
    }

    // Validar nuevo TLE
    try {
      satellite.twoline2satrec(tle1, tle2);
    } catch (error) {
      return {
        success: false,
        error: 'TLE inválido: ' + error.message
      };
    }

    sat.tle1 = tle1;
    sat.tle2 = tle2;

    return {
      success: true,
      satelite: sat,
      mensaje: 'TLE actualizado exitosamente'
    };
  }

  // Generar reporte de estado
  generarReporteEstado() {
    const tiposSat = [...new Set(this.satellites.map(s => s.tipo))];
    const distribucion = {};

    tiposSat.forEach(tipo => {
      distribucion[tipo] = this.satellites.filter(s => s.tipo === tipo).length;
    });

    return {
      estadoGeneral: this.estado,
      totalSatelites: this.satellites.length,
      tiposTracking: tiposSat.length,
      distribucion: distribucion,
      satelites: this.satellites.map(s => ({
        nombre: s.nombre,
        tipo: s.tipo,
        noradId: s.noradId,
        estado: s.estado
      })),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new SatelliteService();
