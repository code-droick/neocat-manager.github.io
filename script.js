// Definición de roles de la comunidad
const ROLES = {
  RESPONSABLE: 'Responsable',
  CO_RESPONSABLE: 'Co-responsable',
  SACERDOTE: 'Sacerdote',
  SEMINARISTA: 'Seminarista',
  HERMANO: 'Hermano/a'
};

// Ejemplo de base de datos de integrantes
const comunidadIntegrantes = [
  { id: 1, nombre: 'Juan Pérez', esMatrimonio: true, parejad: 2, rol: ROLES.RESPONSABLE },
  { id: 2, nombre: 'María de Pérez', esMatrimonio: true, parejaId: 1, rol: ROLES.RESPONSABLE },
  { id: 3, nombre: 'P. Carlos', esMatrimonio: false, rol: ROLES.SACERDOTE },
  { id: 4, nombre: 'Luis (Seminarista)', esMatrimonio: false, rol: ROLES.SEMINARISTA },
  { id: 5, nombre: 'Ana Gómez', esMatrimonio: false, rol: ROLES.HERMANO }
];

// Función para seleccionar integrante (auto-selecciona al cónyuge si es matrimonio responsable)
function seleccionarIntegrante(integranteId, listaActual) {
  const integrante = comunidadIntegrantes.find(i => i.id === integranteId);
  if (!integrante) return listaActual;

  let seleccionados = [...listaActual, integrante];

  // Si es responsable y es matrimonio, agregar automáticamente a la pareja
  if (integrante.rol === ROLES.RESPONSABLE && integrante.esMatrimonio && integrante.parejaId) {
    const pareja = comunidadIntegrantes.find(i => i.id === integrante.parejaId);
    if (pareja && !seleccionados.some(i => i.id === pareja.id)) {
      seleccionados.push(pareja);
    }
  }

  return seleccionados;
}
