// --- ESTADO DE LA APLICACIÓN ---
const AppState = {
  hermanos: [],
  grupos: [],

  init() {
    this.hermanos = StorageService.get("hermanos", []);
    this.grupos = StorageService.get("grupos", []);
  },

  save() {
    StorageService.set("hermanos", this.hermanos);
    StorageService.set("grupos", this.grupos);
  }
};

// --- SERVICIO DE ARQUITECTURA / ALMACENAMIENTO (PERSISTENCIA Y JSON) ---
class StorageService {
  static get(key, defaultValue = []) {
    try {
      const data = localStorage.getItem(`nc_${key}`);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  static set(key, value) {
    try {
      localStorage.setItem(`nc_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error(`Error guardando ${key}:`, e);
    }
  }

  // Exportar el JSON como archivo local
  static exportJSON() {
    if (AppState.hermanos.length === 0 && AppState.grupos.length === 0) {
      alert("La base de datos está vacía. Registra datos antes de exportar.");
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(AppState, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `comunidad_backup_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  // Cargar un archivo JSON externo
  static importJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (Array.isArray(importedData.hermanos) && Array.isArray(importedData.grupos)) {
          AppState.hermanos = importedData.hermanos;
          AppState.grupos = importedData.grupos;
          AppState.save();
          UI.renderAll();
          alert("¡Base de datos importada exitosamente!");
        } else {
          alert("Formato no válido. El JSON debe incluir arreglos de 'hermanos' y 'grupos'.");
        }
      } catch (err) {
        alert("Error al leer el archivo JSON.");
      }
    };
    reader.readAsText(file);
    event.target.value = ""; // Limpiar input
  }
}

// --- INTERFAZ DE USUARIO (UI) ---
let modoCreacionEquipo = "manual";

const UI = {
  renderAll() {
    this.renderStats();
    this.renderGrupos();
    this.renderListaHermanos();
    lucide.createIcons();
  },

  renderStats() {
    const total = AppState.hermanos.length;
    const asignadosIds = new Set(AppState.grupos.flatMap(g => g.miembros.map(m => m.id)));
    const asignadosCount = AppState.hermanos.filter(h => asignadosIds.has(h.id)).length;
    const disponiblesCount = total - asignadosCount;

    document.getElementById("stat-total-hermanos").textContent = total;
    document.getElementById("stat-asignados").textContent = asignadosCount;
    document.getElementById("stat-disponibles").textContent = disponiblesCount;
  },

  renderListaHermanos(filterQuery = "") {
    const container = document.getElementById("lista-hermanos-container");
    const counter = document.getElementById("cnt-lista-hermanos");
    const asignadosIds = new Set(AppState.grupos.flatMap(g => g.miembros.map(m => m.id)));

    const filtered = AppState.hermanos.filter(h => 
      `${h.nombre} ${h.apellido}`.toLowerCase().includes(filterQuery.toLowerCase())
    );

    counter.textContent = filtered.length;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="text-center py-6 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          <p class="text-xs">No hay hermanos registrados o no coinciden con la búsqueda.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(h => {
      const estaAsignado = asignadosIds.has(h.id);
      const iniciales = `${h.nombre.charAt(0)}${h.apellido.charAt(0)}`.toUpperCase();

      return `
        <div class="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/60 transition">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
              ${iniciales}
            </div>
            <div>
              <p class="text-xs font-bold text-slate-800">${h.nombre} ${h.apellido}</p>
              <span class="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full ${estaAsignado ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                ${estaAsignado ? 'En Equipo' : 'Sin Equipo'}
              </span>
            </div>
          </div>
          <button onclick="UI.eliminarHermano(${h.id})" class="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition" title="Eliminar Hermano">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      `;
    }).join("");

    lucide.createIcons();
  },

  filterHermanos(query) {
    this.renderListaHermanos(query);
  },

  eliminarHermano(id) {
    if (!confirm("¿Deseas eliminar este hermano? También será removido de los equipos a los que pertenezca.")) return;

    AppState.hermanos = AppState.hermanos.filter(h => h.id !== id);
    // Limpiar de los grupos
    AppState.grupos.forEach(g => {
      g.miembros = g.miembros.filter(m => m.id !== id);
    });

    AppState.save();
    this.renderAll();
  },

  renderGrupos() {
    const container = document.getElementById("grid-grupos");

    if (AppState.grupos.length === 0) {
      container.innerHTML = `
        <div class="col-span-full bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center text-slate-400">
          <p class="text-sm font-medium">No se han creado equipos aún.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = AppState.grupos.map(g => `
      <div class="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 flex flex-col justify-between space-y-4">
        <div>
          <div class="flex justify-between items-start mb-2">
            <div>
              <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                ${g.tipo === 'preparacion' ? 'Liturgia' : 'Limpieza'}
              </span>
              <h4 class="font-bold text-slate-900 text-sm mt-1">${g.nombre}</h4>
            </div>
            <button onclick="UI.eliminarGrupo(${g.id})" class="text-slate-300 hover:text-rose-600 transition">
              <i data-lucide="x-circle" class="w-4 h-4"></i>
            </button>
          </div>
          
          <div class="space-y-1.5 mt-3">
            <p class="text-[11px] font-semibold text-slate-400 uppercase">Integrantes (${g.miembros.length})</p>
            <div class="flex flex-wrap gap-1">
              ${g.miembros.map(m => `
                <span class="text-xs bg-slate-50 border border-slate-200 text-slate-700 px-2 py-1 rounded-md font-medium">
                  ${m.nombre} ${m.apellido}
                </span>
              `).join("")}
            </div>
          </div>
        </div>
      </div>
    `).join("");

    lucide.createIcons();
  },

  eliminarGrupo(id) {
    if (!confirm("¿Deseas disolver este equipo?")) return;
    AppState.grupos = AppState.grupos.filter(g => g.id !== id);
    AppState.save();
    this.renderAll();
  },

  // --- CONTROL DE MODALES ---
  openModal(modalId) {
    document.getElementById("modal-container").classList.remove("hidden");
    document.getElementById("modal-hermanos").classList.add("hidden");
    document.getElementById("modal-grupo").classList.add("hidden");

    document.getElementById(modalId).classList.remove("hidden");
    document.getElementById(modalId).classList.add("flex");
  },

  closeModals() {
    document.getElementById("modal-container").classList.add("hidden");
  },

  openModalHermanos() {
    this.renderListaHermanos();
    this.openModal("modal-hermanos");
  },

  openModalGrupo() {
    this.toggleModoEquipo("manual");
    const container = document.getElementById("miembros-checkboxes");
    
    container.innerHTML = AppState.hermanos.map(h => `
      <label class="flex items-center gap-2.5 p-2 hover:bg-slate-100 rounded-lg text-xs cursor-pointer text-slate-700 font-medium">
        <input type="checkbox" value="${h.id}" class="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4">
        <span>${h.nombre} ${h.apellido}</span>
      </label>
    `).join("") || '<p class="text-xs text-slate-400 p-3 text-center">Registra hermanos primero.</p>';
    
    this.openModal("modal-grupo");
  },

  toggleModoEquipo(modo) {
    modoCreacionEquipo = modo;
    const btnManual = document.getElementById("tab-manual");
    const btnAuto = document.getElementById("tab-auto");
    const secManual = document.getElementById("sec-equipo-manual");
    const secAuto = document.getElementById("sec-equipo-auto");

    if (modo === "manual") {
      btnManual.className = "px-3 py-1 rounded-md bg-white shadow-sm text-indigo-600 font-semibold";
      btnAuto.className = "px-3 py-1 rounded-md text-slate-600";
      secManual.classList.remove("hidden");
      secAuto.classList.add("hidden");
    } else {
      btnAuto.className = "px-3 py-1 rounded-md bg-white shadow-sm text-indigo-600 font-semibold";
      btnManual.className = "px-3 py-1 rounded-md text-slate-600";
      secAuto.classList.remove("hidden");
      secManual.classList.add("hidden");

      // Calcular hermanos no asignados
      const asignadosIds = new Set(AppState.grupos.flatMap(g => g.miembros.map(m => m.id)));
      const disponibles = AppState.hermanos.filter(h => !asignadosIds.has(h.id));
      document.getElementById("cant-disponibles").textContent = disponibles.length;
    }
  }
};

// --- EVENT LISTENERS ---
document.addEventListener("DOMContentLoaded", () => {
  AppState.init();
  UI.renderAll();

  // Formulario Hermano
  document.getElementById("form-hermano").addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = document.getElementById("nombre-hermano").value.trim();
    const apellido = document.getElementById("apellido-hermano").value.trim();

    if (!nombre || !apellido) return;

    AppState.hermanos.push({
      id: Date.now(),
      nombre,
      apellido
    });

    AppState.save();
    UI.renderAll();
    
    document.getElementById("form-hermano").reset();
    document.getElementById("nombre-hermano").focus();
  });

  // Formulario Grupo
  document.getElementById("form-grupo").addEventListener("submit", (e) => {
    e.preventDefault();
    let miembrosSeleccionados = [];

    if (modoCreacionEquipo === "manual") {
      const selectedIds = Array.from(e.target.querySelectorAll("input[type='checkbox']:checked")).map(cb => Number(cb.value));
      miembrosSeleccionados = AppState.hermanos.filter(h => selectedIds.includes(h.id));
    } else {
      const asignadosIds = new Set(AppState.grupos.flatMap(g => g.miembros.map(m => m.id)));
      const disponibles = AppState.hermanos.filter(h => !asignadosIds.has(h.id));
      const cantidad = Number(document.getElementById("cant-aleatorios").value);

      if (cantidad <= 0 || cantidad > disponibles.length) {
        alert(`Ingresa una cantidad entre 1 y ${disponibles.length} disponibles.`);
        return;
      }

      // Mezcla de Fisher-Yates / Random Shuffle
      const mezclados = [...disponibles].sort(() => 0.5 - Math.random());
      miembrosSeleccionados = mezclados.slice(0, cantidad);
    }

    if (miembrosSeleccionados.length === 0) {
      alert("Selecciona al menos un hermano.");
      return;
    }

    AppState.grupos.push({
      id: Date.now(),
      nombre: document.getElementById("nombre-grupo").value.trim(),
      tipo: document.getElementById("tipo-grupo").value,
      miembros: miembrosSeleccionados
    });

    AppState.save();
    UI.renderAll();
    UI.closeModals();
    e.target.reset();
  });
});
