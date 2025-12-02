#!/bin/bash

# Script para arreglar el error de Vercel
# Asegura que todos los archivos, incluyendo app/, se suban a GitHub

echo "🔧 Arreglando error de Vercel..."
echo ""

cd /Users/gonzalo/Documents/alfatechflow-hosting-basico

# Verificar que estamos en el lugar correcto
if [ ! -d "app" ]; then
    echo "❌ Error: No se encontró la carpeta app/"
    exit 1
fi

echo "✅ Carpeta app/ encontrada"
echo ""

# Agregar TODOS los archivos
echo "📦 Agregando todos los archivos a git..."
git add -A

# Verificar que app/ esté incluido
if git ls-files app/ | head -1 > /dev/null 2>&1; then
    echo "✅ Carpeta app/ está incluida"
else
    echo "❌ Error: app/ no se agregó"
    exit 1
fi

echo ""
echo "📋 Archivos listos para commit:"
git status --short | head -10

echo ""
echo "💾 Hacer commit..."
git commit -m "Fix: Agregar todos los archivos incluyendo carpeta app/"

echo ""
echo "📤 PASOS SIGUIENTES:"
echo ""
echo "1. Verificar que el remote esté configurado:"
echo "   git remote -v"
echo ""
echo "2. Si no está, configurarlo:"
echo "   git remote add origin https://github.com/xalo2100/alfatechflow.git"
echo ""
echo "3. Cambiar a rama main:"
echo "   git branch -M main"
echo ""
echo "4. Subir a GitHub:"
echo "   git push -u origin main"
echo ""
echo "5. Vercel se actualizará automáticamente"
echo ""





