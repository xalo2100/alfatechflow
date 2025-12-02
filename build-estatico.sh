#!/bin/bash

# Script para generar build estático de Next.js
# Genera archivos HTML + JS para hosting compartido

echo "🔨 Generando build estático de Next.js..."
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json"
    echo "   Asegúrate de estar en la raíz del proyecto"
    exit 1
fi

# Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
    echo ""
fi

# Limpiar builds anteriores
if [ -d "out" ]; then
    echo "🧹 Limpiando build anterior..."
    rm -rf out
    echo ""
fi

if [ -d ".next" ]; then
    echo "🧹 Limpiando .next..."
    rm -rf .next
    echo ""
fi

# Generar build estático
echo "🏗️  Compilando proyecto..."
echo "   (Esto puede tardar varios minutos...)"
echo ""

npm run build

# Verificar que se generó correctamente
if [ -d "out" ]; then
    echo ""
    echo "✅ ¡Build estático generado exitosamente!"
    echo ""
    echo "📁 Archivos generados en: ./out/"
    echo ""
    echo "📊 Tamaño del build:"
    du -sh out
    echo ""
    echo "📋 Estructura de archivos:"
    echo "   - index.html (página principal)"
    echo "   - _next/static/ (JavaScript y CSS compilados)"
    echo "   - [páginas]/index.html (todas las páginas)"
    echo ""
    echo "🚀 Para subir a hosting compartido:"
    echo "   1. Sube TODO el contenido de ./out/ a public_html/"
    echo "   2. Configura .htaccess para redirigir rutas (ver GUIA_EXPORTACION_ESTATICA.md)"
    echo ""
    echo "⚠️  IMPORTANTE:"
    echo "   - Las API routes NO funcionarán"
    echo "   - Necesitas convertir páginas del servidor a cliente"
    echo "   - Ver GUIA_EXPORTACION_ESTATICA.md para más detalles"
    echo ""
else
    echo ""
    echo "❌ Error: No se generó la carpeta out/"
    echo "   Revisa los errores anteriores"
    exit 1
fi





