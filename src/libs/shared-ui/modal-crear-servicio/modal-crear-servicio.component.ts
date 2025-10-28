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
  priceText: string = '';

  // Categorías de servicios
  categories: ServiceCategory[] = [
    {
      id: 1,
      name: 'Belleza y Estética',
      subcategories: [
        { id: 1, name: 'Corte de Pelo', category_id: 1 },
        { id: 2, name: 'Coloración', category_id: 1 },
        { id: 3, name: 'Manicura', category_id: 1 },
        { id: 4, name: 'Pedicura', category_id: 1 },
        { id: 5, name: 'Maquillaje', category_id: 1 },
        { id: 6, name: 'Depilación', category_id: 1 },
        { id: 7, name: 'Tratamientos Faciales', category_id: 1 },
        { id: 8, name: 'Extensiones de Pestañas', category_id: 1 },
        { id: 9, name: 'Microblading', category_id: 1 },
        { id: 10, name: 'Tatuajes', category_id: 1 }
      ]
    },
    {
      id: 2,
      name: 'Gastronomía y Cocina',
      subcategories: [
        { id: 11, name: 'Chef a Domicilio', category_id: 2 },
        { id: 12, name: 'Catering', category_id: 2 },
        { id: 13, name: 'Repostería', category_id: 2 },
        { id: 14, name: 'Cocina Internacional', category_id: 2 },
        { id: 15, name: 'Clases de Cocina', category_id: 2 },
        { id: 16, name: 'Bartender', category_id: 2 },
        { id: 17, name: 'Sommelier', category_id: 2 }
      ]
    },
    {
      id: 3,
      name: 'Hogar y Mantenimiento',
      subcategories: [
        { id: 18, name: 'Limpieza Profunda', category_id: 3 },
        { id: 19, name: 'Limpieza Regular', category_id: 3 },
        { id: 20, name: 'Organización', category_id: 3 },
        { id: 21, name: 'Jardinería', category_id: 3 },
        { id: 22, name: 'Paisajismo', category_id: 3 },
        { id: 23, name: 'Pintura de Casas', category_id: 3 },
        { id: 24, name: 'Reparaciones Eléctricas', category_id: 3 },
        { id: 25, name: 'Plomería', category_id: 3 },
        { id: 26, name: 'Carpintería', category_id: 3 },
        { id: 27, name: 'Montaje de Muebles', category_id: 3 }
      ]
    },
    {
      id: 4,
      name: 'Tecnología e Informática',
      subcategories: [
        { id: 28, name: 'Reparación de Computadores', category_id: 4 },
        { id: 29, name: 'Reparación de Celulares', category_id: 4 },
        { id: 30, name: 'Instalación de Software', category_id: 4 },
        { id: 31, name: 'Configuración de Red', category_id: 4 },
        { id: 32, name: 'Soporte Técnico', category_id: 4 },
        { id: 33, name: 'Desarrollo Web', category_id: 4 },
        { id: 34, name: 'Diseño Gráfico', category_id: 4 },
        { id: 35, name: 'Marketing Digital', category_id: 4 },
        { id: 36, name: 'Instalación de CCTV', category_id: 4 }
      ]
    },
    {
      id: 5,
      name: 'Salud y Bienestar',
      subcategories: [
        { id: 37, name: 'Masajes', category_id: 5 },
        { id: 38, name: 'Fisioterapia', category_id: 5 },
        { id: 39, name: 'Quiropraxia', category_id: 5 },
        { id: 40, name: 'Terapias Alternativas', category_id: 5 },
        { id: 41, name: 'Yoga/Meditación', category_id: 5 },
        { id: 42, name: 'Personal Trainer', category_id: 5 },
        { id: 43, name: 'Nutricionista', category_id: 5 },
        { id: 44, name: 'Psicólogo', category_id: 5 },
        { id: 45, name: 'Enfermería a Domicilio', category_id: 5 }
      ]
    },
    {
      id: 6,
      name: 'Educación y Capacitación',
      subcategories: [
        { id: 46, name: 'Clases Particulares', category_id: 6 },
        { id: 47, name: 'Idiomas', category_id: 6 },
        { id: 48, name: 'Música', category_id: 6 },
        { id: 49, name: 'Arte y Pintura', category_id: 6 },
        { id: 50, name: 'Matemáticas', category_id: 6 },
        { id: 51, name: 'Ciencias', category_id: 6 },
        { id: 52, name: 'Capacitación Empresarial', category_id: 6 },
        { id: 53, name: 'Preparación de Exámenes', category_id: 6 }
      ]
    },
    {
      id: 7,
      name: 'Servicios Legales',
      subcategories: [
        { id: 54, name: 'Abogado Civil', category_id: 7 },
        { id: 55, name: 'Abogado Laboral', category_id: 7 },
        { id: 56, name: 'Abogado Familiar', category_id: 7 },
        { id: 57, name: 'Abogado Penal', category_id: 7 },
        { id: 58, name: 'Notario', category_id: 7 },
        { id: 59, name: 'Asesoría Legal', category_id: 7 },
        { id: 60, name: 'Tramitación de Documentos', category_id: 7 }
      ]
    },
    {
      id: 8,
      name: 'Seguridad y Vigilancia',
      subcategories: [
        { id: 61, name: 'Seguridad Privada', category_id: 8 },
        { id: 62, name: 'Vigilancia', category_id: 8 },
        { id: 63, name: 'Escolta', category_id: 8 },
        { id: 64, name: 'Custodia', category_id: 8 },
        { id: 65, name: 'Instalación de Alarmas', category_id: 8 },
        { id: 66, name: 'Monitoreo 24/7', category_id: 8 }
      ]
    },
    {
      id: 9,
      name: 'Transporte y Logística',
      subcategories: [
        { id: 67, name: 'Chofer Privado', category_id: 9 },
        { id: 68, name: 'Transporte Ejecutivo', category_id: 9 },
        { id: 69, name: 'Mudanzas', category_id: 9 },
        { id: 70, name: 'Delivery', category_id: 9 },
        { id: 71, name: 'Transporte de Mascotas', category_id: 9 },
        { id: 72, name: 'Mensajería', category_id: 9 }
      ]
    },
    {
      id: 10,
      name: 'Cuidado Personal y Asistencia',
      subcategories: [
        { id: 73, name: 'Cuidado de Adultos Mayores', category_id: 10 },
        { id: 74, name: 'Niñera', category_id: 10 },
        { id: 75, name: 'Asistente Personal', category_id: 10 },
        { id: 76, name: 'Cuidado de Mascotas', category_id: 10 },
        { id: 77, name: 'Paseo de Mascotas', category_id: 10 },
        { id: 78, name: 'Asistente Doméstico', category_id: 10 },
        { id: 79, name: 'Acompañante', category_id: 10 }
      ]
    },
    {
      id: 11,
      name: 'Eventos y Entretenimiento',
      subcategories: [
        { id: 80, name: 'Organización de Eventos', category_id: 11 },
        { id: 81, name: 'Decoración', category_id: 11 },
        { id: 82, name: 'Fotografía', category_id: 11 },
        { id: 83, name: 'Video', category_id: 11 },
        { id: 84, name: 'DJ', category_id: 11 },
        { id: 85, name: 'Música en Vivo', category_id: 11 },
        { id: 86, name: 'Animación', category_id: 11 },
        { id: 87, name: 'Magia', category_id: 11 }
      ]
    },
    {
      id: 12,
      name: 'Otros Servicios',
      subcategories: [
        { id: 88, name: 'Traducción', category_id: 12 },
        { id: 89, name: 'Redacción', category_id: 12 },
        { id: 90, name: 'Contabilidad', category_id: 12 },
        { id: 91, name: 'Asesoría Financiera', category_id: 12 },
        { id: 92, name: 'Servicios de Limpieza Especializada', category_id: 12 },
        { id: 93, name: 'Otro', category_id: 12 }
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
    this.priceText = this.formatCLP(this.formData.price);
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
    this.priceText = this.formatCLP(this.formData.price);

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
    this.priceText = this.formatCLP(this.formData.price);
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
    // Limpiar nombre seleccionado de subcategoría
    this.formData.custom_category = '';
  }

  onSubcategoryChange(event: any) {
    const subcategoryId = parseInt(event.target.value);
    this.selectedSubcategory = this.availableSubcategories.find(s => s.id === subcategoryId) || null;
    // No enviar category_id al backend (tabla valida categorías generales)
    // Enviar el nombre de la subcategoría como custom_category para pasar validación
    this.formData.category_id = null;
    this.formData.custom_category = this.selectedSubcategory?.name || '';
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

    // Si no hay category_id ni custom_category pero hay categoría principal elegida,
    // usar el id de la categoría principal (válido para backend)
    if (!this.formData.category_id && !this.formData.custom_category?.trim() && this.selectedCategory) {
      this.formData.category_id = this.selectedCategory.id;
    }

    // Validar nuevamente
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

  // Precio: formateo con miles en el mismo input manteniendo valor numérico
  onPriceInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digitsOnly = (input.value || '').replace(/\D+/g, '');
    const numericValue = digitsOnly ? Number(digitsOnly) : 0;
    this.formData.price = numericValue;
    this.priceText = this.formatCLP(numericValue);
  }

  private formatCLP(value: number | string): string {
    const num = typeof value === 'string' ? Number(value) || 0 : value || 0;
    return new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  }
}
