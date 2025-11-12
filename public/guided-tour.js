/**
 * THRONE PROTOCOL V3.0 - GUIDED TOUR PRESIDENCIAL
 * Sistema de tour guiado con spotlight effects y highlights épicos
 * Autor: Roberto Rivera Gamas (Royal - Arquitecto)
 */

class ThroneTour {
    constructor() {
        this.currentStep = 0;
        this.isActive = false;
        this.tourSteps = [
            {
                title: "🏆 BIENVENIDO AL THRONE PROTOCOL V3.0",
                description: "Sistema Presidencial de Arquitectura Cuántica con Física Real y AI Dual. Este tour te mostrará todas las capacidades avanzadas.",
                target: null,
                position: "center"
            },
            {
                title: "📊 32 DISEÑOS CON FÍSICA REAL",
                description: "Cada diseño incluye cálculos reales: densidad de materiales × volumen = peso total, análisis de voladizos, momentos de flexión, centro de gravedad. 7 materiales físicos verificados.",
                target: ".stat-card:nth-child(1)",
                position: "bottom"
            },
            {
                title: "💰 VALORACIÓN $229.8B USD",
                description: "Portafolio completo valorado con cálculos de mercado reales. Desde torres de $2B hasta complejos de $30B. Precios basados en ubicación GPS y especificaciones técnicas.",
                target: ".stat-card:nth-child(2)",
                position: "bottom"
            },
            {
                title: "🔐 FIRMA DIGITAL RSA-4096",
                description: "Certificados presidenciales con firma criptográfica RSA-4096. Cada compra genera certificado único + plano técnico con todas las especificaciones físicas y GPS.",
                target: ".stat-card:nth-child(3)",
                position: "bottom"
            },
            {
                title: "🧪 7 MATERIALES FÍSICOS",
                description: "Hormigón armado (2,400 kg/m³), Acero estructural (7,850 kg/m³), Vidrio templado (2,500 kg/m³), Titanio (4,500 kg/m³), Aluminio (2,700 kg/m³), Fibra de carbono (1,600 kg/m³), Composite (1,800 kg/m³).",
                target: ".stat-card:nth-child(4)",
                position: "bottom"
            },
            {
                title: "🏗️ ARQUITECTURA CUÁNTICA",
                description: "Accede al panel completo con todos los 32 diseños. Cada uno incluye: imagen 3D, física completa, GPS, análisis estructural, materiales, y precio calculado.",
                target: "a[href='/arquitectura-panel.html']",
                position: "top"
            },
            {
                title: "🌍 GALERÍA 3D CON GLOBO CESIUM",
                description: "Visualiza los 40 nodos arquitectónicos en el globo terráqueo 3D + 8 satélites en órbita real. Navegación interactiva con coordenadas GPS precisas.",
                target: "a[href='/galeria-arquitectura.html']",
                position: "top"
            },
            {
                title: "📜 CERTIFICADOS PRESIDENCIALES",
                description: "Sistema de compra que genera: (1) Certificado de propiedad firmado RSA-4096, (2) Plano técnico PDF con física completa, (3) Envío automático por email. Nivel gubernamental.",
                target: "a[href='/certificados-premium.html']",
                position: "top"
            },
            {
                title: "📊 DOCUMENTACIÓN INVERSIONISTAS",
                description: "Documentación profesional para presentar a inversionistas: análisis de mercado, especificaciones técnicas completas, valoraciones, proyecciones financieras.",
                target: "a[href='/documentacion-profesional.html']",
                position: "top"
            },
            {
                title: "🔐 VAULT CIFRADO",
                description: "Bóveda de seguridad con cifrado AES-256-GCM + RSA-4096. Protege certificados, planos técnicos y documentos confidenciales. Contraseña maestra protegida.",
                target: "a[href='/vault.html']",
                position: "top"
            },
            {
                title: "🤖 AI DUAL: GPT-4 + GEMINI 2.5",
                description: "Arquitecto AI Interno monitoreando 24/7. Dual AI para análisis arquitectónico, generación de certificados, cálculos físicos y asistencia presidencial.",
                target: null,
                position: "center"
            },
            {
                title: "✅ TOUR COMPLETADO",
                description: "Ya conoces todas las capacidades del Throne Protocol V3.0. Puedes volver a ver este tour en cualquier momento haciendo clic en el botón 🎯 Tour.",
                target: null,
                position: "center"
            }
        ];
        
        this.init();
    }
    
    init() {
        // Crear elementos del tour
        this.createTourElements();
        
        // Verificar si es primera vez
        const hasSeenTour = localStorage.getItem('throne_tour_completed');
        
        if (!hasSeenTour) {
            // Iniciar tour automáticamente después de 2 segundos
            setTimeout(() => this.start(), 2000);
        }
    }
    
    createTourElements() {
        // Overlay oscuro
        this.overlay = document.createElement('div');
        this.overlay.id = 'tour-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.85);
            z-index: 9998;
            display: none;
            transition: opacity 0.3s ease;
        `;
        
        // Spotlight (círculo de luz)
        this.spotlight = document.createElement('div');
        this.spotlight.id = 'tour-spotlight';
        this.spotlight.style.cssText = `
            position: fixed;
            border: 3px solid #ffd700;
            border-radius: 15px;
            box-shadow: 
                0 0 0 9999px rgba(0, 0, 0, 0.85),
                0 0 40px #ffd700,
                inset 0 0 30px rgba(255, 215, 0, 0.3);
            z-index: 9999;
            display: none;
            pointer-events: none;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        `;
        
        // Modal de información
        this.modal = document.createElement('div');
        this.modal.id = 'tour-modal';
        this.modal.style.cssText = `
            position: fixed;
            background: linear-gradient(145deg, rgba(0, 0, 0, 0.98), rgba(26, 0, 51, 0.95));
            border: 3px solid #ffd700;
            border-radius: 20px;
            padding: 30px;
            max-width: 500px;
            z-index: 10000;
            display: none;
            box-shadow: 
                0 0 60px rgba(255, 215, 0, 0.8),
                inset 0 0 30px rgba(255, 215, 0, 0.2);
            backdrop-filter: blur(10px);
        `;
        
        // Flecha apuntando al elemento
        this.arrow = document.createElement('div');
        this.arrow.id = 'tour-arrow';
        this.arrow.innerHTML = '▼';
        this.arrow.style.cssText = `
            position: fixed;
            font-size: 3rem;
            color: #ffd700;
            z-index: 10001;
            display: none;
            animation: arrowBounce 1s ease-in-out infinite;
            filter: drop-shadow(0 0 20px #ffd700);
            text-shadow: 0 0 30px #ffd700;
        `;
        
        // Botón flotante para re-lanzar tour
        this.tourButton = document.createElement('button');
        this.tourButton.innerHTML = '🎯';
        this.tourButton.title = 'Iniciar Tour Guiado';
        this.tourButton.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(145deg, #ffd700, #ff8c00);
            border: 3px solid #ffd700;
            font-size: 2rem;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 0 30px rgba(255, 215, 0, 0.8);
            transition: all 0.3s ease;
        `;
        
        this.tourButton.onmouseover = () => {
            this.tourButton.style.transform = 'scale(1.1)';
            this.tourButton.style.boxShadow = '0 0 50px rgba(255, 215, 0, 1)';
        };
        
        this.tourButton.onmouseout = () => {
            this.tourButton.style.transform = 'scale(1)';
            this.tourButton.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.8)';
        };
        
        this.tourButton.onclick = () => this.start();
        
        // Añadir animación de flecha
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes arrowBounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(15px); }
            }
        `;
        document.head.appendChild(style);
        
        // Añadir al DOM
        document.body.appendChild(this.overlay);
        document.body.appendChild(this.spotlight);
        document.body.appendChild(this.modal);
        document.body.appendChild(this.arrow);
        document.body.appendChild(this.tourButton);
    }
    
    start() {
        this.isActive = true;
        this.currentStep = 0;
        this.overlay.style.display = 'block';
        setTimeout(() => this.overlay.style.opacity = '1', 10);
        this.showStep();
    }
    
    showStep() {
        const step = this.tourSteps[this.currentStep];
        
        // Limpiar elementos anteriores
        this.spotlight.style.display = 'none';
        this.arrow.style.display = 'none';
        
        // Mostrar modal
        this.modal.innerHTML = `
            <div style="text-align: center;">
                <h2 style="color: #ffd700; font-size: 2rem; margin-bottom: 15px; 
                    text-shadow: 0 0 20px #ffd700;">
                    ${step.title}
                </h2>
                <p style="color: #ffffff; font-size: 1.1rem; line-height: 1.6; margin-bottom: 25px;
                    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);">
                    ${step.description}
                </p>
                <div style="display: flex; gap: 15px; justify-content: center; align-items: center;">
                    ${this.currentStep > 0 ? `
                        <button onclick="throneTour.prevStep()" style="
                            background: linear-gradient(145deg, #666, #888);
                            border: 2px solid #888;
                            border-radius: 10px;
                            padding: 12px 25px;
                            color: #fff;
                            font-size: 1.1rem;
                            cursor: pointer;
                            box-shadow: 0 0 20px rgba(136, 136, 136, 0.5);
                        ">◀ Anterior</button>
                    ` : ''}
                    
                    <span style="color: #00ff88; font-size: 1.2rem; font-weight: bold;">
                        ${this.currentStep + 1} / ${this.tourSteps.length}
                    </span>
                    
                    ${this.currentStep < this.tourSteps.length - 1 ? `
                        <button onclick="throneTour.nextStep()" style="
                            background: linear-gradient(145deg, #ffd700, #ff8c00);
                            border: 2px solid #ffd700;
                            border-radius: 10px;
                            padding: 12px 25px;
                            color: #000;
                            font-size: 1.1rem;
                            font-weight: bold;
                            cursor: pointer;
                            box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
                        ">Siguiente ▶</button>
                    ` : `
                        <button onclick="throneTour.finish()" style="
                            background: linear-gradient(145deg, #00ff88, #00cc66);
                            border: 2px solid #00ff88;
                            border-radius: 10px;
                            padding: 12px 25px;
                            color: #000;
                            font-size: 1.1rem;
                            font-weight: bold;
                            cursor: pointer;
                            box-shadow: 0 0 20px rgba(0, 255, 136, 0.8);
                        ">✓ Finalizar</button>
                    `}
                    
                    <button onclick="throneTour.skip()" style="
                        background: transparent;
                        border: 2px solid #ff4444;
                        border-radius: 10px;
                        padding: 12px 20px;
                        color: #ff4444;
                        font-size: 1rem;
                        cursor: pointer;
                    ">✕ Saltar</button>
                </div>
            </div>
        `;
        
        this.modal.style.display = 'block';
        
        // Posicionar modal y spotlight según el target
        if (step.target) {
            const targetElement = document.querySelector(step.target);
            
            if (targetElement) {
                const rect = targetElement.getBoundingClientRect();
                
                // Mostrar spotlight
                this.spotlight.style.display = 'block';
                this.spotlight.style.left = (rect.left - 10) + 'px';
                this.spotlight.style.top = (rect.top - 10) + 'px';
                this.spotlight.style.width = (rect.width + 20) + 'px';
                this.spotlight.style.height = (rect.height + 20) + 'px';
                
                // Calcular centro del elemento target
                const targetCenterX = rect.left + (rect.width / 2);
                
                // Posicionar modal
                if (step.position === 'bottom') {
                    this.modal.style.left = '50%';
                    this.modal.style.transform = 'translateX(-50%)';
                    this.modal.style.top = Math.min(rect.bottom + 60, window.innerHeight - 300) + 'px';
                    this.modal.style.bottom = 'auto';
                    
                    // Flecha apuntando arriba, anclada al centro del elemento
                    this.arrow.innerHTML = '▲';
                    this.arrow.style.display = 'block';
                    this.arrow.style.left = targetCenterX + 'px';
                    this.arrow.style.transform = 'translateX(-50%)';
                    this.arrow.style.top = (rect.bottom + 20) + 'px';
                    
                } else if (step.position === 'top') {
                    this.modal.style.left = '50%';
                    this.modal.style.transform = 'translateX(-50%)';
                    this.modal.style.bottom = Math.max(window.innerHeight - rect.top + 60, 100) + 'px';
                    this.modal.style.top = 'auto';
                    
                    // Flecha apuntando abajo, anclada al centro del elemento
                    this.arrow.innerHTML = '▼';
                    this.arrow.style.display = 'block';
                    this.arrow.style.left = targetCenterX + 'px';
                    this.arrow.style.transform = 'translateX(-50%)';
                    this.arrow.style.top = (rect.top - 70) + 'px';
                }
                
                // Scroll suave al elemento
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            // Centro de la pantalla
            this.modal.style.left = '50%';
            this.modal.style.top = '50%';
            this.modal.style.transform = 'translate(-50%, -50%)';
            this.modal.style.bottom = 'auto';
        }
    }
    
    nextStep() {
        if (this.currentStep < this.tourSteps.length - 1) {
            this.currentStep++;
            this.showStep();
        }
    }
    
    prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showStep();
        }
    }
    
    skip() {
        this.finish();
    }
    
    finish() {
        // Marcar tour como completado
        localStorage.setItem('throne_tour_completed', 'true');
        
        // Ocultar elementos
        this.overlay.style.opacity = '0';
        setTimeout(() => {
            this.overlay.style.display = 'none';
            this.spotlight.style.display = 'none';
            this.modal.style.display = 'none';
            this.arrow.style.display = 'none';
        }, 300);
        
        this.isActive = false;
        this.currentStep = 0;
    }
}

// Inicializar tour global
let throneTour;

// Esperar a que el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        throneTour = new ThroneTour();
    });
} else {
    throneTour = new ThroneTour();
}
