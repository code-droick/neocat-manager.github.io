// --- BASE DE DATOS Y ESTADO GLOBAL ---
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

let historialPreparaciones = [];
let integrantesEquipoActual = [];
let gruposGenerados = [];

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
  renderizarTablaHermanos();
  cargarSelectIntegrantes();
  actualizarNumeroEquipo();
  renderizarTablaEquipo();
  renderizarHistorial();
  renderizarGrupos();
  actualizarEstadisticas();
});

// --- NAVEGACIÓN ---
function cambiarPestana(tabId, event) {
  if (event) event.preventDefault();
  
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));

  document.querySelectorAll('.nav-link').forEach(el => {
    el.classList.remove('bg-indigo-600', 'text-white', 'shadow-md');
    el.classList.add('text-slate-400');
  });

  const targetSection = document.getElementById(tabId);
  if (targetSection) targetSection.classList.remove('hidden');

  const linkId = `link-${tabId}`;
  const activeLink = document.getElementById(linkId);
  if (activeLink) {
    activeLink.classList.add('bg-indigo-600', 'text-white', 'shadow-md');
    activeLink.classList.remove('text-slate-400');
  }

  if (tabId === 'estadisticas') actualizarEstadisticas();
}

// --- PESTAÑA 1: GESTIÓN DE LA COMUNIDAD (HERMANOS / JSON) ---
function renderizarTablaHermanos() {
  const tbody = document.getElementById('tabla-hermanos');
  tbody.innerHTML = '';

  integrantesComunidad.forEach(h => {
    let parejaTexto = 'Soltero/a';
    if (h.esMatrimonio && h.parejaId) {
      const pareja = integrantesComunidad.find(p => p.id === h.parejaId);
      parejaTexto = pareja ? `Casado con ${pareja.nombre}` : 'Casado/a';
    }

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition">
        <td class="p-3.5 font-semibold text-slate-800">${h.nombre}</td>
        <td class="p-3.5"><span class="badge badge-indigo">${h.rol}</span></td>
        <td class="p-3.5 text-xs text-slate-500">${parejaTexto}</td>
        <td class="p-3.5 text-right space-x-1">
          <button onclick="editarHermano(${h.id})" class="text-xs bg-slate-100 hover:bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg transition"><i class="fa-solid fa-pen"></i> Editar</button>
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
    // Editar
    const hermano = integrantesComunidad.find(h => h.id === parseInt(id));
    if (hermano) {
      hermano.nombre = nombre;
      hermano.rol = rol;
      hermano.esMatrimonio = esMatrimonio;
      hermano.parejaId = parejaId;
    }
  } else {
    // Crear
    const nuevo = {
      id: Date.now(),
      nombre,
      rol,
      esMatrimonio,
      parejaId
    };
    integrantesComunidad.push(nuevo);
  }

  cancelarEdicionHermano();
  renderizarTablaHermanos();
  cargarSelectIntegrantes();
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
  if (confirm('¿Deseas eliminar a este hermano de la lista?')) {
    integrantesComunidad = integrantesComunidad.filter(h => h.id !== id);
    renderizarTablaHermanos();
    cargarSelectIntegrantes();
  }
}

// JSON Import / Export
function exportarJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(integrantesComunidad, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "comunidad_hermanos.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function importarJSON(e) {
  const fileReader = new FileReader();
  fileReader.onload = function (event) {
    try {
      const parsed = JSON.parse(event.target.result);
      if (Array.isArray(parsed)) {
        integrantesComunidad = parsed;
        renderizarTablaHermanos();
        cargarSelectIntegrantes();
        alert('Comunidad cargada correctamente desde JSON.');
      }
    } catch (err) {
      alert('Error al leer el archivo JSON.');
    }
  };
  fileReader.readAsText(e.target.files[0]);
}

// --- PESTAÑA 2: GESTIÓN DE GRUPOS & CELEBRACIONES POR LAS CASAS ---
function generarGruposAzar() {
  const tipo = document.getElementById('azar-tipo').value;
  const numGrupos = parseInt(document.getElementById('azar-cantidad').value) || 3;

  if (integrantesComunidad.length === 0) return alert('No hay integrantes registrados.');

  const mezclar = [...integrantesComunidad].sort(() => 0.5 - Math.random());
  gruposGenerados = [];

  for (let i = 0; i < numGrupos; i++) {
    gruposGenerados.push({
      id: Date.now() + i,
      nombre: `Grupo ${i + 1} - ${tipo}`,
      estado: 'Sin Empezar',
      integrantes: []
    });
  }

  mezclar.forEach((persona, index) => {
    const grupoIndex = index % numGrupos;
    gruposGenerados[grupoIndex].integrantes.push(persona);
  });

  renderizarGrupos();
}

function generarGruposCasas() {
  if (historialPreparaciones.length === 0) {
    alert('Se requiere al menos una preparación guardada para tomar a los preparadores como guías de casa.');
    return;
  }

  const ultimaPrep = historialPreparaciones[historialPreparaciones.length - 1];
  const guias = ultimaPrep.integrantes;
  const restoComunidad = integrantesComunidad.filter(h => !guias.some(g => g.id === h.id));
  const mezclarResto = [...restoComunidad].sort(() => 0.5 - Math.random());

  gruposGenerados = guias.map((guia, i) => ({
    id: Date.now() + i,
    nombre: `Casa ${i + 1} (Guía: ${guia.nombre})`,
    estado: 'Preparando',
    integrantes: [guia]
  }));

  mezclarResto.forEach((persona, index) => {
    const grupoIndex = index % gruposGenerados.length;
    gruposGenerados[grupoIndex].integrantes.push(persona);
  });

  renderizarGrupos();
}

function cambiarEstadoGrupo(grupoId, nuevoEstado) {
  const g = gruposGenerados.find(item => item.id === grupoId);
  if (g) g.estado = nuevoEstado;
  renderizarGrupos();
}

function eliminarIntegranteGrupo(grupoId, personaId) {
  const g = gruposGenerados.find(item => item.id === grupoId);
  if (g) {
    g.integrantes = g.integrantes.filter(p => p.id !== personaId);
    renderizarGrupos();
  }
}

function renderizarGrupos() {
  const container = document.getElementById('contenedor-grupos');
  document.getElementById('total-grupos-creados').textContent = gruposGenerados.length;
  container.innerHTML = '';

  if (gruposGenerados.length === 0) {
    container.innerHTML = '<p class="text-slate-400 italic text-sm col-span-3">No hay grupos generados. Usa las herramientas superiores para crear nuevos grupos.</p>';
    return;
  }

  gruposGenerados.forEach(g => {
    let estadoClass = 'bg-slate-100 text-slate-700';
    if (g.estado === 'Preparando') estadoClass = 'bg-amber-100 text-amber-800';
    if (g.estado === 'Preparado') estadoClass = 'bg-emerald-100 text-emerald-800';

    const listaHtml = g.integrantes.map(i => `
      <li class="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-none text-xs">
        <span class="font-medium text-slate-700">${i.nombre}</span>
        <button onclick="eliminarIntegranteGrupo(${g.id}, ${i.id})" class="text-slate-300 hover:text-red-500 transition"><i class="fa-solid fa-xmark"></i></button>
      </li>
    `).join('');

    container.innerHTML += `
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 flex flex-col justify-between">
        <div>
          <div class="flex justify-between items-start gap-2 mb-3">
            <h4 class="font-bold text-slate-900 text-sm">${g.nombre}</h4>
            <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${estadoClass}">${g.estado}</span>
          </div>

          <ul class="mb-4">
            ${listaHtml}
          </ul>
        </div>

        <div class="pt-3 border-t border-slate-100">
          <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Cambiar Estado</label>
          <select onchange="cambiarEstadoGrupo(${g.id}, this.value)" class="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2 outline-none">
            <option value="Sin Empezar" ${g.estado === 'Sin Empezar' ? 'selected' : ''}>Sin Empezar</option>
            <option value="Preparando" ${g.estado === 'Preparando' ? 'selected' : ''}>Preparando</option>
            <option value="Preparado" ${g.estado === 'Preparado' ? 'selected' : ''}>Preparado</option>
          </select>
        </div>
      </div>
    `;
  });
}

// --- PESTAÑA 3: FORMULARIO NUEVA PREPARACIÓN ---
function actualizarModalidad() {
  const seleccion = document.querySelector('input[name="modalidad"]:checked').value;
  const label = document.getElementById('label-detalle');
  const input = document.getElementById('input-detalle');

  label.textContent = `Detalle del/de la ${seleccion}:`;
  if (seleccion === 'Tema') input.placeholder = 'Ej. La Lectura Creyente de la Realidad';
  if (seleccion === 'Palabra') input.placeholder = 'Ej. Éxodo 3, 1-14';
  if (seleccion === 'Personaje') input.placeholder = 'Ej. Moisés';
}

function actualizarNumeroEquipo() {
  document.getElementById('equipo-numero').value = `Equipo ${historialPreparaciones.length + 1}`;
}

function cargarSelectIntegrantes() {
  const select = document.getElementById('select-integrantes');
  select.innerHTML = '<option value="">-- Seleccionar Persona --</option>';
  integrantesComunidad.forEach(persona => {
    select.innerHTML += `<option value="${persona.id}">${persona.nombre} (${persona.rol})</option>`;
  });
}

function agregarIntegrante() {
  const select = document.getElementById('select-integrantes');
  const personaId = parseInt(select.value);

  if (!personaId) return;
  const persona = integrantesComunidad.find(p => p.id === personaId);
  if (!persona || integrantesEquipoActual.some(p => p.id === persona.id)) return;

  integrantesEquipoActual.push(persona);

  // Auto-incluir cónyuge si es matrimonio
  if (persona.esMatrimonio && persona.parejaId) {
    const pareja = integrantesComunidad.find(p => p.id === persona.parejaId);
    if (pareja && !integrantesEquipoActual.some(p => p.id === pareja.id)) {
      integrantesEquipoActual.push(pareja);
      alert(`Se añadió automáticamente a ${pareja.nombre} por vínculo matrimonial.`);
    }
  }

  renderizarTablaEquipo();
  select.value = '';
}

function eliminarIntegranteEquipo(id) {
  integrantesEquipoActual = integrantesEquipoActual.filter(p => p.id !== id);
  renderizarTablaEquipo();
}

function renderizarTablaEquipo() {
  const tbody = document.getElementById('tabla-integrantes-equipo');
  tbody.innerHTML = '';

  if (integrantesEquipoActual.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-slate-400 italic font-normal">No hay integrantes añadidos.</td></tr>';
    return;
  }

  integrantesEquipoActual.forEach(p => {
    tbody.innerHTML += `
      <tr class="bg-white hover:bg-slate-50 transition">
        <td class="p-3 font-semibold text-slate-800">${p.nombre}</td>
        <td class="p-3"><span class="badge badge-indigo">${p.rol}</span></td>
        <td class="p-3 text-right">
          <button type="button" onclick="eliminarIntegranteEquipo(${p.id})" class="text-xs text-red-600 hover:bg-red-50 p-1 rounded transition"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `;
  });
}

function guardarPreparacion(e) {
  e.preventDefault();
  if (integrantesEquipoActual.length === 0) return alert('Asigna al menos un integrante.');

  const modalidad = document.querySelector('input[name="modalidad"]:checked').value;
  const detalle = document.getElementById('input-detalle').value;

  const nuevaPrep = {
    equipo: `Equipo ${historialPreparaciones.length + 1}`,
    modalidad: modalidad,
    detalle: detalle,
    integrantes: [...integrantesEquipoActual],
    estado: 'Preparando',
    fecha: new Date().toLocaleDateString()
  };

  historialPreparaciones.push(nuevaPrep);

  integrantesEquipoActual = [];
  renderizarTablaEquipo();
  document.getElementById('input-detalle').value = '';
  actualizarNumeroEquipo();
  renderizarHistorial();
  actualizarEstadisticas();
  
  alert('Preparación guardada con éxito.');
}

// --- PESTAÑA 4: HISTORIAL ---
function renderizarHistorial() {
  const tbody = document.getElementById('tabla-historial');
  tbody.innerHTML = '';

  if (historialPreparaciones.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-slate-400 italic">El historial está vacío.</td></tr>';
    return;
  }

  historialPreparaciones.forEach(item => {
    const integrantesStr = item.integrantes.map(i => `<span class="font-medium">${i.nombre}</span>`).join(', ');
    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition">
        <td class="p-4 font-bold text-indigo-600">${item.equipo}</td>
        <td class="p-4"><span class="badge badge-slate">${item.modalidad}</span></td>
        <td class="p-4 font-medium text-slate-700">${item.detalle}</td>
        <td class="p-4 text-xs leading-relaxed text-slate-600">${integrantesStr}</td>
        <td class="p-4"><span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 uppercase">${item.estado}</span></td>
        <td class="p-4 text-xs text-slate-400">${item.fecha}</td>
      </tr>
    `;
  });
}

// --- PESTAÑA 5: INSIGHTS & ESTADÍSTICAS AVANZADAS ---
function actualizarEstadisticas() {
  const total = historialPreparaciones.length;
  const temas = historialPreparaciones.filter(p => p.modalidad === 'Tema').length;
  const palabras = historialPreparaciones.filter(p => p.modalidad === 'Palabra').length;
  const personajes = historialPreparaciones.filter(p => p.modalidad === 'Personaje').length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-temas').textContent = temas;
  document.getElementById('stat-palabras').textContent = palabras;
  document.getElementById('stat-personajes').textContent = personajes;

  // Gráfica Modalidades
  const calcPct = (v) => total > 0 ? Math.round((v / total) * 100) : 0;
  document.getElementById('grafica-modalidades').innerHTML = `
    <div>
      <div class="flex justify-between text-xs font-semibold mb-1"><span>Temas</span><span>${temas} (${calcPct(temas)}%)</span></div>
      <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"><div class="bg-emerald-500 h-2.5" style="width: ${calcPct(temas)}%"></div></div>
    </div>
    <div>
      <div class="flex justify-between text-xs font-semibold mb-1"><span>Palabras</span><span>${palabras} (${calcPct(palabras)}%)</span></div>
      <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"><div class="bg-amber-500 h-2.5" style="width: ${calcPct(palabras)}%"></div></div>
    </div>
    <div>
      <div class="flex justify-between text-xs font-semibold mb-1"><span>Personajes</span><span>${personajes} (${calcPct(personajes)}%)</span></div>
      <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"><div class="bg-purple-500 h-2.5" style="width: ${calcPct(personajes)}%"></div></div>
    </div>
  `;

  // Mapeo de participaciones por hermano
  const conteoHermano = {};
  integrantesComunidad.forEach(h => conteoHermano[h.nombre] = 0);

  historialPreparaciones.forEach(p => {
    p.integrantes.forEach(i => {
      conteoHermano[i.nombre] = (conteoHermano[i.nombre] || 0) + 1;
    });
  });

  // Gráfica por roles
  const conteoRoles = {};
  Object.values(ROLES).forEach(r => conteoRoles[r] = 0);

  historialPreparaciones.forEach(p => {
    p.integrantes.forEach(i => {
      conteoRoles[i.rol] = (conteoRoles[i.rol] || 0) + 1;
    });
  });

  const totalIntervenciones = Object.values(conteoRoles).reduce((a, b) => a + b, 0);
  document.getElementById('grafica-roles').innerHTML = Object.keys(conteoRoles).map(rol => {
    const val = conteoRoles[rol];
    const pct = totalIntervenciones > 0 ? Math.round((val / totalIntervenciones) * 100) : 0;
    return `
      <div>
        <div class="flex justify-between text-xs font-semibold mb-1"><span>${rol}</span><span>${val} convocatorias (${pct}%)</span></div>
        <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden"><div class="bg-indigo-600 h-2" style="width: ${pct}%"></div></div>
      </div>
    `;
  }).join('');

  // Estadísticas de Matrimonio
  let partMatrimonio = 0;
  historialPreparaciones.forEach(p => {
    if (p.integrantes.some(i => i.esMatrimonio)) partMatrimonio++;
  });
  document.getElementById('stat-matrimonios').innerHTML = `
    <p class="text-xs text-slate-600">Equipos con matrimonios: <strong>${partMatrimonio}</strong> de ${total}</p>
    <p class="text-xs text-slate-600">Representación matrimonial: <strong>${calcPct(partMatrimonio)}%</strong></p>
  `;

  // Rankings
  const ordenados = Object.entries(conteoHermano).sort((a, b) => b[1] - a[1]);
  document.getElementById('lista-mas-activos').innerHTML = ordenados.slice(0, 3).map(([nombre, count]) => `
    <li class="flex justify-between items-center text-xs"><span>${nombre}</span><span class="font-bold text-indigo-600">${count} preps</span></li>
  `).join('');

  document.getElementById('lista-menos-activos').innerHTML = ordenados.slice(-3).reverse().map(([nombre, count]) => `
    <li class="flex justify-between items-center text-xs"><span>${nombre}</span><span class="font-bold text-slate-400">${count} preps</span></li>
  `).join('');

  // Insight cualitativo
  const insightEl = document.getElementById('insight-texto');
  if (total === 0) {
    insightEl.textContent = 'Registra preparaciones para obtener métricas dinámicas avanzadas y sugerencias de equilibrio.';
  } else {
    insightEl.innerHTML = `La comunidad mantiene un nivel activo de preparaciones con mayor tendencia hacia la modalidad de <strong class="text-indigo-300 font-bold">${temas >= palabras && temas >= personajes ? 'Temas' : palabras >= personajes ? 'Palabras' : 'Personajes'}</strong>. Te recomendamos convocar más a los hermanos con menor participación para mantener una rotación equitativa.`;
  }
}
