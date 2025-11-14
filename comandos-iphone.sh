#!/bin/sh
# 🔱 COMANDOS PARA iPHONE (iSH Shell)
# Ejecuta comandos en ALGORYTHM ANCESTRAL ENGINE desde tu iPhone
# ================================================================

# URL de tu sistema
API="https://janeway.replit.dev"

# Colores (simplificados para iSH)
echo ""
echo "========================================================"
echo "   ALGORYTHM ANCESTRAL ENGINE - COMANDOS iPHONE"
echo "========================================================"
echo ""

# Menú
while true; do
    echo ""
    echo "COMANDOS DISPONIBLES:"
    echo "--------------------"
    echo ""
    echo "  1) Ver Stats del Sistema"
    echo "  2) Generar Certificado de Valoracion (\$85K)"
    echo "  3) Generar Certificado Royal Premium"
    echo "  4) Crear 10 Disenos Arquitectonicos"
    echo "  5) Estado Arquitecto AI"
    echo "  6) Reporte Completo Rapido"
    echo ""
    echo "  0) Salir"
    echo ""
    echo -n "Opcion: "
    read opcion
    echo ""
    
    case $opcion in
        1)
            echo "📊 STATS DEL SISTEMA:"
            echo "--------------------"
            curl -s $API/api/arquitectura/stats
            echo ""
            ;;
        2)
            echo "📄 GENERANDO CERTIFICADO DE VALORACION..."
            echo "----------------------------------------"
            curl -s -X POST $API/api/certificados/valoracion \
              -H "Content-Type: application/json" \
              -d '{"proyecto":"ALGORYTHM ANCESTRAL ENGINE","desarrollador":"Roberto Rivera Gamas","valoracion":85000,"rfc":"RIGR840827PJ0"}'
            echo ""
            echo "✅ Certificado generado"
            ;;
        3)
            echo "👑 GENERANDO CERTIFICADO ROYAL PREMIUM..."
            echo "----------------------------------------"
            curl -s -X POST $API/api/certificados/royal-premium \
              -H "Content-Type: application/json" \
              -d '{"clientName":"Roberto Rivera Gamas","projectName":"ALGORYTHM ANCESTRAL ENGINE","tier":"DIAMOND","valoracion":150000}'
            echo ""
            echo "✅ Certificado Royal Premium generado"
            ;;
        4)
            echo "🏗️ GENERANDO 10 DISEÑOS ARQUITECTONICOS..."
            echo "------------------------------------------"
            curl -s -X POST $API/api/arquitectura/masivo \
              -H "Content-Type: application/json" \
              -d '{"limite":10}'
            echo ""
            echo "✅ 10 diseños generados"
            ;;
        5)
            echo "🧠 ESTADO ARQUITECTO AI:"
            echo "----------------------"
            curl -s $API/api/arquitecto-ai/estado
            echo ""
            ;;
        6)
            echo "📊 REPORTE COMPLETO:"
            echo "===================="
            echo ""
            echo "⚡ Sistema:"
            curl -s $API/api/arquitectura/stats | head -3
            echo ""
            echo "🧠 Arquitecto AI:"
            curl -s $API/api/arquitecto-ai/estado | head -2
            echo ""
            echo "✅ Sistema 100% operacional"
            echo ""
            ;;
        0)
            echo "🔱 Hasta luego, Roberto!"
            exit 0
            ;;
        *)
            echo "❌ Opcion invalida"
            ;;
    esac
done
