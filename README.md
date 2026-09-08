# 🧺 Sprint Review · Solución Lavandería de Barrio

> Dashboard interactivo y presentación ejecutiva de Sprint Reviews semanales para el Proyecto Integrador PPIV (2026).

---

## 🚀 Características

- **Diseño Executive Editorial Tech:** Tipografía de alta fidelidad (`Plus Jakarta Sans` y `JetBrains Mono`) y arquitectura *Doppelrand* (doble bezel).
- **Modos de Vista Dual:**
  - **Diapositivas:** Modo presentación interactivo paso a paso.
  - **Resumen continuo:** Modo One-Pager tipo memorando ejecutivo.
- **Mobile-First & Touch Swipe:** Soporte para gestos táctiles (*swipe*) y botones táctiles ergonómicos (44px).
- **Enlaces a Jira y Hub:** Acceso directo integrado al tablero de Jira y al Hub del proyecto.
- **Zero Dependencies:** Servidor Node.js nativo sin necesidad de dependencias externas.

---

## 📦 Ejecución

### Opción 1: Servidor Node.js
```bash
npm start
# o directamente:
node index.js
```
Abre en tu navegador: [http://localhost:3000](http://localhost:3000)

### Opción 2: Abrir archivo estático
Abre directamente `index.html` o `sprint-review-lavanderia.html` con cualquier navegador web.

---

## ⚙️ Configuración (.env)

Copia `.env.example` a `.env` para configurar URLs y puertos:
```dotenv
PORT=3000
JIRA_BOARD_URL="https://greenbox-group.atlassian.net/jira/core/projects/LV/board"
PROJECT_HUB_URL="https://home.atlassian.com/o/c17e2dbe-5dff-467c-abb6-a57163458aae/s/3e26fdbc-0f5f-4349-b25f-83505f54a6cc/project/VXLDIXPN-2/about"
```

---

## 👥 Equipo (Squad)
- **Andrea Sánchez Liporace** · *PO Técnico*
- **Emmanuel Espinoza** · *PO Técnico*
- **Jose Vedia** · *PO Técnico*
- **Omar Pérez** · *PO Técnico*
- **Sofía Páez** · *PO Técnico*
