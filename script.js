// --- ESTADO Y BASE DE DATOS GLOBAL ---
const ROLES = {
  RESPONSABLE: 'Responsable',
  CO_RESPONSABLE: 'Co-responsable',
  SACERDOTE: 'Sacerdote',
  SEMINARISTA: 'Seminarista',
  HERMANO: 'Hermano'
};

let integrantesComunidad = [
  { id: 1, nombre: 'Juan Pérez', esMatrimonio: true, parejaId: 2, rol: ROLES.RESPONSABLE },
  { id: 2, nombre: 'María de Pérez', esMatrimonio: true, parejaId: 1, rol: ROLES.RESPONSABLE },
  { id: 3, nombre: 'Carlos Ruiz', esMatrimonio: false, parejaId: null, rol: ROLES.CO_RESPONSABLE },
  { id: 4, nombre: 'P. Fernando', esMatrimonio: false, parejaId: null, rol: ROLES.SACERDOTE },
  { id: 5, nombre: 'Luis Morales', esMatrimonio: false, parejaId: null, rol: ROLES.SEMINARISTA },
  { id: 6, nombre: 'Ana Gómez', esMatrimonio: false, parejaId: null, rol: ROLES.HERMANO }
];

let gruposGenerados = [];
let historialPreparaciones = [];

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
  renderizarTablaHermanos();
  actualizarSelectsGrupo();
  renderizarGrupos();
  renderizarHistorial();
  actualizarEstadisticas();
});

// --- NAVEGACIÓN LIMPIA ---
function cambiarPestana(tabId, event) {
  if (event) event.preventDefault();

  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-link').forEach(el => {
    el.classList.remove('bg-indigo-600', 'text-white', 'shadow-md');
    el.classList.add('text-slate-400');
  });

  const target = document.getElementById(tabId);
  if (target) target.classList.remove('hidden');

  const link = document.getElementById(`link-${tabId}`);
  if (link) {
    link.classList.add('bg-indigo-600', 'text-white', 'shadow-md');
    link.classList.remove('text-slate-400');
  }

  // Refrescar vistas que dependen de datos actualizados
  if (tabId === 'grupos' || tabId === 'preparacion') actualizarSelectsGrupo();
  if (tabId === 'estadisticas') actualizarEstadisticas();
}

// ==========================================
// PESTAÑA 1: PADRÓN DE INTEGRANTES (HERMANOS)
// ==========================================
function renderizarTablaHermanos() {
  const tbody = document.getElementById('tabla-hermanos');
  tbody.innerHTML = '';

  integrantesComunidad.forEach(h => {
    let parejaTexto = 'Soltero/a';
    if (h.esMatrimonio && h.parejaId) {
      const pareja = integrantesComunidad.find(p => p.id === h.parejaId);
      parejaTexto = pareja ? `Casado/a con ${pareja.nombre}` : 'Casado/a';
    }

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition">
        <td class="p-3.5 font-semibold text-slate-800">${h.nombre}</td>
        <td class="p-3.5"><span class="badge badge-indigo">${h.rol}</span></td>
        <td class="p-3.5 text-xs text-slate-500">${parejaTexto}</td>
        <td class="p-3.5 text-right space-x-1">
          <button onclick="editarHermano(${h.id})" class="text-xs bg-slate-100 hover:bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg transition"><i class="fa-solid fa-pen"></i></button>
          <button onclick="eliminarHermano(${h.id})" class="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1 rounded-lg transition"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `;
  });

  actualizarSelectParejas();
}

function actualizarSelectParejas() {
  const select = document.getElementById('hermano-pareja');
  const idActual = parseInt(document.getElementById('hermano-id').value);
  select.innerHTML = '<option value="">-- Seleccionar Cónyuge --</option>';

  integrantesComunidad.forEach(h => {
    if (h.id !== idActual) {
      select.innerHTML += `<option value="${h.id}">${h.nombre}</option>`;
    }
  });
}

function toggleSelectPareja() {
  const check = document.getElementById('hermano-es-matrimonio').checked;
  document.getElementById('container-pareja').classList.toggle('hidden', !check);
}

function guardarHermano(e) {
  e.preventDefault();
  const id = document.getElementById('hermano-id').value;
  const nombre = document.getElementById('hermano-nombre').value.trim();
  const rol = document.getElementById('hermano-rol').value;
  const esMatrimonio = document.getElementById('hermano-es-matrimonio').checked;
  const parejaId = esMatrimonio ? parseInt(document.getElementById('hermano-pareja').value) || null : null;

  if (id) {
    const hermano = integrantesComunidad.find(h => h.id === parseInt(id));
    if (hermano) {
      hermano.nombre = nombre;
      hermano.rol = rol;
      hermano.esMatrimonio = esMatrimonio;
      hermano.parejaId = parejaId;
    }
  } else {
    integrantesComunidad.push({ id: Date.now(), nombre, rol, esMatrimonio, parejaId });
  }

  cancelarEdicionHermano();
  renderizarTablaHermanos();
  actualizarSelectsGrupo();
  actualizarEstadisticas();
}

function editarHermano(id) {
  const h = integrantesComunidad.find(item => item.id === id);
  if (!h) return;

  document.getElementById('hermano-id').value = h.id;
  document.getElementById('hermano-nombre').value = h.nombre;
  document.getElementById('hermano-rol').value = h.rol;
  document.getElementById('hermano-es-matrimonio').checked = h.esMatrimonio;
  
  toggleSelectPareja();
  actualizarSelectParejas();
  if (h.parejaId) document.getElementById('hermano-pareja').value = h.parejaId;

  document.getElementById('form-hermano-title').textContent = 'Editar Hermano';
  document.getElementById('btn-cancelar-hermano').classList.remove('hidden');
}

function cancelarEdicionHermano() {
  document.getElementById('form-hermano').reset();
  document.getElementById('hermano-id').value = '';
  document.getElementById('form-hermano-title').textContent = 'Agregar Nuevo Hermano';
  document.getElementById('btn-cancelar-hermano').classList.add('hidden');
  document.getElementById('container-pareja').classList.add('hidden');
}

function eliminarHermano(id) {
  if (confirm('¿Eliminar a este hermano del padrón?')) {
    integrantesComunidad = integrantesComunidad.filter(h => h.id !== id);
    renderizarTablaHermanos();
    actualizarSelectsGrupo();
    actualizarEstadisticas();
  }
}

function exportarJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(integrantesComunidad, null, 2));
  const dl = document.createElement('a');
  dl.setAttribute("href", dataStr);
  dl.setAttribute("download", "padrón_comunidad.json");
  dl.click();
  dl.remove();
}

function importarJSON(e) {
  const reader = new FileReader();
  reader.onload = function (evt) {
    try {
      const data = JSON.parse(evt.target.result);
      if (Array.isArray(data)) {
        integrantesComunidad = data;
        renderizarTablaHermanos();
        actualizarSelectsGrupo();
        actualizarEstadisticas();
        alert('Padrón importado con éxito.');
      }
    } catch (err) {
      alert('Error en el formato del JSON.');
    }
  };
  reader.readAsText(e.target.files[0]);
}

// ==========================================
// PESTAÑA 2: ESTRUCTURACIÓN DE GRUPOS (CORREGIDA)
// ==========================================

function generarGruposAzar() {
  const prefijoInput = document.getElementById('azar-prefijo');
  const cantidadInput = document.getElementById('azar-cantidad');

  const prefijo = prefijoInput ? prefijoInput.value.trim() : 'Equipo';
  const numGrupos = cantidadInput ? parseInt(cantidadInput.value) : 3;

  if (!integrantesComunidad || integrantesComunidad.length === 0) {
    alert('No hay integrantes en la comunidad para armar grupos.');
    return;
  }

  // Copia y mezcla aleatoria del padrón
  const mezcla = [...integrantesComunidad].sort(() => Math.random() - 0.5);
  gruposGenerados = [];

  // 1. Inicializar estructuras de grupo
  const limiteGrupos = Math.min(numGrupos, mezcla.length);
  for (let i = 0; i < limiteGrupos; i++) {
    gruposGenerados.push({
      id: Date.now() + i,
      nombre: `${prefijo} ${i + 1}`,
      estado: 'Sin Empezar',
      integrantes: []
    });
  }

  // 2. Repartir hermanos equitativamente
  mezcla.forEach((persona, index) => {
    const grupoDestino = gruposGenerados[index % limiteGrupos];
    grupoDestino.integrantes.push({...persona});
  });

  // 3. Renderizar y sincronizar con los desplegables
  renderizarGrupos();
  actualizarSelectsGrupo();
}

function generarGruposCasas() {
  if (!historialPreparaciones || historialPreparaciones.length === 0) {
    alert('Para dividir por Casas necesitas al menos 1 preparación previa guardada.');
    return;
  }

  const ultimaPrep = historialPreparaciones[historialPreparaciones.length - 1];
  const guias = ultimaPrep.integrantes || [];

  if (guias.length === 0) {
    alert('La última preparación no tiene integrantes registrados.');
    return;
  }

  const guiasIds = new Set(guias.map(g => g.id));
  const resto = integrantesComunidad.filter(h => !guiasIds.has(h.id));
  const mezclaResto = [...resto].sort(() => Math.random() - 0.5);

  gruposGenerados = guias.map((guia, i) => ({
    id: Date.now() + i,
    nombre: `Casa ${i + 1} (${guia.nombre})`,
    estado: 'Preparando',
    integrantes: [{...guia}]
  }));

  mezclaResto.forEach((persona, index) => {
    const grupoDestino = gruposGenerados[index % gruposGenerados.length];
    grupoDestino.integrantes.push({...persona});
  });

  renderizarGrupos();
  actualizarSelectsGrupo();
}

function agregarHermanoAGrupoManual() {
  const selectGrupo = document.getElementById('select-grupo-destino');
  const selectHermano = document.getElementById('select-hermano-agregar');

  if (!selectGrupo || !selectHermano) return;

  const grupoId = parseInt(selectGrupo.value);
  const hermanoId = parseInt(selectHermano.value);

  if (!grupoId) return alert('Por favor selecciona un grupo destino.');
  if (!hermanoId) return alert('Por favor selecciona un hermano para añadir.');

  const grupo = gruposGenerados.find(g => g.id === grupoId);
  const hermano = integrantesComunidad.find(h => h.id === hermanoId);

  if (grupo && hermano) {
    // Validar si el hermano ya está en este grupo
    const yaExiste = grupo.integrantes.some(i => i.id === hermano.id);
    if (yaExiste) {
      alert(`${hermano.nombre} ya forma parte de ${grupo.nombre}.`);
      return;
    }

    grupo.integrantes.push({...hermano});
    renderizarGrupos();
    actualizarSelectsGrupo();
  }
}

function quitarIntegranteGrupo(grupoId, personaId) {
  const grupo = gruposGenerados.find(g => g.id === grupoId);
  if (grupo) {
    grupo.integrantes = grupo.integrantes.filter(p => p.id !== personaId);
    renderizarGrupos();
    actualizarSelectsGrupo();
  }
}

function cambiarEstadoGrupo(grupoId, nuevoEstado) {
  const grupo = gruposGenerados.find(g => g.id === grupoId);
  if (grupo) {
    grupo.estado = nuevoEstado;
    renderizarGrupos();
  }
}

function actualizarSelectsGrupo() {
  const selectDestino = document.getElementById('select-grupo-destino');
  const selectAgregar = document.getElementById('select-hermano-agregar');
  const selectPreparar = document.getElementById('select-grupo-preparar');

  if (selectDestino) {
    selectDestino.innerHTML = '<option value="">-- Grupo Destino --</option>';
    gruposGenerados.forEach(g => {
      selectDestino.innerHTML += `<option value="${g.id}">${g.nombre}</option>`;
    });
  }

  if (selectAgregar) {
    selectAgregar.innerHTML = '<option value="">-- Seleccionar Hermano --</option>';
    integrantesComunidad.forEach(h => {
      selectAgregar.innerHTML += `<option value="${h.id}">${h.nombre}</option>`;
    });
  }

  if (selectPreparar) {
    selectPreparar.innerHTML = '<option value="">-- Selecciona el Grupo que Preparará --</option>';
    gruposGenerados.forEach(g => {
      selectPreparar.innerHTML += `<option value="${g.id}">${g.nombre} (${g.integrantes.length} miembros)</option>`;
    });
  }
}

function renderizarGrupos() {
  const container = document.getElementById('contenedor-grupos');
  if (!container) return;

  container.innerHTML = '';

  if (gruposGenerados.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-10 bg-white rounded-2xl border border-dashed border-slate-300">
        <i class="fa-solid fa-users-slash text-3xl text-slate-300 mb-2"></i>
        <p class="text-slate-500 text-sm font-medium">No hay grupos creados.</p>
        <p class="text-xs text-slate-400">Genera grupos automáticos o añade personas manualmente.</p>
      </div>`;
    return;
  }

  gruposGenerados.forEach(g => {
    let estadoColor = 'bg-slate-100 text-slate-700';
    if (g.estado === 'Preparando') estadoColor = 'bg-amber-100 text-amber-800';
    if (g.estado === 'Preparado') estadoColor = 'bg-emerald-100 text-emerald-800';

    const miembrosHtml = g.integrantes.length > 0 
      ? g.integrantes.map(i => `
          <li class="flex justify-between items-center py-1.5 border-b border-slate-100 text-xs">
            <span class="font-medium text-slate-700">${i.nombre} <span class="text-[10px] text-slate-400">(${i.rol})</span></span>
            <button onclick="quitarIntegranteGrupo(${g.id}, ${i.id})" class="text-slate-300 hover:text-red-500 transition px-1" title="Quitar del grupo">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </li>
        `).join('')
      : '<li class="text-xs text-slate-400 italic py-2">Sin integrantes asignados</li>';

    container.innerHTML += `
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 flex flex-col justify-between">
        <div>
          <div class="flex justify-between items-center mb-3">
            <h4 class="font-bold text-slate-900 text-sm">${g.nombre}</h4>
            <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${estadoColor}">${g.estado}</span>
          </div>
          <ul class="mb-4 max-h-48 overflow-y-auto">${miembrosHtml}</ul>
        </div>

        <div class="pt-3 border-t border-slate-100">
          <select onchange="cambiarEstadoGrupo(${g.id}, this.value)" class="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2 outline-none">
            <option value="Sin Empezar" ${g.estado === 'Sin Empezar' ? 'selected' : ''}>Estado: Sin Empezar</option>
            <option value="Preparando" ${g.estado === 'Preparando' ? 'selected' : ''}>Estado: Preparando</option>
            <option value="Preparado" ${g.estado === 'Preparado' ? 'selected' : ''}>Estado: Preparado</option>
          </select>
        </div>
      </div>
    `;
  });
}

// ==========================================
// PESTAÑA 3: ASIGNAR PREPARACIÓN
// ==========================================
function actualizarModalidad() {
  const seleccion = document.querySelector('input[name="modalidad"]:checked').value;
  const label = document.getElementById('label-detalle');
  const input = document.getElementById('input-detalle');

  label.textContent = `Detalle / Cita del/de la ${seleccion}:`;
  if (seleccion === 'Tema') input.placeholder = 'Ej. La Lectura Creyente de la Realidad';
  if (seleccion === 'Palabra') input.placeholder = 'Ej. Éxodo 3, 1-14';
  if (seleccion === 'Personaje') input.placeholder = 'Ej. Moisés';
  if (seleccion === 'Eucaristía') input.placeholder = 'Ej. Ritos Iniciales y Monición Ambiental';
}

function registrarPreparacion(e) {
  e.preventDefault();

  const grupoId = parseInt(document.getElementById('select-grupo-preparar').value);
  if (!grupoId) return alert('Selecciona un grupo válido.');

  const grupo = gruposGenerados.find(g => g.id === grupoId);
  if (!grupo || grupo.integrantes.length === 0) return alert('El grupo seleccionado no tiene integrantes.');

  const modalidad = document.querySelector('input[name="modalidad"]:checked').value;
  const detalle = document.getElementById('input-detalle').value.trim();

  // Actualizar estado del grupo automáticamente a "Preparando"
  grupo.estado = 'Preparando';

  const nuevaPrep = {
    id: Date.now(),
    equipo: grupo.nombre,
    modalidad: modalidad,
    detalle: detalle,
    integrantes: [...grupo.integrantes],
    fecha: new Date().toLocaleDateString()
  };

  historialPreparaciones.push(nuevaPrep);
  
  document.getElementById('input-detalle').value = '';
  renderizarGrupos();
  renderizarHistorial();
  actualizarEstadisticas();

  alert(`¡Preparación de ${modalidad} asignada con éxito a ${grupo.nombre}!`);
}

// ==========================================
// PESTAÑA 4: HISTORIAL
// ==========================================
function renderizarHistorial() {
  const tbody = document.getElementById('tabla-historial');
  tbody.innerHTML = '';

  if (historialPreparaciones.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-slate-400 italic">No hay preparaciones registradas aún.</td></tr>';
    return;
  }

  historialPreparaciones.forEach(item => {
    const integrantesStr = item.integrantes.map(i => `<span class="font-medium text-slate-800">${i.nombre}</span>`).join(', ');

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition">
        <td class="p-4 font-bold text-indigo-600">${item.equipo}</td>
        <td class="p-4"><span class="badge badge-slate">${item.modalidad}</span></td>
        <td class="p-4 font-medium text-slate-700">${item.detalle}</td>
        <td class="p-4 text-xs text-slate-600 leading-relaxed">${integrantesStr}</td>
        <td class="p-4 text-xs text-slate-400">${item.fecha}</td>
      </tr>
    `;
  });
}

// ==========================================
// PESTAÑA 5: INSIGHTS Y ESTADÍSTICAS REACTIVAS
// ==========================================
function actualizarEstadisticas() {
  const total = historialPreparaciones.length;
  const temas = historialPreparaciones.filter(p => p.modalidad === 'Tema').length;
  const palabras = historialPreparaciones.filter(p => p.modalidad === 'Palabra').length;
  const personajesOEuc = historialPreparaciones.filter(p => p.modalidad === 'Personaje' || p.modalidad === 'Eucaristía').length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-temas').textContent = temas;
  document.getElementById('stat-palabras').textContent = palabras;
  document.getElementById('stat-personajes').textContent = personajesOEuc;

  const pct = (v) => total > 0 ? Math.round((v / total) * 100) : 0;

  // Gráfica de Modalidades
  document.getElementById('grafica-modalidades').innerHTML = `
    <div>
      <div class="flex justify-between text-xs font-semibold mb-1"><span>Temas Formativos</span><span>${temas} (${pct(temas)}%)</span></div>
      <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"><div class="bg-emerald-500 h-2.5" style="width: ${pct(temas)}%"></div></div>
    </div>
    <div>
      <div class="flex justify-between text-xs font-semibold mb-1"><span>Celebraciones de la Palabra</span><span>${palabras} (${pct(palabras)}%)</span></div>
      <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"><div class="bg-amber-500 h-2.5" style="width: ${pct(palabras)}%"></div></div>
    </div>
    <div>
      <div class="flex justify-between text-xs font-semibold mb-1"><span>Personajes / Eucaristías</span><span>${personajesOEuc} (${pct(personajesOEuc)}%)</span></div>
      <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"><div class="bg-purple-500 h-2.5" style="width: ${pct(personajesOEuc)}%"></div></div>
    </div>
  `;

  // Mapear convocatorias individuales reales
  const conteoHermano = {};
  integrantesComunidad.forEach(h => conteoHermano[h.nombre] = 0);

  let participacionesConMatrimonio = 0;

  historialPreparaciones.forEach(p => {
    let tieneMatrimonio = false;
    p.integrantes.forEach(i => {
      conteoHermano[i.nombre] = (conteoHermano[i.nombre] || 0) + 1;
      if (i.esMatrimonio) tieneMatrimonio = true;
    });
    if (tieneMatrimonio) participacionesConMatrimonio++;
  });

  // Convocatorias por Rol
  const conteoRoles = {};
  Object.values(ROLES).forEach(r => conteoRoles[r] = 0);

  historialPreparaciones.forEach(p => {
    p.integrantes.forEach(i => {
      conteoRoles[i.rol] = (conteoRoles[i.rol] || 0) + 1;
    });
  });

  const totalIntervenciones = Object.values(conteoRoles).reduce((a, b) => a + b, 0);
  document.getElementById('grafica-roles').innerHTML = Object.keys(conteoRoles).map(rol => {
    const count = conteoRoles[rol];
    const rolPct = totalIntervenciones > 0 ? Math.round((count / totalIntervenciones) * 100) : 0;
    return `
      <div>
        <div class="flex justify-between text-xs font-semibold mb-1"><span>${rol}</span><span>${count} convocatorias (${rolPct}%)</span></div>
        <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden"><div class="bg-indigo-600 h-2" style="width: ${rolPct}%"></div></div>
      </div>
    `;
  }).join('');

  // Estadísticas de Matrimonio
  document.getElementById('stat-matrimonios').innerHTML = `
    <p>Preparaciones con matrimonios: <strong>${participacionesConMatrimonio}</strong> de ${total}</p>
    <p>Tasa de integración matrimonial: <strong>${pct(participacionesConMatrimonio)}%</strong></p>
  `;

  // Rankings Individuales
  const ordenados = Object.entries(conteoHermano).sort((a, b) => b[1] - a[1]);

  document.getElementById('lista-mas-activos').innerHTML = ordenados.slice(0, 3).map(([nombre, count]) => `
    <li class="flex justify-between items-center"><span>${nombre}</span><span class="font-bold text-indigo-600">${count} preps</span></li>
  `).join('');

  document.getElementById('lista-menos-activos').innerHTML = ordenados.slice(-3).reverse().map(([nombre, count]) => `
    <li class="flex justify-between items-center"><span>${nombre}</span><span class="font-bold text-slate-400">${count} preps</span></li>
  `).join('');

  // Insight inteligente
  const insightEl = document.getElementById('insight-texto');
  if (total === 0) {
    insightEl.textContent = 'Aún no se registran preparaciones formales. Genera grupos y asígnales una preparación para activar el cálculo de insights.';
  } else {
    const masActivo = ordenados[0];
    const menosActivo = ordenados[ordenados.length - 1];
    insightEl.innerHTML = `
      Hasta el momento se han realizado <strong>${total} preparaciones</strong>. 
      El hermano más convocado es <strong class="text-indigo-300">${masActivo[0]}</strong> (${masActivo[1]} asignaciones), mientras que <strong class="text-indigo-300">${menosActivo[0]}</strong> tiene menor nivel de rotación (${menosActivo[1]} asignaciones).
      Se recomienda priorizar a los hermanos con 0 o 1 participación para los próximos grupos de trabajo.
    `;
  }
}
