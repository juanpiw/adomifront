import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiButtonComponent } from '../ui-button/ui-button.component';

export interface ServiceFormData {
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  category_id?: number | null;
  custom_category?: string;
  service_image_url?: string;
}

export interface ServiceCategory {
  id: number;
  name: string;
  subcategories: ServiceSubcategory[];
}

export interface ServiceSubcategory {
  id: number;
  name: string;
  category_id: number;
}

@Component({
  selector: 'app-modal-crear-servicio',
  standalone: true,
  imports: [CommonModule, FormsModule, UiButtonComponent],
  templateUrl: './modal-crear-servicio.component.html',
  styleUrls: ['./modal-crear-servicio.component.scss']
})
export class ModalCrearServicioComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Input() editingService: any = null; // Servicio para editar
  @Input() saving = false; // Para controlar el estado de guardado desde el padre
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<ServiceFormData>();

  // Formulario
  formData: ServiceFormData = {
    name: '',
    description: '',
    price: 0,
    duration_minutes: 30,
    custom_category: ''
  };

  // Estados
  loading = false;
  errorMessage = '';

  // Categorías de servicios
  categories: ServiceCategory[] = [
    {
      id: 1,
      name: 'Belleza',
      subcategories: [
        { id: 1, name: 'Corte de Pelo', category_id: 1 },
        { id: 2, name: 'Coloración', category_id: 1 },
        { id: 3, name: 'Manicura', category_id: 1 },
        { id: 4, name: 'Maquillaje', category_id: 1 },
        { id: 5, name: 'Depilación', category_id: 1 },
        { id: 6, name: 'Tratamientos Faciales', category_id: 1 }
      ]
    },
    {
      id: 2,
      name: 'Hogar',
      subcategories: [
        { id: 7, name: 'Limpieza Profunda', category_id: 2 },
        { id: 8, name: 'Organización', category_id: 2 },
        { id: 9, name: 'Jardinería', category_id: 2 },
        { id: 10, name: 'Mantenimiento', category_id: 2 }
      ]
    },
    {
      id: 3,
      name: 'Tecnología',
      subcategories: [
        { id: 11, name: 'Reparación de Computadores', category_id: 3 },
        { id: 12, name: 'Instalación de Software', category_id: 3 },
        { id: 13, name: 'Configuración de Red', category_id: 3 },
        { id: 14, name: 'Soporte Técnico', category_id: 3 }
      ]
    },
    {
      id: 4,
      name: 'Salud',
      subcategories: [
        { id: 15, name: 'Masajes', category_id: 4 },
        { id: 16, name: 'Terapias', category_id: 4 },
        { id: 17, name: 'Fisioterapia', category_id: 4 },
        { id: 18, name: 'Yoga/Meditación', category_id: 4 }
      ]
    }
  ];

  selectedCategory: ServiceCategory | null = null;
  selectedSubcategory: ServiceSubcategory | null = null;
  availableSubcategories: ServiceSubcategory[] = [];

  constructor() {}

  ngOnInit() {
    if (this.editingService) {
      this.loadServiceData();
    }
    
    // Prevenir scroll del body cuando el modal está abierto
    if (this.isOpen) {
      document.body.style.overflow = 'hidden';
    }
  }

  ngOnDestroy() {
    // Restaurar scroll del body
    document.body.style.overflow = 'auto';
  }

  ngOnChanges() {
    if (this.isOpen) {
      document.body.style.overflow = 'hidden';
      if (this.editingService) {
        this.loadServiceData();
      } else {
        this.resetForm();
      }
    } else {
      document.body.style.overflow = 'auto';
    }
  }

  private loadServiceData() {
    if (!this.editingService) return;

    this.formData = {
      name: this.editingService.name || '',
      description: this.editingService.description || '',
      price: this.editingService.price || 0,
      duration_minutes: this.editingService.duration_minutes || 30,
      category_id: this.editingService.category_id || null,
      custom_category: this.editingService.custom_category || ''
    };

    // Cargar categoría seleccionada
    if (this.editingService.category_id) {
      this.selectedCategory = this.categories.find(c => c.id === this.editingService.category_id) || null;
      if (this.selectedCategory) {
        this.availableSubcategories = this.selectedCategory.subcategories;
      }
    }
  }

  private resetForm() {
    this.formData = {
      name: '',
      description: '',
      price: 0,
      duration_minutes: 30,
      custom_category: ''
    };
    this.selectedCategory = null;
    this.selectedSubcategory = null;
    this.availableSubcategories = [];
    this.errorMessage = '';
  }

  onCategoryChange(event: any) {
    const categoryId = parseInt(event.target.value);
    this.selectedCategory = this.categories.find(c => c.id === categoryId) || null;
    this.availableSubcategories = this.selectedCategory?.subcategories || [];
    this.selectedSubcategory = null;
    
    // Limpiar subcategoría seleccionada
    this.formData.category_id = null;
  }

  onSubcategoryChange(event: any) {
    const subcategoryId = parseInt(event.target.value);
    this.selectedSubcategory = this.availableSubcategories.find(s => s.id === subcategoryId) || null;
    this.formData.category_id = this.selectedSubcategory?.id || null;
  }

  onClose() {
    this.isOpen = false;
    this.resetForm();
    this.close.emit();
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onSubmit() {
    this.errorMessage = '';

    // Validaciones
    if (!this.formData.name.trim()) {
      this.errorMessage = 'El nombre del servicio es requerido';
      return;
    }

    if (!this.formData.description.trim()) {
      this.errorMessage = 'La descripción es requerida';
      return;
    }

    if (this.formData.price <= 0) {
      this.errorMessage = 'El precio debe ser mayor a 0';
      return;
    }

    if (this.formData.duration_minutes < 10 || this.formData.duration_minutes > 480) {
      this.errorMessage = 'La duración debe estar entre 10 y 480 minutos';
      return;
    }

    // Si no hay categoría seleccionada, usar custom_category
    if (!this.formData.category_id && !this.formData.custom_category?.trim()) {
      this.errorMessage = 'Debes seleccionar una categoría o escribir una personalizada';
      return;
    }

    this.loading = true;
    console.log('[MODAL_SERVICIO] Emitiendo evento save con datos:', { ...this.formData });

    // Emitir evento de guardado
    this.save.emit({ ...this.formData });
  }

  // Getters para validación del formulario
  get isFormValid(): boolean {
    return !!(
      this.formData.name.trim() &&
      this.formData.description.trim() &&
      this.formData.price > 0 &&
      this.formData.duration_minutes >= 10 &&
      (this.formData.category_id || this.formData.custom_category?.trim())
    );
  }

  get modalTitle(): string {
    return this.editingService ? 'Editar Servicio' : 'Crear Nuevo Servicio';
  }
}
