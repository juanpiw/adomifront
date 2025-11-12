export interface CitaDetalleData {
  id: string;
  service: string;
  date: string;
  time: string;
  duration: string;
  paymentStatus: 'paid' | 'pending' | 'failed';
  amount: number;
  client: {
    name: string;
    avatar: string;
    phone?: string;
    email?: string;
  };
  location: {
    address: string;
    mapUrl?: string;
  };
  notes?: string;
}

export interface CitaDetalleResult {
  action: 'contact' | 'reschedule' | 'cancel';
  citaId: string;
  data?: any;
}

export interface CancelCitaResult {
  citaId: string;
  reason?: string;
  confirmed: boolean;
}














