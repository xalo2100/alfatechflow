#!/bin/bash

# Script para hacer force push y solucionar el conflicto

echo "🚀 Solucionando conflicto con force push..."
echo ""

cd /Users/gonzalo/Documents/alfatechflow-hosting-basico

echo "⚠️  Esto reemplazará todo en GitHub con tu versión local"
echo "   (Tu versión local tiene la carpeta app/ completa)"
echo ""

# Verificar que tenemos la carpeta app/
if [ ! -d "app" ]; then
    echo "❌ Error: No se encontró la carpeta app/"
    exit 1
fi

echo "✅ Carpeta app/ encontrada localmente"
echo ""

# Hacer force push
echo "📤 Haciendo force push..."
git push -u origin main --force

echo ""
echo "✅ ¡Listo!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Ve a: https://github.com/xalo2100/alfatechflow"
echo "2. Verifica que la carpeta app/ esté visible"
echo "3. Vercel hará deploy automáticamente"
echo ""





