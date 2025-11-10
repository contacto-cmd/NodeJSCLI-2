let viewer;
let protocolData = null;
let cesiumInitialized = false;

function log(message, type = 'info') {
    const console = document.getElementById('console');
    const line = document.createElement('div');
    line.className = `console-line console-${type}`;
    const timestamp = new Date().toLocaleTimeString();
    line.textContent = `[${timestamp}] ${message}`;
    console.appendChild(line);
    console.scrollTop = console.scrollHeight;
}

function updateStatus(elementId, active) {
    const element = document.getElementById(elementId);
    if (active) {
        element.classList.add('active');
    } else {
        element.classList.remove('active');
    }
}

function clearConsole() {
    document.getElementById('console').innerHTML = '';
    log('Consola limpiada', 'info');
}

async function initCesium() {
    try {
        log('Inicializando Cesium 3D...', 'info');
        
        const cesiumToken = protocolData?.cesium_token || '';
        
        if (cesiumToken && cesiumToken !== 'tu_cesium_token_de_prueba') {
            Cesium.Ion.defaultAccessToken = cesiumToken;
            log('Token de Cesium Ion configurado', 'success');
        } else {
            log('Usando Cesium sin token Ion (modo limitado)', 'warning');
        }

        viewer = new Cesium.Viewer('cesiumContainer', {
            terrainProvider: Cesium.createWorldTerrain(),
            baseLayerPicker: false,
            geocoder: false,
            homeButton: true,
            sceneModePicker: true,
            navigationHelpButton: false,
            animation: false,
            timeline: false,
            fullscreenButton: true,
            vrButton: false,
            imageryProvider: new Cesium.IonImageryProvider({ assetId: 2 })
        });

        viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(-74.0060, 40.7128, 15000000.0)
        });

        cesiumInitialized = true;
        updateStatus('cesium-status', true);
        log('Cesium 3D inicializado correctamente', 'success');

        addGlobalMarkers();

    } catch (error) {
        log(`Error inicializando Cesium: ${error.message}`, 'error');
        updateStatus('cesium-status', false);
    }
}

function addGlobalMarkers() {
    if (!viewer) return;

    const locations = [
        { name: 'NODO ALPHA', lon: -74.0060, lat: 40.7128, color: Cesium.Color.CYAN },
        { name: 'NODO BETA', lon: -0.1276, lat: 51.5074, color: Cesium.Color.GREEN },
        { name: 'NODO GAMMA', lon: 139.6917, lat: 35.6895, color: Cesium.Color.YELLOW },
        { name: 'NODO DELTA', lon: -118.2437, lat: 34.0522, color: Cesium.Color.MAGENTA }
    ];

    locations.forEach(loc => {
        viewer.entities.add({
            name: loc.name,
            position: Cesium.Cartesian3.fromDegrees(loc.lon, loc.lat),
            point: {
                pixelSize: 15,
                color: loc.color,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2
            },
            label: {
                text: loc.name,
                font: '14pt monospace',
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                outlineWidth: 2,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -9),
                fillColor: loc.color
            }
        });
    });

    log(`${locations.length} nodos marcados en el globo 3D`, 'success');
}

async function initProtocol() {
    try {
        log('Conectando al servidor core...', 'info');
        updateStatus('server-status', false);
        updateStatus('auth-status', false);

        const response = await fetch('/api/protocol-init');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        protocolData = await response.json();
        
        log('Respuesta del servidor recibida', 'success');
        updateStatus('server-status', true);

        if (protocolData.status === 'PROTOCOLO_APROBADO') {
            log('✓ PROTOCOLO APROBADO', 'success');
            updateStatus('auth-status', true);
            
            document.getElementById('protocol-status').textContent = protocolData.status;
            document.getElementById('throne-seal').textContent = protocolData.master_seal;
            document.getElementById('diplomat-seal').textContent = protocolData.diplomat_seal;
            document.getElementById('nodos-count').textContent = protocolData.nodos_cargados;
            
            if (protocolData.pasaporte_maestro) {
                document.getElementById('maestro-name').textContent = protocolData.pasaporte_maestro.nombre_maestro || 'N/A';
                document.getElementById('maestro-orden').textContent = protocolData.pasaporte_maestro.orden || 'N/A';
            }

            log(`Token Soberano generado (${protocolData.token_soberano.substring(0, 50)}...)`, 'success');
            log(`Nodos del sistema cargados: ${protocolData.nodos_cargados}`, 'info');

            if (protocolData.adquisicion_status) {
                const ads = protocolData.adquisicion_status;
                log(`Estado de adquisición: ${ads.estado}`, ads.estado.includes('INYECTADA') ? 'success' : 'warning');
                if (ads.activos) {
                    ads.activos.forEach(activo => {
                        log(`  - Activo: ${activo}`, 'info');
                    });
                }
            }

            document.getElementById('btn-adquisicion').disabled = false;

            if (!cesiumInitialized) {
                await initCesium();
            }

        } else {
            log('✗ PROTOCOLO FALLIDO', 'error');
            updateStatus('auth-status', false);
        }

    } catch (error) {
        log(`ERROR: ${error.message}`, 'error');
        updateStatus('server-status', false);
        updateStatus('auth-status', false);
    }
}

function executeAdquisicion() {
    if (!protocolData || !protocolData.adquisicion_status) {
        log('No hay datos de adquisición disponibles', 'error');
        return;
    }

    log('Ejecutando comando de adquisición...', 'info');
    const ads = protocolData.adquisicion_status;
    
    log(`Comando: ${ads.comando}`, 'warning');
    log(`Estado: ${ads.estado}`, ads.estado.includes('INYECTADA') ? 'success' : 'error');
    
    if (ads.activos) {
        log('Activos objetivo:', 'info');
        ads.activos.forEach(activo => {
            log(`  ▸ ${activo}`, 'success');
        });
    }

    if (viewer && ads.estado.includes('INYECTADA')) {
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(-74.0060, 40.7128, 5000000.0),
            duration: 3.0
        });
        log('Volando a zona objetivo NODO ALPHA...', 'info');
    }
}

async function refreshToken() {
    log('Refrescando token...', 'info');
    await initProtocol();
}

window.addEventListener('load', () => {
    document.getElementById('loading').style.display = 'none';
    log('Sistema cargado. Esperando comandos...', 'success');
    log('Presiona "INICIAR PROTOCOLO" para conectar al servidor', 'info');
});

window.addEventListener('error', (event) => {
    log(`Error global: ${event.message}`, 'error');
});