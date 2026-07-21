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

// --- SERVICIO DE ALMACENAMIENTO ---
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
    downloadAnchor.setAttribute("download", `comunidad5_backup_${new Date().toISOString().split("T")[0]}.json`);
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
          alert("¡Base de datos de COMUNIDAD #5 importada con éxito!");
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

// --- INTERFAZ DE USUARIO ---
let modoCreacionEquipo = "manual";
let activeTab = "dashboard";

const UI = {
  renderAll() {
    this.renderStats();
    this.renderGrupos();
    this.renderListaHermanos();
    this.renderCasas();
    this.renderDashboardSummary();
    this.renderAnalytics();
    lucide.createIcons();
  },

  switchTab(tabId) {
    activeTab = tabId;
    document.querySelectorAll(".tab-view").forEach(v => v.classList.add("hidden"));
    
    document.querySelectorAll("nav button").forEach(btn => {
      btn.className = "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-slate-400 hover:bg-slate-800";
    });

    const activeNav = document.getElementById(`nav-${tabId}`);
    if (activeNav) {
      activeNav.className = "w-full flex items-center gap-3 px-3 py-2.5 bg-indigo-600/10 text-indigo-400 rounded-lg font-bold";
    }

    const titleMap = {
      dashboard: "Panel Principal",
      equipos: "Equipos de la Comunidad",
      casas: "Celebración por las Casas",
      analytics: "Estadísticas & Insights"
    };
    document.getElementById("tab-title").textContent = titleMap[tabId] || "Panel Principal";

    document.getElementById(`view-${tabId}`).classList.remove("hidden");
    this.renderAll();
  },

  renderStats() {
    const total = AppState.hermanos.length;
    const hombres = AppState.hermanos.filter(h => h.sexo === 'H').length;
    const mujeres = AppState.hermanos.filter(h => h.sexo === 'M').length;
    
    const parejased = new Set();
    AppState.hermanos.forEach(h => {
      if (h.parejaId) parejased.add([h.id, h.parejaId].sort().join('-'));
    });

    const asignadosOrdinarios = new Set(
      AppState.grupos
        .filter(g => g.tipo !== 'eucaristia')
        .flatMap(g => g.miembros.map(m => m.id))
    );
    const disponiblesCount = AppState.hermanos.filter(h => !asignadosOrdinarios.has(h.id)).length;

    document.getElementById("stat-total").textContent = total;
    document.getElementById("stat-hombres").textContent = `${hombres} ♂`;
    document.getElementById("stat-mujeres").textContent = `${mujeres} ♀`;
    document.getElementById("stat-matrimonios").textContent = parejased.size;
    document.getElementById("stat-disponibles").textContent = disponiblesCount;
  },

  renderDashboardSummary() {
    const sumEquipos = document.getElementById("dash-summary-equipos");
    const sumCasas = document.getElementById("dash-summary-casas");

    if (AppState.grupos.length === 0) {
      sumEquipos.innerHTML = `<p class="text-xs text-slate-400 py-3 text-center">No hay equipos creados.</p>`;
    } else {
      sumEquipos.innerHTML = AppState.grupos.slice(-3).map(g => {
        const estadoLabel = g.estado === 'preparado' ? '🟢 Preparado' : g.estado === 'proceso' ? '🟡 En proceso' : '⚪ Pendiente';
        return `
          <div class="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <div>
              <div class="flex items-center gap-1">
                <span class="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${g.tipo === 'eucaristia' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-50 text-indigo-700'}">${g.tipo}</span>
                <span class="text-[10px] text-slate-500 font-medium">${estadoLabel}</span>
              </div>
              <p class="text-xs font-bold text-slate-800 mt-1">${g.nombre}</p>
            </div>
            <span class="text-xs text-slate-500">${g.miembros.length} integrantes</span>
          </div>
        `;
      }).join("");
    }

    if (AppState.casas.length === 0) {
      sumCasas.innerHTML = `<p class="text-xs text-slate-400 py-3 text-center">No hay casas divididas actualmente.</p>`;
    } else {
      sumCasas.innerHTML = AppState.casas.map((c, i) => `
        <div class="flex justify-between items-center p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-100">
          <div>
            <p class="text-xs font-bold text-emerald-900">Casa N° ${i + 1} (Resp: ${c.responsable.nombre})</p>
          </div>
          <span class="text-xs font-bold text-emerald-700">${c.asistentes.length + 1} pers.</span>
        </div>
      `).join("");
    }
  },

  renderGrupos() {
    const container = document.getElementById("grid-grupos");

    if (AppState.grupos.length === 0) {
      container.innerHTML = `<div class="col-span-full text-center text-slate-400 py-8 border border-dashed rounded-xl">Sin equipos configurados.</div>`;
      return;
    }

    container.innerHTML = AppState.grupos.map(g => {
      const isEucaristia = g.tipo === 'eucaristia';
      const badgeStyle = isEucaristia 
        ? 'bg-amber-100 text-amber-800 border-amber-200' 
        : 'bg-indigo-50 text-indigo-700 border-indigo-100';

      const estadoBadge = g.estado === 'preparado' 
        ? '<span class="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">🟢 Listo</span>'
        : g.estado === 'proceso'
        ? '<span class="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">🟡 En Prep.</span>'
        : '<span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">⚪ Pendiente</span>';

      return `
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3 relative">
          <div class="flex justify-between items-start">
            <div>
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${badgeStyle}">${g.tipo}</span>
                ${estadoBadge}
              </div>
              <h4 class="font-bold text-slate-900 text-sm mt-1.5">${g.nombre}</h4>
            </div>
            <div class="flex items-center gap-1">
              <button onclick="UI.openModalEditarGrupo(${g.id})" class="text-slate-400 hover:text-indigo-600 p-1" title="Editar Equipo">
                <i data-lucide="pencil" class="w-4 h-4"></i>
              </button>
              <button onclick="UI.eliminarGrupo(${g.id})" class="text-slate-300 hover:text-rose-600 p-1" title="Disolver Equipo">
                <i data-lucide="x-circle" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <!-- DETALLES LITÚRGICOS -->
          ${(g.palabra || g.tema || g.personaje) ? `
            <div class="bg-slate-50 p-2 rounded-lg text-xs space-y-0.5 border border-slate-100">
              ${g.palabra ? `<p class="text-slate-600"><strong class="text-slate-800">📖 Palabra:</strong> ${g.palabra}</p>` : ''}
              ${g.tema ? `<p class="text-slate-600"><strong class="text-slate-800">💡 Tema:</strong> ${g.tema}</p>` : ''}
              ${g.personaje ? `<p class="text-slate-600"><strong class="text-slate-800">👤 Personaje:</strong> ${g.personaje}</p>` : ''}
            </div>
          ` : ''}

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
      `;
    }).join("");

    lucide.createIcons();
  },

  renderAnalytics() {
    const preparados = AppState.grupos.filter(g => g.estado === 'preparado').length;
    const enProceso = AppState.grupos.filter(g => g.estado === 'proceso').length;
    const pendientes = AppState.grupos.filter(g => g.estado === 'pendiente' || !g.estado).length;

    document.getElementById("stat-prep-completadas").textContent = preparados;
    document.getElementById("stat-prep-enproceso").textContent = enProceso;
    document.getElementById("stat-prep-pendientes").textContent = pendientes;

    // Conteo de participaciones por hermano
    const contadorHermanos = {};
    AppState.hermanos.forEach(h => contadorHermanos[h.id] = { ...h, cantidad: 0 });

    // Conteo de dúos/parejas que salen juntos
    const contadorDuos = {};

    AppState.grupos.forEach(g => {
      // Sumar participación
      g.miembros.forEach(m => {
        if (contadorHermanos[m.id]) {
          contadorHermanos[m.id].cantidad += 1;
        }
      });

      // Evaluar combinaciones en el equipo
      const miembros = g.miembros;
      for (let i = 0; i < miembros.length; i++) {
        for (let j = i + 1; j < miembros.length; j++) {
          const idA = miembros[i].id;
          const idB = miembros[j].id;
          const key = [idA, idB].sort((a, b) => a - b).join("-");

          if (!contadorDuos[key]) {
            contadorDuos[key] = {
              h1: miembros[i],
              h2: miembros[j],
              veces: 0
            };
          }
          contadorDuos[key].veces += 1;
        }
      }
    });

    // Ranking de Hermanos
    const listaRanking = Object.values(contadorHermanos).sort((a, b) => b.cantidad - a.cantidad);
    const topHermano = listaRanking[0];

    document.getElementById("stat-top-hermano").textContent = topHermano && topHermano.cantidad > 0 
      ? `${topHermano.nombre} (${topHermano.cantidad} prep.)` 
      : 'Sin registro';

    const rankingContainer = document.getElementById("analytics-ranking-hermanos");
    if (listaRanking.length === 0) {
      rankingContainer.innerHTML = `<p class="text-xs text-slate-400">Sin datos de participación.</p>`;
    } else {
      rankingContainer.innerHTML = listaRanking.map(h => `
        <div class="flex justify-between items-center p-2 bg-slate-50 rounded-lg text-xs">
          <span class="font-bold text-slate-800">${h.sexo === 'H' ? '♂' : '♀'} ${h.nombre} ${h.apellido}</span>
          <span class="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-bold">${h.cantidad} veces</span>
        </div>
      `).join("");
    }

    // Ranking de Dúos Frecuentes
    const listaDuos = Object.values(contadorDuos).sort((a, b) => b.veces - a.veces).filter(d => d.veces > 1);
    const duosContainer = document.getElementById("analytics-duos-frecuentes");

    if (listaDuos.length === 0) {
      duosContainer.innerHTML = `<p class="text-xs text-slate-400">Aún no hay hermanos coincidiendo más de 1 vez en grupos.</p>`;
    } else {
      duosContainer.innerHTML = listaDuos.map(d => `
        <div class="flex justify-between items-center p-2 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs">
          <span class="font-medium text-slate-800">${d.h1.nombre} & ${d.h2.nombre}</span>
          <span class="bg-indigo-600 text-white px-2 py-0.5 rounded font-bold">${d.veces} coincidencias</span>
        </div>
      `).join("");
    }

    // Histórico: Palabras, Temas y Personajes
    const palabras = AppState.grupos.map(g => g.palabra).filter(Boolean);
    const temas = AppState.grupos.map(g => g.tema).filter(Boolean);
    const personajes = AppState.grupos.map(g => g.personaje).filter(Boolean);

    document.getElementById("list-analytics-palabras").innerHTML = palabras.length 
      ? palabras.map(p => `<li class="border-b border-slate-100 pb-0.5">• ${p}</li>`).join("")
      : '<li class="text-slate-400">Ninguna palabra registrada</li>';

    document.getElementById("list-analytics-temas").innerHTML = temas.length 
      ? temas.map(t => `<li class="border-b border-slate-100 pb-0.5">• ${t}</li>`).join("")
      : '<li class="text-slate-400">Ningún tema registrado</li>';

    document.getElementById("list-analytics-personajes").innerHTML = personajes.length 
      ? personajes.map(p => `<li class="border-b border-slate-100 pb-0.5">• ${p}</li>`).join("")
      : '<li class="text-slate-400">Ningún personaje registrado</li>';
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
      return `
        <div class="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold ${h.sexo === 'H' ? 'text-blue-600' : 'text-pink-600'}">${h.sexo === 'H' ? '♂' : '♀'}</span>
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

  renderCasas() {
    const container = document.getElementById("grid-casas");

    if (AppState.casas.length === 0) {
      container.innerHTML = `<div class="col-span-full text-center text-slate-400 py-8 border border-dashed rounded-xl">No hay distribución de casas.</div>`;
      return;
    }

    container.innerHTML = AppState.casas.map((casa, idx) => `
      <div class="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 space-y-2">
        <div class="flex justify-between items-center">
          <h4 class="font-bold text-emerald-900 text-sm">Casa N° ${idx + 1}</h4>
          <span class="text-[10px] bg-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded-full">${casa.asistentes.length + 1} Hermanos</span>
        </div>
        
        <div class="bg-white p-2 rounded-lg border border-emerald-100">
          <p class="text-[10px] uppercase font-bold text-emerald-700">Responsable:</p>
          <p class="text-xs font-bold text-slate-800">${casa.responsable.sexo === 'H' ? '♂' : '♀'} ${casa.responsable.nombre} ${casa.responsable.apellido}</p>
        </div>

        <div>
          <p class="text-[10px] uppercase font-bold text-slate-500 mb-1">Acompañan:</p>
          <div class="space-y-1 max-h-36 overflow-y-auto pr-1">
            ${casa.asistentes.map(a => `
              <div class="text-xs bg-white/80 p-1.5 rounded border border-emerald-100 text-slate-700">
                ${a.sexo === 'H' ? '♂' : '♀'} ${a.nombre} ${a.apellido}
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
    const selectPareja = document.getElementById("pareja-hermano");
    selectPareja.innerHTML = '<option value="">Soltero / Sin registrar cónyuge</option>' + 
      AppState.hermanos.filter(h => !h.parejaId).map(h => `<option value="${h.id}">${h.nombre} ${h.apellido} (${h.sexo})</option>`).join("");

    this.renderListaHermanos();
    this.openModal("modal-hermanos");
  },

  openModalGrupo() {
    document.getElementById("edit-grupo-id").value = "";
    document.getElementById("modal-grupo-title").textContent = "Crear Equipo";
    document.getElementById("btn-guardar-grupo").textContent = "Crear Equipo";
    document.getElementById("sec-grupo-modos").classList.remove("hidden");
    
    document.getElementById("nombre-grupo").value = "";
    document.getElementById("estado-grupo").value = "pendiente";
    document.getElementById("palabra-grupo").value = "";
    document.getElementById("tema-grupo").value = "";
    document.getElementById("personaje-grupo").value = "";

    this.toggleModoEquipo("manual");
    this.renderCheckboxesMiembros();
    this.openModal("modal-grupo");
  },

  openModalEditarGrupo(grupoId) {
    const grupo = AppState.grupos.find(g => g.id === grupoId);
    if (!grupo) return;

    document.getElementById("edit-grupo-id").value = grupo.id;
    document.getElementById("modal-grupo-title").textContent = "Editar Equipo";
    document.getElementById("btn-guardar-grupo").textContent = "Guardar Cambios";
    
    document.getElementById("nombre-grupo").value = grupo.nombre;
    document.getElementById("tipo-grupo").value = grupo.tipo;
    document.getElementById("estado-grupo").value = grupo.estado || "pendiente";
    document.getElementById("palabra-grupo").value = grupo.palabra || "";
    document.getElementById("tema-grupo").value = grupo.tema || "";
    document.getElementById("personaje-grupo").value = grupo.personaje || "";

    document.getElementById("sec-grupo-modos").classList.add("hidden");

    this.openModal("modal-grupo");
  },

  renderCheckboxesMiembros() {
    const container = document.getElementById("miembros-checkboxes");
    container.innerHTML = AppState.hermanos.map(h => `
      <label class="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded text-xs cursor-pointer text-slate-700">
        <input type="checkbox" value="${h.id}" onchange="UI.handleCheckboxMatrimonio(this, ${h.id})" class="chk-miembro rounded text-indigo-600">
        <span>${h.sexo === 'H' ? '♂' : '♀'} ${h.nombre} ${h.apellido} ${h.parejaId ? '💍' : ''}</span>
      </label>
    `).join("") || '<p class="text-xs text-slate-400 p-2">Registra hermanos primero.</p>';
  },

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

      const asignadosOrdinarios = new Set(
        AppState.grupos
          .filter(g => g.tipo !== 'eucaristia')
          .flatMap(g => g.miembros.map(m => m.id))
      );
      const disponibles = AppState.hermanos.filter(h => !asignadosOrdinarios.has(h.id));
      document.getElementById("cant-disponibles").textContent = disponibles.length;
    }
  }
};

// --- EVENT LISTENERS ---
document.addEventListener("DOMContentLoaded", () => {
  AppState.init();
  UI.switchTab("dashboard");

  // Guardar Hermano
  document.getElementById("form-hermano").addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = document.getElementById("nombre-hermano").value.trim();
    const apellido = document.getElementById("apellido-hermano").value.trim();
    const sexo = document.getElementById("sexo-hermano").value;
    const parejaId = Number(document.getElementById("pareja-hermano").value) || null;

    const nuevoId = Date.now();
    const nuevoHermano = { id: nuevoId, nombre, apellido, sexo, parejaId };

    AppState.hermanos.push(nuevoHermano);

    if (parejaId) {
      const cónyuge = AppState.hermanos.find(h => h.id === parejaId);
      if (cónyuge) cónyuge.parejaId = nuevoId;
    }

    AppState.save();
    UI.renderAll();
    UI.openModalHermanos();
  });

  // Guardar o Editar Equipo
  document.getElementById("form-grupo").addEventListener("submit", (e) => {
    e.preventDefault();

    const editId = Number(document.getElementById("edit-grupo-id").value);
    const nombre = document.getElementById("nombre-grupo").value.trim();
    const tipo = document.getElementById("tipo-grupo").value;
    const estado = document.getElementById("estado-grupo").value;
    const palabra = document.getElementById("palabra-grupo").value.trim();
    const tema = document.getElementById("tema-grupo").value.trim();
    const personaje = document.getElementById("personaje-grupo").value.trim();

    // MODO EDICIÓN
    if (editId) {
      const grupo = AppState.grupos.find(g => g.id === editId);
      if (grupo) {
        grupo.nombre = nombre;
        grupo.tipo = tipo;
        grupo.estado = estado;
        grupo.palabra = palabra;
        grupo.tema = tema;
        grupo.personaje = personaje;
      }
      AppState.save();
      UI.renderAll();
      UI.closeModals();
      return;
    }

    // MODO CREACIÓN
    if (modoCreacionEquipo === "manual") {
      const selectedIds = Array.from(e.target.querySelectorAll(".chk-miembro:checked")).map(cb => Number(cb.value));
      const miembrosSeleccionados = AppState.hermanos.filter(h => selectedIds.includes(h.id));

      if (miembrosSeleccionados.length === 0) {
        alert("Selecciona al menos un integrante.");
        return;
      }

      AppState.grupos.push({
        id: Date.now(),
        nombre,
        tipo,
        estado,
        palabra,
        tema,
        personaje,
        miembros: miembrosSeleccionados
      });

    } else {
      // SORTEO ALEATORIO EQUITATIVO
      const numEquipos = Number(document.getElementById("cant-equipos-auto").value);
      if (numEquipos < 2) {
        alert("Ingresa al menos 2 equipos para realizar el sorteo.");
        return;
      }

      const asignadosOrdinarios = new Set(
        AppState.grupos
          .filter(g => g.tipo !== 'eucaristia')
          .flatMap(g => g.miembros.map(m => m.id))
      );
      let disponibles = AppState.hermanos.filter(h => !asignadosOrdinarios.has(h.id));

      if (disponibles.length === 0) {
        alert("No hay hermanos disponibles sin equipo.");
        return;
      }

      const unidades = [];
      const procesados = new Set();

      disponibles.forEach(h => {
        if (procesados.has(h.id)) return;

        if (h.parejaId) {
          const pareja = disponibles.find(p => p.id === h.parejaId);
          if (pareja) {
            unidades.push([h, pareja]);
            procesados.add(h.id);
            procesados.add(pareja.id);
            return;
          }
        }

        unidades.push([h]);
        procesados.add(h.id);
      });

      for (let i = unidades.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [unidades[i], unidades[j]] = [unidades[j], unidades[i]];
      }

      const nuevosEquipos = Array.from({ length: numEquipos }, (_, i) => ({
        id: Date.now() + i,
        nombre: `${nombre} - Subgrupo ${i + 1}`,
        tipo,
        estado,
        palabra,
        tema,
        personaje,
        miembros: []
      }));

      unidades.forEach(unidad => {
        nuevosEquipos.sort((a, b) => a.miembros.length - b.miembros.length);
        nuevosEquipos[0].miembros.push(...unidad);
      });

      AppState.grupos.push(...nuevosEquipos);
    }

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

    const preparadores = equipo.miembros;
    const idsPreparadores = new Set(preparadores.map(p => p.id));

    let restoComunidad = AppState.hermanos.filter(h => !idsPreparadores.has(h.id));
    restoComunidad = [...restoComunidad].sort(() => 0.5 - Math.random());

    const casas = preparadores.map(p => ({
      responsable: p,
      asistentes: []
    }));

    restoComunidad.forEach((hermano, index) => {
      const casaIndex = index % casas.length;
      casas[casaIndex].asistentes.push(hermano);
    });

    AppState.casas = casas;
    AppState.save();
    UI.renderAll();
    UI.closeModals();
    UI.switchTab("casas");
  });
});
