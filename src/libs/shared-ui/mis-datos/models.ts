export interface MisDatoPostulacion {
  name: string;
  profession?: string;
  commune?: string;
  message: string;
  avatar: string;
  online: boolean;
  ctaLabel: string;
  providerId?: number | null;
}

export interface MisDatoMatch {
  name: string;
  profession: string;
  commune: string;
  avatar: string;
  online: boolean;
  providerId: number | null;
}

export interface MisDatoPublicado {
  id: string;
  title: string;
  postedMeta: string;
  status: 'activo' | 'cerrado';
  text: string;
  vistas?: number;
  likes: number;
  comentarios: number;
  aportes: number;
  postulaciones: MisDatoPostulacion[];
  matches: MisDatoMatch[];
  canViewPostulaciones?: boolean;
}

