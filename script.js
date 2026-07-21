// --- ESTADO DE LA APLICACIÓN ---
const AppState = {
  hermanos: [],
  grupos: [],
  casas: [],

  init() {
    this.hermanos = StorageService.get("hermanos", []);
    this.grupos = StorageService.get("grupos", []);
    this.casas = StorageService.get("casas", []);
  },

  save() {
    StorageService.set("hermanos", this.hermanos);
    StorageService.set("grupos", this.grupos);
    StorageService.set("casas", this.casas);
  }
};

// --- SERVICIO DE ARQUITECTURA / ALMACENAMIENTO ---
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

  static exportJSON() {
    if (AppState.hermanos.length === 0 && AppState.grupos.length === 0) {
      alert("La base de datos está vacía.");
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
          AppState.casas = importedData.casas || [];
          AppState.save();
          UI.renderAll();
          alert("¡Base de datos importada exitosamente!");
        } else {
          alert("Formato JSON no válido.");
        }
      } catch (err) {
        alert("Error al leer el archivo JSON.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }
}

// --- INTERFAZ DE USUARIO (UI) ---
let modoCreacionEquipo = "manual";

const UI = {
  renderAll() {
    this.renderStats();
    this.renderGrupos();
    this.renderListaHermanos();
    this.renderCasas();
    lucide.createIcons();
  },

  renderStats() {
    const total = AppState.hermanos.length;
    const hombres = AppState.hermanos.filter(h => h.sexo === 'H').length;
    const mujeres = AppState.hermanos.filter(h => h.sexo === 'M').length;
    
    // Contar matrimonios (parejas vinculadas únicas)
    const parejased = new Set();
    AppState.hermanos.forEach(h => {
      if (h.parejaId) parejased.add([h.id, h.parejaId].sort().join('-'));
    });

    const asignadosIds = new Set(AppState.grupos.flatMap(g => g.miembros.map(m => m.id)));
    const disponiblesCount = AppState.hermanos.filter(h => !asignadosIds.has(h.id)).length;

    document.getElementById("stat-total").textContent = total;
    document.getElementById("stat-hombres").textContent = `${hombres} ♂`;
    document.getElementById("stat-mujeres").textContent = `${mujeres} ♀`;
    document.getElementById("stat-matrimonios").textContent = parejased.size;
    document.getElementById("stat-disponibles").textContent = disponiblesCount;
  },

  renderListaHermanos(filterQuery = "") {
    const container = document.getElementById("lista-hermanos-container");
    const counter = document.getElementById("cnt-lista-hermanos");

    const filtered = AppState.hermanos.filter(h => 
      `${h.nombre} ${h.apellido}`.toLowerCase().includes(filterQuery.toLowerCase())
    );

    counter.textContent = filtered.length;

    if (filtered.length === 0) {
      container.innerHTML = `<p class="text-xs text-slate-400 py-4 text-center">No hay hermanos registrados.</p>`;
      return;
    }

    container.innerHTML = filtered.map(h => {
      const cónyuge = AppState.hermanos.find(p => p.id === h.parejaId);
      const sexoBadge = h.sexo === 'H' ? '<span class="text-blue-600 font-bold">♂</span>' : '<span class="text-pink-600 font-bold">♀</span>';

      return `
        <div class="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
          <div class="flex items-center gap-2">
            <span class="text-sm">${sexoBadge}</span>
            <div>
              <p class="text-xs font-bold text-slate-800">${h.nombre} ${h.apellido}</p>
              ${cónyuge ? `<p class="text-[10px] text-indigo-600">💍 Casado/a con ${cónyuge.nombre} ${cónyuge.apellido}</p>` : '<p class="text-[10px] text-slate-400">Soltero/a</p>'}
            </div>
          </div>
          <button onclick="UI.eliminarHermano(${h.id})" class="text-slate-400 hover:text-rose-600 p-1">
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
    if (!confirm("¿Deseas eliminar este hermano?")) return;

    // Desvincular de su cónyuge si tenía
    AppState.hermanos.forEach(h => {
      if (h.parejaId === id) h.parejaId = null;
    });

    AppState.hermanos = AppState.hermanos.filter(h => h.id !== id);
    AppState.grupos.forEach(g => {
      g.miembros = g.miembros.filter(m => m.id !== id);
    });

    AppState.save();
    this.renderAll();
  },

  renderGrupos() {
    const container = document.getElementById("grid-grupos");

    if (AppState.grupos.length === 0) {
      container.innerHTML = `<div class="col-span-full text-center text-slate-400 py-8 border border-dashed rounded-xl">Sin equipos de preparación.</div>`;
      return;
    }

    container.innerHTML = AppState.grupos.map(g => `
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div class="flex justify-between items-start">
          <div>
            <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">${g.tipo}</span>
            <h4 class="font-bold text-slate-900 text-sm mt-1">${g.nombre}</h4>
          </div>
          <button onclick="UI.eliminarGrupo(${g.id})" class="text-slate-300 hover:text-rose-600"><i data-lucide="x-circle" class="w-4 h-4"></i></button>
        </div>

        <div>
          <p class="text-[11px] font-semibold text-slate-400 uppercase">Integrantes (${g.miembros.length})</p>
          <div class="flex flex-wrap gap-1 mt-1">
            ${g.miembros.map(m => `
              <span class="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                ${m.sexo === 'H' ? '♂' : '♀'} ${m.nombre} ${m.apellido}
              </span>
            `).join("")}
          </div>
        </div>
      </div>
    `).join("");

    lucide.createIcons();
  },

  eliminarGrupo(id) {
    if (!confirm("¿Disolver este equipo?")) return;
    AppState.grupos = AppState.grupos.filter(g => g.id !== id);
    AppState.save();
    this.renderAll();
  },

  renderCasas() {
    const sec = document.getElementById("sec-casas-resultado");
    const container = document.getElementById("grid-casas");

    if (AppState.casas.length === 0) {
      sec.classList.add("hidden");
      return;
    }

    sec.classList.remove("hidden");
    container.innerHTML = AppState.casas.map((casa, idx) => `
      <div class="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 space-y-2">
        <div class="flex justify-between items-center">
          <h4 class="font-bold text-emerald-900 text-sm">Casa N° ${idx + 1}</h4>
          <span class="text-[10px] bg-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded-full">${casa.asistentes.length} Hermanos</span>
        </div>
        
        <div class="bg-white p-2 rounded-lg border border-emerald-100">
          <p class="text-[10px] uppercase font-bold text-emerald-700">Responsable (Preparador):</p>
          <p class="text-xs font-bold text-slate-800">${casa.responsable.sexo === 'H' ? '♂' : '♀'} ${casa.responsable.nombre} ${casa.responsable.apellido}</p>
        </div>

        <div>
          <p class="text-[10px] uppercase font-bold text-slate-500 mb-1">Acompañan:</p>
          <div class="space-y-1 max-h-36 overflow-y-auto pr-1">
            ${casa.asistentes.map(a => `
              <div class="text-xs bg-white/80 p-1.5 rounded border border-emerald-100 text-slate-700 flex justify-between">
                <span>${a.sexo === 'H' ? '♂' : '♀'} ${a.nombre} ${a.apellido}</span>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `).join("");
  },

  limpiarCasas() {
    AppState.casas = [];
    AppState.save();
    this.renderAll();
  },

  // --- MODALES ---
  openModal(modalId) {
    document.getElementById("modal-container").classList.remove("hidden");
    ["modal-hermanos", "modal-grupo", "modal-casas"].forEach(id => document.getElementById(id).classList.add("hidden"));
    document.getElementById(modalId).classList.remove("hidden");
    document.getElementById(modalId).classList.add("flex");
  },

  closeModals() {
    document.getElementById("modal-container").classList.add("hidden");
  },

  openModalHermanos() {
    // Cargar select de parejas (solo solteros o no vinculados)
    const selectPareja = document.getElementById("pareja-hermano");
    selectPareja.innerHTML = '<option value="">Soltero / Sin registrar cónyuge</option>' + 
      AppState.hermanos.filter(h => !h.parejaId).map(h => `<option value="${h.id}">${h.nombre} ${h.apellido} (${h.sexo})</option>`).join("");

    this.renderListaHermanos();
    this.openModal("modal-hermanos");
  },

  openModalGrupo() {
    this.toggleModoEquipo("manual");
    const container = document.getElementById("miembros-checkboxes");

    container.innerHTML = AppState.hermanos.map(h => `
      <label class="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded text-xs cursor-pointer text-slate-700">
        <input type="checkbox" value="${h.id}" onchange="UI.handleCheckboxMatrimonio(this, ${h.id})" class="chk-miembro rounded text-indigo-600">
        <span>${h.sexo === 'H' ? '♂' : '♀'} ${h.nombre} ${h.apellido} ${h.parejaId ? '💍' : ''}</span>
      </label>
    `).join("") || '<p class="text-xs text-slate-400 p-2">Registra hermanos primero.</p>';

    this.openModal("modal-grupo");
  },

  // Si se selecciona un hermano en el checklist, marcar a su cónyuge automáticamente
  handleCheckboxMatrimonio(chk, hermanoId) {
    const hermano = AppState.hermanos.find(h => h.id === hermanoId);
    if (hermano && hermano.parejaId) {
      const chkPareja = document.querySelector(`.chk-miembro[value="${hermano.parejaId}"]`);
      if (chkPareja) chkPareja.checked = chk.checked;
    }
  },

  openModalCasas() {
    const select = document.getElementById("select-equipo-preparador");
    const equiposPrep = AppState.grupos.filter(g => g.tipo === 'preparacion');

    if (equiposPrep.length === 0) {
      alert("Primero debes crear un equipo de preparación.");
      return;
    }

    select.innerHTML = '<option value="">Selecciona un equipo...</option>' + 
      equiposPrep.map(g => `<option value="${g.id}">${g.nombre} (${g.miembros.length} integrantes)</option>`).join("");

    this.openModal("modal-casas");
  },

  toggleModoEquipo(modo) {
    modoCreacionEquipo = modo;
    const btnManual = document.getElementById("tab-manual");
    const btnAuto = document.getElementById("tab-auto");
    const secManual = document.getElementById("sec-equipo-manual");
    const secAuto = document.getElementById("sec-equipo-auto");

    if (modo === "manual") {
      btnManual.className = "px-3 py-1 rounded bg-white text-indigo-600 shadow-sm";
      btnAuto.className = "px-3 py-1 rounded text-slate-600";
      secManual.classList.remove("hidden");
      secAuto.classList.add("hidden");
    } else {
      btnAuto.className = "px-3 py-1 rounded bg-white text-indigo-600 shadow-sm";
      btnManual.className = "px-3 py-1 rounded text-slate-600";
      secAuto.classList.remove("hidden");
      secManual.classList.add("hidden");

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

  // Guardar Hermano + Matrimonio
  document.getElementById("form-hermano").addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = document.getElementById("nombre-hermano").value.trim();
    const apellido = document.getElementById("apellido-hermano").value.trim();
    const sexo = document.getElementById("sexo-hermano").value;
    const parejaId = Number(document.getElementById("pareja-hermano").value) || null;

    const nuevoId = Date.now();
    const nuevoHermano = { id: nuevoId, nombre, apellido, sexo, parejaId };

    AppState.hermanos.push(nuevoHermano);

    // Si se le seleccionó cónyuge, vincularlo mutuamente
    if (parejaId) {
      const cónyuge = AppState.hermanos.find(h => h.id === parejaId);
      if (cónyuge) cónyuge.parejaId = nuevoId;
    }

    AppState.save();
    UI.renderAll();
    UI.openModalHermanos(); // Recargar el modal
  });

  // Guardar Grupo (Respetando Matrimonios en la versión Aleatoria)
  document.getElementById("form-grupo").addEventListener("submit", (e) => {
    e.preventDefault();
    let miembrosSeleccionados = [];

    if (modoCreacionEquipo === "manual") {
      const selectedIds = Array.from(e.target.querySelectorAll(".chk-miembro:checked")).map(cb => Number(cb.value));
      miembrosSeleccionados = AppState.hermanos.filter(h => selectedIds.includes(h.id));
    } else {
      // Aleatorio
      const asignadosIds = new Set(AppState.grupos.flatMap(g => g.miembros.map(m => m.id)));
      let disponibles = AppState.hermanos.filter(h => !asignadosIds.has(h.id));

      const cantidad = Number(document.getElementById("cant-aleatorios").value);
      disponibles = [...disponibles].sort(() => 0.5 - Math.random());

      for (let h of disponibles) {
        if (miembrosSeleccionados.some(m => m.id === h.id)) continue;

        miembrosSeleccionados.push(h);
        // Si está casado, agregar a su pareja aunque sobrepase levemente el número deseado
        if (h.parejaId) {
          const pareja = disponibles.find(p => p.id === h.parejaId);
          if (pareja && !miembrosSeleccionados.some(m => m.id === pareja.id)) {
            miembrosSeleccionados.push(pareja);
          }
        }

        if (miembrosSeleccionados.length >= cantidad) break;
      }
    }

    if (miembrosSeleccionados.length === 0) {
      alert("Selecciona al menos un integrante.");
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

  // Generar Celebración por las Casas
  document.getElementById("form-casas").addEventListener("submit", (e) => {
    e.preventDefault();
    const grupoId = Number(document.getElementById("select-equipo-preparador").value);
    const equipo = AppState.grupos.find(g => g.id === grupoId);

    if (!equipo) return;

    // 1. Cada integrante del equipo preparador liderará una casa (esposos separados en distintas casas)
    const preparadores = equipo.miembros;
    const idsPreparadores = new Set(preparadores.map(p => p.id));

    // 2. Resto de la comunidad celebrante
    let restoComunidad = AppState.hermanos.filter(h => !idsPreparadores.has(h.id));
    // Mezclar la comunidad al azar
    restoComunidad = [...restoComunidad].sort(() => 0.5 - Math.random());

    // 3. Crear las casas
    const casas = preparadores.map(p => ({
      responsable: p,
      asistentes: []
    }));

    // 4. Distribuir el resto equitativamente
    restoComunidad.forEach((hermano, index) => {
      const casaIndex = index % casas.length;
      casas[casaIndex].asistentes.push(hermano);
    });

    AppState.casas = casas;
    AppState.save();
    UI.renderAll();
    UI.closeModals();
  });
});
