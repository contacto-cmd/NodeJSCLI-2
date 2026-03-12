// Archivo: ai-generator.js (Sistema de Generación de Apps con IA Dual)
// Referenced from blueprint:javascript_openai_ai_integrations and blueprint:javascript_gemini
// -----------------------------------------------------

const OpenAI = require('openai');
const { GoogleGenAI } = require('@google/genai');

// Configuración de OpenAI (via Replit AI Integrations)
// the newest OpenAI model is "gpt-5" which was released August 7, 2025.
const openai = new OpenAI({
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

// Configuración de Gemini (con API key del usuario)
// Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
const geminiAI = new GoogleGenAI({ apiKey: (process.env.GEMINI_API_KEY || "").trim() });

// =================================================================
// TEMPLATES POR INDUSTRIA
// =================================================================
const INDUSTRY_TEMPLATES = {
    medicina: {
        name: "Sistema Médico",
        description: "App para gestión de pacientes, historias clínicas, y análisis de imágenes médicas",
        prompt_base: "Genera código completo para una aplicación médica con:",
        features: ["Registro de pacientes", "Historias clínicas digitales", "Sistema de citas", "Análisis de radiografías con IA"]
    },
    arquitectura: {
        name: "Estudio de Arquitectura",
        description: "App para visualización 3D, gestión de proyectos y análisis de planos",
        prompt_base: "Genera código completo para una aplicación de arquitectura con:",
        features: ["Visualización 3D de proyectos", "Gestión de planos", "Cálculo de materiales", "Timeline de construcción"]
    },
    legal: {
        name: "Sistema Legal",
        description: "App para gestión de casos, documentos legales y análisis jurídico",
        prompt_base: "Genera código completo para una aplicación legal con:",
        features: ["Gestión de casos", "Biblioteca de documentos", "Agenda de audiencias", "Análisis de contratos con IA"]
    },
    ingenieria: {
        name: "Ingeniería Industrial",
        description: "App para control de procesos, cálculos técnicos y simulaciones",
        prompt_base: "Genera código completo para una aplicación de ingeniería con:",
        features: ["Control de procesos", "Cálculos de resistencia", "Simulaciones", "Gestión de inventario técnico"]
    },
    negocios: {
        name: "Gestión Empresarial",
        description: "App para CRM, ventas, finanzas y análisis de negocio",
        prompt_base: "Genera código completo para una aplicación empresarial con:",
        features: ["CRM", "Dashboard de ventas", "Análisis financiero", "Gestión de proyectos"]
    }
};

// =================================================================
// GENERACIÓN CON GPT-5 (Código y Arquitectura)
// =================================================================
async function generateWithGPT5(userPrompt, industry = null) {
    try {
        let systemPrompt = `Eres un experto desarrollador full-stack. Genera código completo, funcional y profesional.
Incluye HTML, CSS, JavaScript, y si es necesario, backend con Node.js/Express.
El código debe ser listo para usar, sin placeholders ni comentarios TODO.`;

        let finalPrompt = userPrompt;

        // Si hay una industria, usar template
        if (industry && INDUSTRY_TEMPLATES[industry]) {
            const template = INDUSTRY_TEMPLATES[industry];
            systemPrompt += `\n\nEspecialización: ${template.name}`;
            finalPrompt = `${template.prompt_base}\n${template.features.join('\n- ')}\n\n${userPrompt}`;
        }

        const response = await openai.chat.completions.create({
            model: "gpt-5",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: finalPrompt }
            ],
            max_completion_tokens: 8192
        });

        return {
            success: true,
            code: response.choices[0]?.message?.content || "",
            model: "gpt-5",
            industry: industry || "general"
        };
    } catch (error) {
        console.error("Error GPT-5:", error.message);
        return {
            success: false,
            error: error.message,
            model: "gpt-5"
        };
    }
}

// =================================================================
// GENERACIÓN CON GEMINI (Análisis Multimodal)
// =================================================================
async function generateWithGemini(userPrompt, industry = null) {
    try {
        let systemPrompt = `Eres un experto desarrollador full-stack. Genera código completo, funcional y profesional.
Incluye HTML, CSS, JavaScript, y si es necesario, backend con Node.js/Express.`;

        let finalPrompt = userPrompt;

        if (industry && INDUSTRY_TEMPLATES[industry]) {
            const template = INDUSTRY_TEMPLATES[industry];
            systemPrompt += `\n\nEspecialización: ${template.name}`;
            finalPrompt = `${template.prompt_base}\n${template.features.join('\n- ')}\n\n${userPrompt}`;
        }

        const result = await geminiAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${finalPrompt}` }] }]
        });

        const text = result.text;

        return {
            success: true,
            code: text || "",
            model: "gemini-2.5-flash",
            industry: industry || "general"
        };
    } catch (error) {
        console.error("Error Gemini:", error.message);
        return {
            success: false,
            error: error.message,
            model: "gemini-2.5-flash"
        };
    }
}

// =================================================================
// GENERACIÓN DUAL (GPT-5 + Gemini juntos para máxima potencia)
// =================================================================
async function generateDual(userPrompt, industry = null) {
    try {
        console.log(`🔥 Generación DUAL iniciada (GPT-5 + Gemini) - Industria: ${industry || 'general'}`);
        
        // Ejecutar ambas IAs en paralelo
        const [gptResult, geminiResult] = await Promise.all([
            generateWithGPT5(userPrompt, industry),
            generateWithGemini(userPrompt, industry)
        ]);

        // Determinar cuál fue mejor (o combinar)
        let primaryResult = gptResult.success ? gptResult : geminiResult;
        let secondaryResult = gptResult.success ? geminiResult : gptResult;

        // Si ambos fallaron, retornar error
        if (!gptResult.success && !geminiResult.success) {
            return {
                success: false,
                error: `Ambos modelos fallaron. GPT-5: ${gptResult.error}, Gemini: ${geminiResult.error}`,
                mode: "dual",
                gpt_error: gptResult.error,
                gemini_error: geminiResult.error
            };
        }

        return {
            success: true,
            mode: "dual",
            primary: primaryResult,
            secondary: secondaryResult,
            industry: industry || "general",
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error("Error en generación dual:", error.message);
        return {
            success: false,
            error: error.message,
            mode: "dual"
        };
    }
}

// =================================================================
// CHAT DIRECTO CON GEMINI — Sin system prompt de código
// Fallback a GPT-5 si Gemini falla
// =================================================================
async function chatWithGemini(systemContext, userMessage) {
    // Try Gemini first
    try {
        const result = await geminiAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: `${systemContext}\n\nUSUARIO: ${userMessage}\n\nRESPUESTA:` }] }]
        });
        const text = result.text || '';
        if (text.trim().length > 0) {
            return { success: true, text: text.trim(), model: 'gemini-2.5-flash' };
        }
    } catch (geminiErr) {
        console.error('chatWithGemini Gemini error:', geminiErr.message?.substring(0,80));
    }
    // Fallback: GPT-5
    try {
        const gptResp = await openai.chat.completions.create({
            model: 'gpt-5',
            messages: [
                { role: 'system', content: systemContext },
                { role: 'user', content: userMessage }
            ],
            max_tokens: 400
        });
        const gptText = gptResp.choices?.[0]?.message?.content || '';
        if (gptText.trim().length > 0) {
            return { success: true, text: gptText.trim(), model: 'gpt-5' };
        }
    } catch (gptErr) {
        console.error('chatWithGemini GPT fallback error:', gptErr.message?.substring(0,80));
    }
    return { success: false, error: 'Both AI models unavailable', text: '' };
}

// =================================================================
// EXPORTAR FUNCIONES
// =================================================================
module.exports = {
    generateWithGPT5,
    generateWithGemini,
    generateDual,
    chatWithGemini,
    INDUSTRY_TEMPLATES
};
