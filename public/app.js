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

    const arsenalNodos = protocolData?.arsenal_nodos || [];
    
    if (arsenalNodos.length === 0) {
        const defaultLocations = [
            { name: 'NODO ALPHA', lon: -74.0060, lat: 40.7128, color: Cesium.Color.CYAN },
            { name: 'NODO BETA', lon: -0.1276, lat: 51.5074, color: Cesium.Color.GREEN },
            { name: 'NODO GAMMA', lon: 139.6917, lat: 35.6895, color: Cesium.Color.YELLOW },
            { name: 'NODO DELTA', lon: -118.2437, lat: 34.0522, color: Cesium.Color.MAGENTA }
        ];
        
        defaultLocations.forEach(loc => {
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
        log(`${defaultLocations.length} nodos por defecto marcados`, 'info');
        return;
    }

    const colors = [
        Cesium.Color.CYAN, Cesium.Color.LIME, Cesium.Color.YELLOW, 
        Cesium.Color.MAGENTA, Cesium.Color.ORANGE, Cesium.Color.HOTPINK,
        Cesium.Color.AQUA, Cesium.Color.SPRINGGREEN, Cesium.Color.GOLD
    ];

    const totalNodos = arsenalNodos.length;
    const nodosPerRow = Math.ceil(Math.sqrt(totalNodos));
    
    arsenalNodos.forEach((nodo, index) => {
        const row = Math.floor(index / nodosPerRow);
        const col = index % nodosPerRow;
        const lon = -170 + (col * (340 / nodosPerRow));
        const lat = -50 + (row * (100 / Math.ceil(totalNodos / nodosPerRow)));
        const color = colors[index % colors.length];
        const tokenName = nodo.token || `NODO-${index + 1}`;

        viewer.entities.add({
            name: tokenName,
            position: Cesium.Cartesian3.fromDegrees(lon, lat),
            point: {
                pixelSize: 12,
                color: color,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2
            },
            label: {
                text: tokenName,
                font: '12pt monospace',
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                outlineWidth: 2,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -9),
                fillColor: color,
                scale: 0.8
            }
        });
    });

    log(`✨ ${arsenalNodos.length} nodos del arsenal desplegados en el globo 3D`, 'success');
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

            if (protocolData.arsenal_nodos && protocolData.arsenal_nodos.length > 0) {
                displayArsenalNodes(protocolData.arsenal_nodos);
            }

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

        } else if (protocolData.status === 'MODO_DEMO') {
            log('⚠️  MODO DEMO ACTIVO', 'warning');
            log('Configura RSA_4096_PRIVADA para activar el protocolo completo', 'info');
            updateStatus('auth-status', false);
            
            document.getElementById('protocol-status').textContent = protocolData.status;
            document.getElementById('throne-seal').textContent = protocolData.master_seal;
            document.getElementById('diplomat-seal').textContent = protocolData.diplomat_seal;
            document.getElementById('nodos-count').textContent = protocolData.nodos_cargados;
            
            if (protocolData.pasaporte_maestro) {
                document.getElementById('maestro-name').textContent = protocolData.pasaporte_maestro.nombre_maestro || 'N/A';
                document.getElementById('maestro-orden').textContent = protocolData.pasaporte_maestro.orden || 'N/A';
            }

            if (protocolData.arsenal_nodos && protocolData.arsenal_nodos.length > 0) {
                displayArsenalNodes(protocolData.arsenal_nodos);
            }

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

function displayArsenalNodes(nodes) {
    const container = document.getElementById('nodes-list');
    if (!container) return;

    container.innerHTML = '';
    
    nodes.forEach((node, index) => {
        const nodeEl = document.createElement('div');
        nodeEl.className = 'node-item';
        nodeEl.innerHTML = `
            <div class="node-token">${node.token || `NODE-${index + 1}`}</div>
            <div class="node-url">${node.url || 'N/A'}</div>
        `;
        container.appendChild(nodeEl);
    });

    log(`✨ ${nodes.length} nodos del arsenal listados en el panel`, 'success');
}

// =================================================================
// FUNCIONES DE GENERACIÓN CON IA
// =================================================================

let generatedCode = '';

async function generateApp(mode = 'dual') {
    const prompt = document.getElementById('ai-prompt').value.trim();
    const industry = document.getElementById('ai-industry').value;

    if (!prompt) {
        log('⚠️ Debes escribir una descripción de la app', 'warning');
        return;
    }

    log(`🤖 Generando app con modo: ${mode.toUpperCase()}...`, 'info');
    log(`📋 Industria: ${industry || 'General'}`, 'info');

    try {
        const response = await fetch('/api/generate-app', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, industry, mode })
        });

        const data = await response.json();

        if (data.success) {
            if (mode === 'dual' && data.primary) {
                generatedCode = data.primary.code;
                document.getElementById('ai-code-display').textContent = generatedCode;
                document.getElementById('ai-model-used').textContent = 
                    `✅ Generado con: ${data.primary.model} (Principal) + ${data.secondary?.model || 'N/A'} (Secundario)`;
                document.getElementById('ai-results').style.display = 'block';
                log('✅ App generada exitosamente con modo DUAL', 'success');
                log(`💻 ${generatedCode.length} caracteres de código generados`, 'info');
            } else {
                generatedCode = data.code;
                document.getElementById('ai-code-display').textContent = generatedCode;
                document.getElementById('ai-model-used').textContent = `✅ Generado con: ${data.model}`;
                document.getElementById('ai-results').style.display = 'block';
                log(`✅ App generada exitosamente con ${data.model}`, 'success');
                log(`💻 ${generatedCode.length} caracteres de código generados`, 'info');
            }
        } else {
            log(`❌ Error: ${data.error}`, 'error');
        }
    } catch (error) {
        log(`❌ Error generando app: ${error.message}`, 'error');
    }
}

async function showTemplates() {
    try {
        log('📋 Cargando templates...', 'info');
        const response = await fetch('/api/templates');
        const data = await response.json();

        if (data.success) {
            log('=== TEMPLATES DISPONIBLES ===', 'info');
            Object.keys(data.templates).forEach(key => {
                const t = data.templates[key];
                log(`\n🏥 ${t.name.toUpperCase()}`, 'success');
                log(`   ${t.description}`, 'info');
                log(`   Features: ${t.features.join(', ')}`, 'warning');
            });
            log('================================', 'info');
        }
    } catch (error) {
        log(`Error cargando templates: ${error.message}`, 'error');
    }
}

function downloadCode() {
    if (!generatedCode) {
        log('⚠️ No hay código generado para descargar', 'warning');
        return;
    }

    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-app.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    log('💾 Código descargado como generated-app.html', 'success');
}

function copyCode() {
    if (!generatedCode) {
        log('⚠️ No hay código generado para copiar', 'warning');
        return;
    }

    navigator.clipboard.writeText(generatedCode).then(() => {
        log('📋 Código copiado al portapapeles', 'success');
    }).catch(err => {
        log(`Error copiando código: ${err.message}`, 'error');
    });
}

// =================================================================
// FUNCIONES DE THRONE VAULT
// =================================================================

async function loadVaultStats() {
    try {
        log('📊 Cargando estadísticas del Vault...', 'info');
        const response = await fetch('/api/vault/stats');
        const data = await response.json();

        if (data.success) {
            const stats = data.stats;
            document.getElementById('vault-total').textContent = stats.totalSecrets;
            document.getElementById('vault-passwords').textContent = stats.passwords;
            
            log(`✅ Vault Stats:`, 'success');
            log(`  Total: ${stats.totalSecrets}`, 'info');
            log(`  Passwords: ${stats.passwords}`, 'info');
            log(`  API Keys: ${stats.apiKeys}`, 'info');
            log(`  Certificados: ${stats.certificates}`, 'info');
            log(`  Documentos: ${stats.documents}`, 'info');
            log(`  🔒 Vault: ${stats.vaultLocked ? 'BLOQUEADO' : 'DESBLOQUEADO'}`, stats.vaultLocked ? 'warning' : 'success');
        }
    } catch (error) {
        log(`❌ Error cargando stats: ${error.message}`, 'error');
    }
}

async function addVaultSecret() {
    const category = document.getElementById('vault-category').value;
    const name = document.getElementById('vault-name').value.trim();
    const value = document.getElementById('vault-value').value.trim();

    if (!name || !value) {
        log('⚠️ Debes escribir nombre y valor', 'warning');
        return;
    }

    try {
        log(`🔐 Guardando secreto en categoría: ${category}...`, 'info');
        const response = await fetch(`/api/vault/${category}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, value })
        });

        const data = await response.json();

        if (data.success) {
            log(`✅ Secreto guardado: ${name}`, 'success');
            log(`🔒 Encriptado con RSA-4096`, 'info');
            
            document.getElementById('vault-name').value = '';
            document.getElementById('vault-value').value = '';
            
            loadVaultStats();
            loadVaultSecrets();
        } else {
            log(`❌ Error: ${data.error}`, 'error');
        }
    } catch (error) {
        log(`❌ Error guardando secreto: ${error.message}`, 'error');
    }
}

async function loadVaultSecrets() {
    const category = document.getElementById('vault-category').value;
    const listEl = document.getElementById('vault-list');

    try {
        log(`📋 Listando secretos de ${category}...`, 'info');
        const response = await fetch(`/api/vault/${category}`);
        const data = await response.json();

        if (data.success) {
            listEl.innerHTML = '';
            
            if (data.secrets.length === 0) {
                listEl.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">No hay secretos en esta categoría</div>';
                log(`📭 No hay secretos en ${category}`, 'warning');
                return;
            }

            data.secrets.forEach(secret => {
                const item = document.createElement('div');
                item.style.cssText = 'background: rgba(0,255,136,0.1); border-left: 3px solid #00ff88; padding: 8px; margin: 5px 0; border-radius: 3px; cursor: pointer;';
                item.innerHTML = `
                    <div style="font-weight: bold; color: #00ffff; margin-bottom: 3px;">${secret.name}</div>
                    <div style="color: #888; font-size: 9px;">ID: ${secret.id.substring(0, 8)}... | Creado: ${new Date(secret.created).toLocaleString()}</div>
                `;
                
                item.onclick = () => viewVaultSecret(category, secret.id, secret.name);
                listEl.appendChild(item);
            });

            log(`✅ ${data.secrets.length} secretos listados`, 'success');
        }
    } catch (error) {
        log(`❌ Error listando secretos: ${error.message}`, 'error');
    }
}

async function viewVaultSecret(category, id, name) {
    try {
        log(`🔓 Desencriptando: ${name}...`, 'info');
        const response = await fetch(`/api/vault/${category}/${id}`);
        const data = await response.json();

        if (data.success) {
            const secret = data.secret;
            log(`\n=== SECRETO DESENCRIPTADO ===`, 'success');
            log(`Nombre: ${secret.name}`, 'info');
            log(`Valor: ${secret.value}`, 'warning');
            log(`Creado: ${new Date(secret.metadata.created).toLocaleString()}`, 'info');
            log(`Firma: ${secret.signature.substring(0, 20)}...`, 'info');
            log(`=============================\n`, 'success');
        }
    } catch (error) {
        log(`❌ Error desencriptando: ${error.message}`, 'error');
    }
}

// Cargar stats al inicio
window.addEventListener('load', () => {
    setTimeout(() => {
        loadVaultStats();
    }, 1000);
});

window.addEventListener('error', (event) => {
    log(`Error global: ${event.message}`, 'error');
});