import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  ServicesHeaderComponent,
  ServicesListComponent,
  ServiceFormComponent,
  ConfirmationModalComponent,
  FeedbackToastComponent,
  Service,
  ServiceCategory,
  ServiceFormData,
  ToastType
} from '../../../../libs/shared-ui/services';
import { IconComponent } from '../../../../libs/shared-ui/icon/icon.component';

@Component({
  selector: 'app-d-servicios',
  standalone: true,
  imports: [
    CommonModule,
    ServicesHeaderComponent,
    ServicesListComponent,
    ServiceFormComponent,
    ConfirmationModalComponent,
    FeedbackToastComponent,
    IconComponent
  ],
  templateUrl: './servicios.component.html',
  styleUrls: ['./servicios.component.scss']
})
export class DashServiciosComponent implements OnInit {
  // View state
  currentView: 'list' | 'form' = 'list';
  loading = false;
  
  // Data
  services: Service[] = [];
  categories: ServiceCategory[] = [
    {
      name: 'Tecnología',
      services: ['Soporte Técnico', 'Reparación de Computadoras', 'Instalación de Software', 'Configuración de Redes', 'Otro']
    },
    {
      name: 'Hogar',
      services: ['Limpieza de Hogar', 'Jardinería', 'Plomería', 'Electricidad', 'Otro']
    },
    {
      name: 'Belleza',
      services: ['Corte de Cabello', 'Manicure', 'Pedicure', 'Maquillaje', 'Otro']
    },
    {
      name: 'Salud',
      services: ['Masajes', 'Terapia Física', 'Consultas Médicas', 'Nutrición', 'Otro']
    }
  ];
  
  // Form state
  editingService: Service | null = null;
  
  // Modal state
  showConfirmationModal = false;
  serviceToDelete: Service | null = null;
  
  // Toast state
  showToast = false;
  toastType: ToastType = 'info';
  toastMessage = '';

  ngOnInit() {
    this.loadServices();
  }

  private loadServices() {
    this.loading = true;
    
    // Simular carga de datos
    setTimeout(() => {
      this.services = [
        {
          id: 1,
          name: 'Soporte Técnico Premium',
          category: 'Tecnología',
          type: 'Soporte Técnico',
          description: 'Servicio completo de soporte técnico para computadoras y dispositivos móviles. Incluye diagnóstico, reparación y optimización.',
          price: 25000,
          duration: 60,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          name: 'Limpieza Profunda de Hogar',
          category: 'Hogar',
          type: 'Limpieza de Hogar',
          description: 'Servicio de limpieza completa que incluye todas las habitaciones, baños, cocina y áreas comunes.',
          price: 45000,
          duration: 180,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      this.loading = false;
    }, 1000);
  }

  // Header events
  onAddService() {
    this.editingService = null;
    this.currentView = 'form';
  }

  // List events
  onServiceEdited(service: Service) {
    this.editingService = service;
    this.currentView = 'form';
  }

  onServiceDeleted(service: Service) {
    this.serviceToDelete = service;
    this.showConfirmationModal = true;
  }

  onAddServiceFromList() {
    this.onAddService();
  }

  // Form events
  onServiceSaved(formData: ServiceFormData) {
    if (this.editingService) {
      // Editar servicio existente
      const index = this.services.findIndex(s => s.id === this.editingService!.id);
      if (index !== -1) {
        this.services[index] = {
          ...this.editingService,
          ...formData,
          updatedAt: new Date()
        };
        this.showToastMessage('success', 'Servicio actualizado correctamente');
      }
    } else {
      // Crear nuevo servicio
      const newService: Service = {
        id: Date.now(), // En producción usar UUID
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.services.unshift(newService);
      this.showToastMessage('success', 'Servicio creado correctamente');
    }
    
    this.currentView = 'list';
    this.editingService = null;
  }

  onFormCancelled() {
    this.currentView = 'list';
    this.editingService = null;
  }

  // Modal events
  onDeleteConfirmed() {
    if (this.serviceToDelete) {
      this.services = this.services.filter(s => s.id !== this.serviceToDelete!.id);
      this.showToastMessage('success', 'Servicio eliminado correctamente');
    }
    this.showConfirmationModal = false;
    this.serviceToDelete = null;
  }

  onDeleteCancelled() {
    this.showConfirmationModal = false;
    this.serviceToDelete = null;
  }

  // Toast events
  onToastDismissed() {
    this.showToast = false;
  }

  private showToastMessage(type: ToastType, message: string) {
    this.toastType = type;
    this.toastMessage = message;
    this.showToast = true;
    
    // Auto dismiss after 3 seconds
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
}
