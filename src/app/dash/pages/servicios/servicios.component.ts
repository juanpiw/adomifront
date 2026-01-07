import { Component, OnInit, inject } from '@angular/core';
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
import { ProviderServicesService, ProviderServiceDto } from '../../../services/provider-services.service';

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
  private api = inject(ProviderServicesService);
  
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
    this.api.list().subscribe({
      next: (resp) => {
        const dtos = resp.services || [];
        this.services = dtos.map(this.mapDtoToService);
        // Aseguramos que categorías/tipos personalizados aparezcan en los selects
        this.services.forEach(s => this.ensureCategoryOptions(s.category, s.type));
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
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
    console.log('[SERVICIOS] onServiceSaved', { formData, editing: !!this.editingService });
    if (this.editingService) {
      this.api.update(this.editingService.id, {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        duration_minutes: formData.duration,
        custom_category: formData.category === 'Otro' ? formData.type : undefined,
      }).subscribe({
        next: (resp) => {
          console.log('[SERVICIOS] update resp', resp);
          const updated = this.mapDtoToService(resp.service);
          const index = this.services.findIndex(s => s.id === updated.id);
          if (index !== -1) this.services[index] = updated;
          this.ensureCategoryOptions(updated.category, updated.type);
          this.showToastMessage('success', 'Servicio actualizado correctamente');
          this.currentView = 'list';
          this.editingService = null;
        },
        error: (err) => {
          console.error('[SERVICIOS] error al actualizar', err);
        }
      });
    } else {
      this.api.create({
        name: formData.name,
        description: formData.description,
        price: formData.price,
        duration_minutes: formData.duration,
        custom_category: formData.category === 'Otro' ? formData.type : undefined,
      }).subscribe({
        next: (resp) => {
          console.log('[SERVICIOS] create resp', resp);
          const created = this.mapDtoToService(resp.service);
          this.services.unshift(created);
          this.ensureCategoryOptions(created.category, created.type);
          this.showToastMessage('success', 'Servicio creado correctamente');
          this.currentView = 'list';
          this.editingService = null;
        },
        error: (err) => {
          console.error('[SERVICIOS] error al crear', err);
        }
      });
    }
  }

  onFormCancelled() {
    this.currentView = 'list';
    this.editingService = null;
  }

  // Modal events
  onDeleteConfirmed() {
    if (!this.serviceToDelete) { this.showConfirmationModal = false; return; }
    const id = this.serviceToDelete.id;
    this.api.delete(id).subscribe({
      next: () => {
        this.services = this.services.filter(s => s.id !== id);
        this.showToastMessage('success', 'Servicio eliminado correctamente');
        this.showConfirmationModal = false;
        this.serviceToDelete = null;
      },
      error: () => {
        this.showConfirmationModal = false;
        this.serviceToDelete = null;
      }
    });
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

  private mapDtoToService = (dto: ProviderServiceDto): Service => ({
    id: dto.id,
    name: dto.name,
    description: dto.description || '',
    category: dto.custom_category || 'Otros',
    type: dto.custom_category || dto.name || 'Servicio',
    price: dto.price,
    duration: dto.duration_minutes,
    createdAt: dto.created_at ? new Date(dto.created_at) : new Date(),
    updatedAt: dto.updated_at ? new Date(dto.updated_at) : new Date(),
  });

  // Agrega dinámicamente categorías/tipos para que el formulario pueda mostrarlos al editar
  private ensureCategoryOptions(categoryName: string, typeName: string) {
    if (!categoryName) return;
    const existing = this.categories.find(c => c.name === categoryName);
    if (!existing) {
      this.categories.push({ name: categoryName, services: [typeName, 'Otro'] });
      return;
    }
    if (typeName && !existing.services.includes(typeName)) {
      existing.services = [...existing.services, typeName];
    }
  }
}
