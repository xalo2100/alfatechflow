#!/bin/bash

# Script para subir el proyecto a Vercel
# Paso 1: Preparar Git

echo "🚀 Preparando proyecto para Vercel..."
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json"
    exit 1
fi

# Verificar si git está inicializado
if [ ! -d ".git" ]; then
    echo "📦 Inicializando Git..."
    git init
    echo "✅ Git inicializado"
else
    echo "✅ Git ya está inicializado"
fi

echo ""
echo "📋 PASOS PARA SUBIR A VERCEL:"
echo ""
echo "1️⃣  CREA UN REPOSITORIO EN GITHUB:"
echo "   - Ve a: https://github.com/new"
echo "   - Nombre: alfatechflow (o el que prefieras)"
echo "   - Hazlo PRIVATE (recomendado)"
echo "   - NO marques 'Add README'"
echo "   - Click en 'Create repository'"
echo ""
echo "2️⃣  SUBE EL CÓDIGO A GITHUB:"
echo ""
echo "   git add ."
echo "   git commit -m 'Initial commit - AlfaTechFlow'"
echo "   git branch -M main"
echo "   git remote add origin https://github.com/TU_USUARIO/alfatechflow.git"
echo "   git push -u origin main"
echo ""
echo "   ⚠️  REEMPLAZA 'TU_USUARIO' con tu usuario de GitHub"
echo ""
echo "3️⃣  CONECTA CON VERCEL:"
echo "   - Ve a: https://vercel.com"
echo "   - Sign Up → Continue with GitHub"
echo "   - Add New Project"
echo "   - Selecciona tu repositorio"
echo "   - Agrega las variables de entorno"
echo "   - Click en Deploy"
echo ""
echo "📚 Ver DEPLOY_VERCEL.md para guía detallada"
echo ""

