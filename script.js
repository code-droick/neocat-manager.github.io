// --- BASE DE DATOS LOCAL Y ESTADOS ---
const ROLES = {
  RESPONSABLE: 'Responsable',
  CO_RESPONSABLE: 'Co-responsable',
  SACERDOTE: 'Sacerdote',
  SEMINARISTA: 'Seminarista',
  HERMANO: 'Hermano/a'
};

// Integrantes preconfigurados con regla de matrimonios
const integrantesComunidad = [
  { id: 1, nombre: 'Juan Pérez', esMatrimonio: true, parejaId: 2, rol: ROLES.RESPONSABLE },
  { id: 2, nombre: 'María de Pérez', esMatrimonio: true, parejaId: 1, rol: ROLES.RESPONSABLE },
  { id: 3, nombre: 'Carlos Ruiz', esMatrimonio: false, rol: ROLES.CO_RESPONSABLE },
  { id: 4, nombre: 'P. Fernando', esMatrimonio: false, rol: ROLES.SACERDOTE },
  { id: 5, nombre: 'Luis Morales', esMatrimonio: false, rol: ROLES.SEMINARISTA },
  { id: 6, nombre: 'Ana Gómez', esMatrimonio: false, rol: ROLES.HERMANO }
];

let historialPreparaciones = [];
let integrantesEquipoActual = [];

// --- INICIALIZACIÓN DE LA APLICACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
  cargarSelectIntegrantes();
  actualizarNumeroEquipo();
  actualizarEstadisticas();
});

// --- NAVEGACIÓN Y PESTAÑAS ---
function cambiarPestana(tabId, event) {
  event.preventDefault();
  
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));

  document.getElementById(tabId).classList.add('active');
  event.target.classList.add('active');

  if (tabId === 'estadisticas') {
    actualizarEstadisticas();
  }
}

// --- GESTIÓN DEL FORMULARIO Y SELECCIÓN EXCLUSIVA ---
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
  const siguienteNumero = historialPreparaciones.length + 1;
  document.getElementById('equipo-numero').value = `Equipo ${siguienteNumero}`;
}

function cargarSelectIntegrantes() {
  const select = document.getElementById('select-integrantes');
  select.innerHTML = '<option value="">-- Seleccionar Persona --</option>';
  integrantesComunidad.forEach(persona => {
    select.innerHTML += `<option value="${persona.id}">${persona.nombre} (${persona.rol})</option>`;
  });
}

// --- LÓGICA DE ASIGNACIÓN Y REGLAS DE ROL/MATRIMONIO ---
function agregarIntegrante() {
  const select = document.getElementById('select-integrantes');
  const personaId = parseInt(select.value);

  if (!personaId) return;

  const persona = integrantesComunidad.find(p => p.id === personaId);
  if (!persona) return;

  // Verificar duplicados
  if (integrantesEquipoActual.some(p => p.id === persona.id)) {
    alert('Esta persona ya está asignada al equipo.');
    return;
  }

  // Añadir la persona elegida
  integrantesEquipoActual.push(persona);

  // Auto-inclusión de pareja si es Responsable y es un matrimonio
  if (persona.rol === ROLES.RESPONSABLE && persona.esMatrimonio && persona.parejaId) {
    const pareja = integrantesComunidad.find(p => p.id === persona.parejaId);
    if (pareja && !integrantesEquipoActual.some(p => p.id === pareja.id)) {
      integrantesEquipoActual.push(pareja);
      alert(`Se añadió automáticamente a ${pareja.nombre} por ser matrimonio responsable.`);
    }
  }

  renderizarTablaEquipo();
  select.value = '';
}

function eliminarIntegrante(id) {
  integrantesEquipoActual = integrantesEquipoActual.filter(p => p.id !== id);
  renderizarTablaEquipo();
}

function renderizarTablaEquipo() {
  const tbody = document.getElementById('tabla-integrantes-equipo');
  tbody.innerHTML = '';

  if (integrantesEquipoActual.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#94a3b8;">No hay integrantes añadidos.</td></tr>';
    return;
  }

  integrantesEquipoActual.forEach(p => {
    tbody.innerHTML += `
      <tr>
        <td>${p.nombre}</td>
        <td><span class="badge">${p.rol}</span></td>
        <td><button type="button" onclick="eliminarIntegrante(${p.id})" style="background:#ef4444; padding: 4px 8px; font-size:0.8rem;">Quitar</button></td>
      </tr>
    `;
  });
}

// --- GUARDAR Y REGISTRAR EN EL HISTORIAL ---
function guardarPreparacion(e) {
  e.preventDefault();

  if (integrantesEquipoActual.length === 0) {
    alert('Debes asignar al menos un integrante al equipo.');
    return;
  }

  const modalidad = document.querySelector('input[name="modalidad"]:checked').value;
  const detalle = document.getElementById('input-detalle').value;
  const numeroEquipo = historialPreparaciones.length + 1;

  const nuevaPrep = {
    equipo: `Equipo ${numeroEquipo}`,
    modalidad: modalidad,
    detalle: detalle,
    integrantes: [...integrantesEquipoActual],
    fecha: new Date().toLocaleDateString()
  };

  historialPreparaciones.push(nuevaPrep);

  // Limpieza de formulario y refresco de interfaces
  integrantesEquipoActual = [];
  renderizarTablaEquipo();
  document.getElementById('input-detalle').value = '';
  actualizarNumeroEquipo();
  renderizarHistorial();
  
  alert('¡Preparación registrada con éxito!');
}

function renderizarHistorial() {
  const tbody = document.getElementById('tabla-historial');
  tbody.innerHTML = '';

  if (historialPreparaciones.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94a3b8;">El historial está vacío.</td></tr>';
    return;
  }

  historialPreparaciones.forEach(item => {
    const nombresIntegrantes = item.integrantes.map(i => `${i.nombre} (${i.rol})`).join('<br>');
    tbody.innerHTML += `
      <tr>
        <td><strong>${item.equipo}</strong></td>
        <td><span class="badge">${item.modalidad}</span></td>
        <td>${item.detalle}</td>
        <td>${nombresIntegrantes}</td>
        <td>${item.fecha}</td>
      </tr>
    `;
  });
}

// --- CÁLCULO Y DILIGENCIAMIENTO DE ESTADÍSTICAS & INSIGHTS ---
function actualizarEstadisticas() {
  const total = historialPreparaciones.length;
  const temas = historialPreparaciones.filter(p => p.modalidad === 'Tema').length;
  const palabras = historialPreparaciones.filter(p => p.modalidad === 'Palabra').length;
  const personajes = historialPreparaciones.filter(p => p.modalidad === 'Personaje').length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-temas').textContent = temas;
  document.getElementById('stat-palabras').textContent = palabras;
  document.getElementById('stat-personajes').textContent = personajes;

  const insightEl = document.getElementById('insight-texto');
  if (total === 0) {
    insightEl.textContent = 'Aún no hay datos registrados para generar métricas dinámicas.';
  } else {
    let masFrecuente = 'Temas';
    let maxCount = temas;

    if (palabras > maxCount) { masFrecuente = 'Palabras'; maxCount = palabras; }
    if (personajes > maxCount) { masFrecuente = 'Personajes'; maxCount = personajes; }

    insightEl.innerHTML = `Hasta el momento, la comunidad se ha enfocado mayoritariamente en la preparación de <strong>${masFrecuente}</strong> (${maxCount} registros).`;
  }
}
