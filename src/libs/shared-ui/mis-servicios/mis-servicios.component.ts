import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalCrearServicioComponent, ServiceFormData } from '../modal-crear-servicio/modal-crear-servicio.component';

export interface ProviderService {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  category_id?: number;
  custom_category?: string;
  service_image_url?: string;
  is_active: boolean;
  is_featured: boolean;
  order_index: number;
  booking_count: number;
  average_rating?: number;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-mis-servicios',
  standalone: true,
  imports: [CommonModule, ModalCrearServicioComponent],
  templateUrl: './mis-servicios.component.html',
  styleUrls: ['./mis-servicios.component.scss']
})
export class MisServiciosComponent implements OnInit {
  @Input() services: ProviderService[] = [];
  @Input() loading = false;
  @Output() addService = new EventEmitter<void>();
  @Output() editService = new EventEmitter<ProviderService>();
  @Output() deleteService = new EventEmitter<number>();

  // Estado del modal
  showCreateModal = false;
  editingService: ProviderService | null = null;

  constructor() {}

  ngOnInit() {}

  onAddNewService() {
    console.log('[MIS-SERVICIOS] Abriendo modal para crear servicio');
    this.editingService = null;
    this.showCreateModal = true;
  }

  onEditService(service: ProviderService) {
    console.log('[MIS-SERVICIOS] Editando servicio:', service);
    this.editingService = service;
    this.showCreateModal = true;
  }

  onDeleteService(serviceId: number) {
    console.log('[MIS-SERVICIOS] Eliminando servicio:', serviceId);
    
    if (confirm('¿Estás seguro de que deseas eliminar este servicio? Esta acción no se puede deshacer.')) {
      this.deleteService.emit(serviceId);
    }
  }

  onCloseModal() {
    console.log('[MIS-SERVICIOS] Cerrando modal');
    this.showCreateModal = false;
    this.editingService = null;
  }

  onSaveService(serviceData: ServiceFormData) {
    console.log('[MIS-SERVICIOS] Guardando servicio:', serviceData);
    
    if (this.editingService) {
      // Editar servicio existente
      this.editService.emit({
        ...this.editingService,
        ...serviceData
      });
    } else {
      // Crear nuevo servicio
      this.addService.emit();
    }
    
    // Cerrar modal después de guardar
    this.onCloseModal();
  }

  // Helpers para mostrar datos
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  }

  getCategoryName(service: ProviderService): string {
    if (service.custom_category) {
      return service.custom_category;
    }
    
    // Mapeo básico de categorías (en producción esto vendría del backend)
    const categoryMap: { [key: number]: string } = {
      1: 'Belleza',
      2: 'Hogar', 
      3: 'Tecnología',
      4: 'Salud'
    };
    
    return categoryMap[service.category_id || 0] || 'Sin categoría';
  }

  getSubcategoryName(service: ProviderService): string {
    if (service.custom_category) {
      return service.custom_category;
    }
    
    // Mapeo básico de subcategorías
    const subcategoryMap: { [key: number]: string } = {
      1: 'Corte de Pelo',
      2: 'Coloración',
      3: 'Manicura',
      4: 'Maquillaje',
      5: 'Depilación',
      6: 'Tratamientos Faciales',
      7: 'Limpieza Profunda',
      8: 'Organización',
      9: 'Jardinería',
      10: 'Mantenimiento',
      11: 'Reparación de Computadores',
      12: 'Instalación de Software',
      13: 'Configuración de Red',
      14: 'Soporte Técnico',
      15: 'Masajes',
      16: 'Terapias',
      17: 'Fisioterapia',
      18: 'Yoga/Meditación'
    };
    
    return subcategoryMap[service.category_id || 0] || 'Servicio';
  }
}