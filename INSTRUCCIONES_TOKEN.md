# 🚀 Instrucciones Rápidas: Token de GitHub

## ⚡ PASOS RÁPIDOS:

### 1️⃣ Crear Token (2 minutos)

1. Abre en tu navegador: **https://github.com/settings/tokens**
2. Click en: **"Generate new token"** → **"Generate new token (classic)"**
3. Nombre: `Vercel Deploy`
4. Marca: ✅ **`repo`** (Full control of private repositories)
5. Click en: **"Generate token"**
6. **COPIA EL TOKEN** (solo lo verás una vez)
   - Se ve como: `ghp_xxxxxxxxxxxxxxxxxxxx`

### 2️⃣ Hacer Push

```bash
cd /Users/gonzalo/Documents/alfatechflow-hosting-basico
git push -u origin main
```

**Cuando te pida:**
- Username: `xalo2100` (solo el usuario, sin @gmail.com)
- Password: Pega el token que copiaste

### 3️⃣ ¡Listo!

Después del push:
- Ve a: https://github.com/xalo2100/alfatechflow
- Verifica que la carpeta `app/` esté ahí
- Vercel hará deploy automáticamente

---

## 🎯 Link Directo:

👉 **https://github.com/settings/tokens**

---

## 💡 Tip:

Si quieres evitar escribir el token cada vez:

```bash
git config --global credential.helper osxkeychain
```

Esto guardará el token en tu Mac.





