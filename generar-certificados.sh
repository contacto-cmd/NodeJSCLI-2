#!/bin/bash

echo "🏆 GENERADOR MASIVO DE CERTIFICADOS - STREET EMPORIO ROYAL"
echo "============================================================"
echo ""

# Obtener lista de proyectos
echo "📋 Obteniendo lista de proyectos..."
proyectos=$(curl -s http://localhost:5000/api/arquitectura/proyectos)

# Extraer IDs de proyectos
ids=$(echo "$proyectos" | grep -o '"id_proyecto":"[^"]*"' | cut -d'"' -f4)

# Contar proyectos
total=$(echo "$ids" | wc -l)
echo "✅ Encontrados $total proyectos arquitectónicos"
echo ""
echo "🔨 Generando certificados..."
echo ""

# Contadores
exitosos=0
fallidos=0
contador=1

# Archivo de resultados
resultado_file="./data/certificados-generados.txt"
echo "CERTIFICADOS GENERADOS - $(date)" > "$resultado_file"
echo "Autor: Roberto Rivera Gamas - Royal (Arquitecto)" >> "$resultado_file"
echo "Empresa: Street Emporio Royal" >> "$resultado_file"
echo "======================================" >> "$resultado_file"
echo "" >> "$resultado_file"

# Generar certificado para cada proyecto
for id in $ids; do
    echo "[$contador/$total] Generando certificado para proyecto: $id"
    
    response=$(curl -s -X POST "http://localhost:5000/api/certificados/generar/$id")
    
    # Verificar si fue exitoso
    if echo "$response" | grep -q '"success":true'; then
        cert_id=$(echo "$response" | grep -o '"certificado_id":"[^"]*"' | cut -d'"' -f4)
        url_verif=$(echo "$response" | grep -o '"url_verificacion":"[^"]*"' | cut -d'"' -f4)
        echo "   ✅ Certificado generado: $cert_id"
        echo "$contador. Proyecto: $id" >> "$resultado_file"
        echo "   Certificado: $cert_id" >> "$resultado_file"
        echo "   Verificar: $url_verif" >> "$resultado_file"
        echo "" >> "$resultado_file"
        ((exitosos++))
    else
        echo "   ❌ Error al generar certificado"
        ((fallidos++))
    fi
    
    ((contador++))
    sleep 0.5
done

echo ""
echo "============================================================"
echo "📊 RESUMEN DE GENERACIÓN"
echo "============================================================"
echo "Total de proyectos: $total"
echo "✅ Certificados exitosos: $exitosos"
echo "❌ Certificados fallidos: $fallidos"
echo ""
echo "💾 Resultados guardados en: $resultado_file"
echo ""
echo "✨ Proceso completado!"
echo "🏆 Street Emporio Royal - Throne Protocol V3.0"
echo ""
