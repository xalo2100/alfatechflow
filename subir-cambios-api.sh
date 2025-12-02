#!/bin/bash

echo "🚀 Subiendo cambios de APIs de Pipedrive y Gemini a Git/GitHub..."
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Agregar archivos críticos de API
echo "${YELLOW}📦 Agregando archivos de API...${NC}"
git add lib/gemini.ts lib/pipedrive.ts
git add app/api/pipedrive/buscar-organizacion/route.ts
git add app/api/pipedrive/test-search/route.ts
git add app/api/reportes/track-lectura/route.ts
git add app/api/reportes/enviar-email/route.ts
git add app/api/reportes/guardar-firma-tecnico/
git add app/api/reportes/subir-pdf-temporal/

# 2. Agregar otros cambios importantes
echo "${YELLOW}📦 Agregando componentes y otras funcionalidades...${NC}"
git add components/reportes/dashboard.tsx
git add components/reportes/reporte-detail-dialog.tsx
git add components/tecnico/dashboard.tsx
git add components/tecnico/ticket-detail.tsx
git add components/tecnico/ticket-list.tsx
git add components/ventas/dashboard.tsx
git add components/ventas/ticket-card.tsx
git add components/ventas/ticket-list-view.tsx
git add components/reportes/firma-tecnico-dialog.tsx
git add components/dynamic-favicon.tsx
git add components/dynamic-title.tsx

echo "${GREEN}✅ Archivos agregados${NC}"
echo ""

# 3. Verificar qué se va a commitar
echo "${YELLOW}📋 Archivos preparados para commit:${NC}"
git status --short | grep -E "(lib/(gemini|pipedrive)|api/(pipedrive|reportes)|components/)"
echo ""

# 4. Hacer commit
echo "${YELLOW}💾 Haciendo commit...${NC}"
git commit -m "Fix: Correcciones APIs Pipedrive/Gemini + nuevas funcionalidades

- Fix: lib/gemini.ts y lib/pipedrive.ts usan createAdminClient() para funcionar en servidor
- Fix: Agregado force-dynamic a rutas API para evitar errores de build
- Nuevo: API para guardar firma del técnico
- Nuevo: API para subir PDF temporal para WhatsApp
- Nuevo: Mostrar técnico asignado en recuadros de tickets
- Nuevo: Botón de WhatsApp en reportes
- Nuevo: Firma del técnico en reportes"

if [ $? -eq 0 ]; then
    echo "${GREEN}✅ Commit realizado exitosamente${NC}"
    echo ""
    
    # 5. Preguntar si hacer push
    read -p "¿Deseas subir los cambios a GitHub ahora? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo "${YELLOW}📤 Subiendo a GitHub...${NC}"
        git push origin main
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "${GREEN}✅ ¡Cambios subidos exitosamente!${NC}"
            echo ""
            echo "⏳ Vercel desplegará automáticamente los cambios en 2-5 minutos."
            echo "🔍 Puedes ver el progreso en: https://vercel.com/dashboard"
        else
            echo ""
            echo "❌ Error al subir los cambios. Revisa el mensaje de error arriba."
        fi
    else
        echo ""
        echo "⚠️  No se subieron los cambios. Ejecuta 'git push origin main' cuando estés listo."
    fi
else
    echo ""
    echo "❌ Error al hacer commit. Revisa el mensaje de error arriba."
fi




