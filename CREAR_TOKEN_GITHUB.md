# 🔑 Crear Token de Acceso Personal para GitHub

## ⚠️ Problema:
GitHub ya no acepta contraseñas. Necesitas un **token de acceso personal**.

---

## ✅ PASO A PASO:

### 1. Crear el Token

1. Ve a: **https://github.com/settings/tokens**
2. O ve a: GitHub → Tu foto (arriba derecha) → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**

3. Click en **"Generate new token"** → **"Generate new token (classic)"**

4. **Configurar el token:**
   - **Note (nombre):** `Vercel Deploy` (o el que prefieras)
   - **Expiration:** `90 days` (o el que prefieras)
   - **Select scopes:** Marca **`repo`** (esto da acceso completo a repositorios)
     - O marca específicamente:
       - ✅ `repo` (Full control of private repositories)

5. Click en **"Generate token"** (abajo)

6. **⚠️ IMPORTANTE:** GitHub te mostrará el token **UNA SOLA VEZ**
   - **CÓPIALO INMEDIATAMENTE**
   - Guárdalo en un lugar seguro
   - Se verá algo como: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

### 2. Usar el Token

Cuando hagas `git push`, te pedirá:
- **Username:** `xalo2100` (tu usuario, sin @gmail.com)
- **Password:** Pega el **TOKEN** (no tu contraseña)

---

### 3. Hacer Push

```bash
cd /Users/gonzalo/Documents/alfatechflow-hosting-basico

git push -u origin main
```

**Cuando te pida:**
- Username: `xalo2100`
- Password: `ghp_tu_token_aqui` (el token que copiaste)

---

## 🔄 Alternativa: Guardar el Token

Para no tener que escribirlo cada vez, puedes configurarlo:

```bash
# Guardar credenciales (se guardará en el keychain)
git config --global credential.helper osxkeychain

# Luego hacer push (solo una vez tendrás que escribir el token)
git push -u origin main
```

---

## 🎯 Comandos Completos:

```bash
# 1. Ir al proyecto
cd /Users/gonzalo/Documents/alfatechflow-hosting-basico

# 2. Configurar helper (opcional, solo una vez)
git config --global credential.helper osxkeychain

# 3. Hacer push
git push -u origin main
```

**Cuando te pida contraseña:** Pega el token que creaste.

---

## ✅ Verificar que funcionó:

1. Ve a: https://github.com/xalo2100/alfatechflow
2. Deberías ver todos los archivos y la carpeta `app/`
3. Vercel hará deploy automáticamente

---

## 🔗 Links Rápidos:

- **Crear token:** https://github.com/settings/tokens
- **Tu repositorio:** https://github.com/xalo2100/alfatechflow





