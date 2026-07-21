/**
 * ARCHIVO PRINCIPAL DE LÓGICA (JS ES6+)
 * Estructurado mediante servicios y controladores para desacoplar el estado de la vista.
 */

// --- 1. SERVICIO DE ALMACENAMIENTO (Patrón Repositorio) ---
class StorageService {
  static get(key, defaultValue = []) {
    try {
      const data = localStorage.getItem(`nc_${key}`);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error(`Error leyendo ${key} desde localStorage:`, e);
      return defaultValue;
    }
  }

  static set(key, value) {
    try {
      localStorage.setItem(`nc_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error(`Error guardando ${key} en localStorage:`, e);
    }
  }
}

// --- 2. ESTADO GLOBAL DE LA APLICACIÓN ---
const AppState = {
  hermanos: StorageService.get("hermanos"),
  grupos: StorageService.get("grupos"),
  preparaciones: StorageService.get("preparaciones"),
  celebraciones: StorageService.get("celebraciones"),

  save() {
    StorageService.set("hermanos", this.hermanos);
    StorageService.set("grupos", this.grupos);
    StorageService.set("preparaciones", this.preparaciones);
    StorageService.set("celebraciones", this.celebraciones);
  }
};

// --- 3. UTILIDADES ---
const Utils = {
  parseDateLocal(dateStr) {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  },

  formatDate(dateStr) {
    const d = this.parseDateLocal(dateStr);
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  }
};

// --- 4. CONTROLADOR DE INTERFAZ DE USUARIO (UI) ---
const UI = {
  init() {
    this.setupNavigation();
    this.setupFormListeners();
    this.renderAll();
    lucide.createIcons();
  },

  setupNavigation() {
    document.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.getAttribute("href").substring(1);

        document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("bg-slate-800", "text-white"));
        link.classList.add("bg-slate-800", "text-white");

        document.querySelectorAll(".app-section").forEach(sec => sec.classList.add("hidden"));
        document.getElementById(`sec-${targetId}`).classList.remove("hidden");
      });
    });
  },

  openModal(modalId) {
    document.getElementById("modal-backdrop").classList.remove("hidden");
    document.getElementById(modalId).classList.remove("hidden");
  },

  closeModals() {
    document.getElementById("modal-backdrop").classList.add("hidden");
    document.querySelectorAll(".modal-card").forEach(m => m.classList.add("hidden"));
  },

  openModalGrupo() {
    const container = document.getElementById("miembros-checkboxes");
    container.innerHTML = AppState.hermanos.map(h => `
      <label class="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded text-sm cursor-pointer">
        <input type="checkbox" value="${h.id}" class="rounded text-indigo-600 focus:ring-indigo-500">
        <span>${h.nombre} ${h.apellido}</span>
      </label>
    `).join("") || '<p class="text-xs text-slate-400 p-2">Registra hermanos primero.</p>';
    this.openModal("modal-grupo");
  },

  openModalPreparacion() {
    const select = document.getElementById("select-grupo-prep");
    select.innerHTML = '<option value="">Seleccionar Equipo a Cargo...</option>' +
      AppState.grupos.map(g => `<option value="${g.id}">${g.nombre}</option>`).join("");
    this.openModal("modal-preparacion");
  },

  openModalCelebracion() {
    const select = document.getElementById("select-preparacion-cel");
    select.innerHTML = '<option value="">Seleccionar evento preparado...</option>' +
      AppState.preparaciones.map(p => `<option value="${p.id}">${p.tipo.toUpperCase()} - ${Utils.formatDate(p.fecha)}</option>`).join("");
    
    document.getElementById("asistentes-checkboxes").innerHTML = '<p class="text-xs text-slate-400 p-2 col-span-2">Selecciona un evento arriba.</p>';
    this.openModal("modal-celebracion");
  },

  renderAll() {
    this.renderHermanos();
    this.renderGrupos();
    this.renderPreparaciones();
    this.renderCelebraciones();
    this.renderCalendario();
    this.renderEstadisticas();
  },

  renderHermanos() {
    const container = document.getElementById("lista-hermanos");
    if (AppState.hermanos.length === 0) {
      container.innerHTML = `<div class="col-span-full p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">No hay hermanos registrados.</div>`;
      return;
    }

    container.innerHTML = AppState.hermanos.map(h => `
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full ${h.sexo === 'F' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'} flex items-center justify-center font-bold text-sm">
            ${h.nombre[0]}${h.apellido[0]}
          </div>
          <div>
            <h4 class="font-bold text-slate-800">${h.nombre} ${h.apellido}</h4>
            <span class="inline-block mt-0.5 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${
              h.rol === 'responsable' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
            }">${h.rol}</span>
          </div>
        </div>
      </div>
    `).join("");
  },

  renderGrupos() {
    const container = document.getElementById("lista-grupos");
    if (AppState.grupos.length === 0) {
      container.innerHTML = `<div class="col-span-full p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">No hay equipos creados.</div>`;
      return;
    }

    container.innerHTML = AppState.grupos.map(g => `
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div class="flex justify-between items-start mb-3">
          <h4 class="font-bold text-slate-900">${g.nombre}</h4>
          <span class="text-xs font-medium px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md">${g.tipo}</span>
        </div>
        <p class="text-xs font-semibold text-slate-400 mb-2">INTEGRANTES (${g.miembros.length}):</p>
        <div class="flex flex-wrap gap-1">
          ${g.miembros.map(m => `<span class="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md">${m.nombre} ${m.apellido}</span>`).join("")}
        </div>
      </div>
    `).join("");
  },

  renderPreparaciones() {
    const container = document.getElementById("lista-preparaciones");
    if (AppState.preparaciones.length === 0) {
      container.innerHTML = `<div class="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">No hay preparaciones litúrgicas agendadas.</div>`;
      return;
    }

    container.innerHTML = AppState.preparaciones.map(p => {
      const grupo = AppState.grupos.find(g => g.id === p.grupoId);
      return `
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="p-3 bg-indigo-50 text-indigo-600 rounded-lg font-bold text-xs uppercase text-center w-16">
              ${p.tipo.substring(0, 4)}
            </div>
            <div>
              <h4 class="font-bold text-slate-800">${p.tipo.toUpperCase()}</h4>
              <p class="text-xs text-slate-500">Fecha: ${Utils.formatDate(p.fecha)} | Equipo: <span class="font-semibold text-slate-700">${grupo ? grupo.nombre : 'N/A'}</span></p>
            </div>
          </div>
        </div>
      `;
    }).join("");
  },

  renderCelebraciones() {
    const container = document.getElementById("lista-celebraciones");
    if (AppState.celebraciones.length === 0) {
      container.innerHTML = `<div class="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">No hay registros de celebración.</div>`;
      return;
    }

    container.innerHTML = AppState.celebraciones.map(c => `
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <span class="text-xs font-bold text-emerald-600 uppercase tracking-wider">${c.tipo}</span>
          <h4 class="font-bold text-slate-800">${Utils.formatDate(c.fecha)}</h4>
        </div>
        <div class="text-right">
          <span class="text-lg font-bold text-slate-800">${c.asistentesIds.length}</span>
          <span class="text-xs text-slate-400 block">asistentes</span>
        </div>
      </div>
    `).join("");
  },

  renderCalendario() {
    const container = document.getElementById("calendario-eventos");
    const mesActual = new Date().getMonth();

    const eventos = [];

    AppState.preparaciones.forEach(p => {
      const f = Utils.parseDateLocal(p.fecha);
      if (f.getMonth() === mesActual) {
        eventos.push(`<div class="p-3 bg-indigo-50 border-l-4 border-indigo-600 rounded-r-lg text-sm text-indigo-900 font-medium">📅 [${p.tipo.toUpperCase()}] Preparación el ${Utils.formatDate(p.fecha)}</div>`);
      }
    });

    AppState.hermanos.forEach(h => {
      if (!h.nacimiento) return;
      const f = Utils.parseDateLocal(h.nacimiento);
      if (f.getMonth() === mesActual) {
        eventos.push(`<div class="p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg text-sm text-amber-900 font-medium">🎂 Cumpleaños de ${h.nombre} ${h.apellido} el día ${f.getDate()}</div>`);
      }
    });

    container.innerHTML = eventos.length ? eventos.join("") : `<p class="text-slate-400 text-sm">No hay eventos ni cumpleaños para este mes.</p>`;
  },

  renderEstadisticas() {
    const totalCels = AppState.celebraciones.length;
    document.getElementById("stat-total-celebraciones").textContent = totalCels;

    if (totalCels === 0) return;

    const totalAsistencias = AppState.celebraciones.reduce((acc, c) => acc + c.asistentesIds.length, 0);
    document.getElementById("stat-promedio-global").textContent = (totalAsistencias / totalCels).toFixed(1);

    const eucas = AppState.celebraciones.filter(c => c.tipo === "eucaristia");
    const totalEucasAsist = eucas.reduce((acc, c) => acc + c.asistentesIds.length, 0);
    document.getElementById("stat-promedio-eucarias").textContent = eucas.length ? (totalEucasAsist / eucas.length).toFixed(1) : 0;

    const select = document.getElementById("select-stat-hermano");
    select.innerHTML = '<option value="">Seleccionar hermano/a...</option>' +
      AppState.hermanos.map(h => `<option value="${h.id}">${h.nombre} ${h.apellido}</option>`).join("");
  },

  setupFormListeners() {
    // Formulario Hermano
    document.getElementById("form-hermano").addEventListener("submit", (e) => {
      e.preventDefault();
      const nuevo = {
        id: Date.now(),
        nombre: document.getElementById("nombre-hermano").value.trim(),
        apellido: document.getElementById("apellido-hermano").value.trim(),
        sexo: document.getElementById("sexo-hermano").value,
        nacimiento: document.getElementById("nacimiento-hermano").value,
        rol: document.getElementById("rol-hermano").value
      };

      AppState.hermanos.push(nuevo);
      AppState.save();
      this.renderAll();
      this.closeModals();
      e.target.reset();
    });

    // Formulario Grupo
    document.getElementById("form-grupo").addEventListener("submit", (e) => {
      e.preventDefault();
      const selectedIds = Array.from(e.target.querySelectorAll("input[type='checkbox']:checked")).map(cb => Number(cb.value));
      const miembros = AppState.hermanos.filter(h => selectedIds.includes(h.id));

      AppState.grupos.push({
        id: Date.now(),
        nombre: document.getElementById("nombre-grupo").value.trim(),
        tipo: document.getElementById("tipo-grupo").value,
        miembros
      });

      AppState.save();
      this.renderAll();
      this.closeModals();
      e.target.reset();
    });

    // Cambio dinámico en tipo de preparación
    document.getElementById("tipo-preparacion").addEventListener("change", (e) => {
      const container = document.getElementById("campos-dinamicos-prep");
      const val = e.target.value;
      if (val === "eucaristia" || val === "palabra") {
        container.innerHTML = `<input type="text" id="campo-lecturas" placeholder="Primera Lectura, Salmo, Evangelio..." class="input-field" required>`;
      } else if (val === "convivencia") {
        container.innerHTML = `<input type="text" id="campo-lugar" placeholder="Lugar de la convivencia" class="input-field" required>`;
      } else {
        container.innerHTML = "";
      }
    });

    // Formulario Preparación
    document.getElementById("form-preparacion").addEventListener("submit", (e) => {
      e.preventDefault();
      AppState.preparaciones.push({
        id: Date.now(),
        fecha: document.getElementById("fecha-preparacion").value,
        tipo: document.getElementById("tipo-preparacion").value,
        grupoId: Number(document.getElementById("select-grupo-prep").value)
      });

      AppState.save();
      this.renderAll();
      this.closeModals();
      e.target.reset();
    });

    // Cambio en selección de preparación al tomar asistencia
    document.getElementById("select-preparacion-cel").addEventListener("change", (e) => {
      const container = document.getElementById("asistentes-checkboxes");
      if (!e.target.value) return;

      container.innerHTML = AppState.hermanos.map(h => `
        <label class="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded text-sm cursor-pointer">
          <input type="checkbox" value="${h.id}" class="rounded text-indigo-600 focus:ring-indigo-500">
          <span>${h.nombre} ${h.apellido}</span>
        </label>
      `).join("");
    });

    // Formulario Celebración
    document.getElementById("form-celebracion").addEventListener("submit", (e) => {
      e.preventDefault();
      const prepId = Number(document.getElementById("select-preparacion-cel").value);
      const prep = AppState.preparaciones.find(p => p.id === prepId);
      const selectedIds = Array.from(document.querySelectorAll("#asistentes-checkboxes input[type='checkbox']:checked")).map(cb => Number(cb.value));

      AppState.celebraciones.push({
        id: Date.now(),
        preparacionId: prepId,
        tipo: prep ? prep.tipo : "General",
        fecha: prep ? prep.fecha : new Date().toISOString().split("T")[0],
        asistentesIds: selectedIds
      });

      AppState.save();
      this.renderAll();
      this.closeModals();
      e.target.reset();
    });

    // Métricas por Hermano
    document.getElementById("select-stat-hermano").addEventListener("change", (e) => {
      const hId = Number(e.target.value);
      const res = document.getElementById("resultado-stat-hermano");
      if (!hId) {
        res.innerHTML = "";
        return;
      }

      const asistidas = AppState.celebraciones.filter(c => c.asistentesIds.includes(hId)).length;
      const total = AppState.celebraciones.length;
      const pct = total ? ((asistidas / total) * 100).toFixed(0) : 0;

      res.innerHTML = `Asistencia registrada: <span class="font-bold text-indigo-600">${asistidas} de ${total}</span> celebraciones (${pct}%).`;
    });
  }
};

// --- INICIALIZACIÓN DE LA APP ---
document.addEventListener("DOMContentLoaded", () => UI.init());
