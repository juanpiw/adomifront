// Interfaces para los modales de reservas pendientes

export interface ReservaData {
  id: string;
  clientName: string;
  clientAvatar: string;
  service: string;
  when: string;
  time: string;
  date?: string;
  location?: string;
  estimatedIncome?: number;
  clientPhone?: string;
  clientEmail?: string;
  notes?: string;
}

export interface RejectionReason {
  value: string;
  label: string;
  description?: string;
}

export interface ModalResult {
  success: boolean;
  data?: any;
  reason?: string;
}

export interface AcceptReservaResult extends ModalResult {
  data: {
    reservaId: string;
    confirmedAt: Date;
  };
}

export interface RejectReservaResult extends ModalResult {
  data: {
    reservaId: string;
    rejectedAt: Date;
    reason: string;
    customReason?: string;
  };
}

// Razones predefinidas para rechazar una reserva
export const REJECTION_REASONS: RejectionReason[] = [
  {
    value: 'no_availability',
    label: 'No tengo disponibilidad en ese horario.',
    description: 'El horario solicitado no está disponible'
  },
  {
    value: 'out_of_area',
    label: 'La ubicación está fuera de mi zona de servicio.',
    description: 'La ubicación está fuera del área de cobertura'
  },
  {
    value: 'cannot_perform',
    label: 'No puedo realizar el servicio solicitado.',
    description: 'El servicio no está dentro de mis capacidades'
  },
  {
    value: 'other',
    label: 'Otro motivo.',
    description: 'Especifica el motivo en los comentarios'
  }
];







