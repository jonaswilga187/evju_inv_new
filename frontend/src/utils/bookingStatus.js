/**
 * Zentrale Status-Labels und -Farben für Buchungen.
 * DB-Werte: pending, active, completed, cancelled
 */
export const STATUS_LABELS = {
  pending: 'Geplant',
  active: 'Terminiert',
  completed: 'Abgeschlossen',
  cancelled: 'Storniert',
};

export const STATUS_COLORS = {
  pending: '#ffc107',
  active: '#28a745',
  completed: '#6c757d',
  cancelled: '#dc3545',
};

export const STATUS_OPTIONS = [
  { value: 'pending', label: STATUS_LABELS.pending },
  { value: 'active', label: STATUS_LABELS.active },
  { value: 'completed', label: STATUS_LABELS.completed },
  { value: 'cancelled', label: STATUS_LABELS.cancelled },
];

export function getStatusLabel(status) {
  return STATUS_LABELS[status] || status;
}

export function getStatusColor(status) {
  return STATUS_COLORS[status] || '#667eea';
}
