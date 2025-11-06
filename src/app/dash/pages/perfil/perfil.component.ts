import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProviderProfileService, BasicInfo as ServiceBasicInfo } from '../../../services/provider-profile.service';
import { ProfileProgressService } from '../../../services/profile-progress.service';
import { environment } from '../../../../environments/environment';
import { UiInputComponent } from '../../../../libs/shared-ui/ui-input/ui-input.component';
import { UiButtonComponent } from '../../../../libs/shared-ui/ui-button/ui-button.component';
import { AvatarUploaderComponent } from '../../../../libs/shared-ui/avatar-uploader/avatar-uploader.component';
import { LanguageSelectComponent } from '../../../../libs/shared-ui/language-select/language-select.component';
import { NotificationToggleComponent } from '../../../../libs/shared-ui/notification-toggle/notification-toggle.component';
import { InfoBasicaComponent, BasicInfo } from '../../../../libs/shared-ui/info-basica/info-basica.component';
import { MisServiciosComponent, ProviderService } from '../../../../libs/shared-ui/mis-servicios/mis-servicios.component';
import { ModalCrearServicioComponent, ServiceFormData } from '../../../../libs/shared-ui/modal-crear-servicio/modal-crear-servicio.component';
import { SobreMiComponent } from '../../../../libs/shared-ui/sobre-mi/sobre-mi.component';
import { ProgressPerfilComponent } from '../../../../libs/shared-ui/progress-perfil/progress-perfil.component';
import { SeccionFotosComponent } from '../../../../libs/shared-ui/seccion-fotos/seccion-fotos.component';
import { PortafolioComponent, PortfolioImage } from '../../../../libs/shared-ui/portafolio/portafolio.component';
import { PortfolioService } from '../../../services/portfolio.service';
import { TabsPerfilComponent, TabType } from '../../../../libs/shared-ui/tabs-perfil/tabs-perfil.component';
import { UbicacionDisponibilidadComponent, LocationSettings, CoverageZone } from '../../../../libs/shared-ui/ubicacion-disponibilidad/ubicacion-disponibilidad.component';
import { HorarioDisponibilidadComponent, WeeklySchedule } from '../../../../libs/shared-ui/horario-disponibilidad/horario-disponibilidad.component';
import { ProviderAvailabilityService } from '../../../services/provider-availability.service';
import { ExcepcionesFeriadosComponent, ExceptionDate } from '../../../../libs/shared-ui/excepciones-feriados/excepciones-feriados.component';
import { VerificacionPerfilComponent } from '../../../../libs/shared-ui/verificacion-perfil/verificacion-perfil.component';
import { OnlineStatusSwitchComponent } from '../../../../libs/shared-ui/online-status-switch/online-status-switch.component';
import { ReviewsComponent, ReviewsData } from '../../../../libs/shared-ui/reviews/reviews.component';

type PortfolioItemDisplay = PortfolioImage & { thumbnailUrl?: string | null; order?: number };

@Component({
  selector: 'app-d-perfil',
  standalone: true,
  imports: [
    CommonModule,
    UiInputComponent,
    UiButtonComponent,
    AvatarUploaderComponent,
    LanguageSelectComponent,
    NotificationToggleComponent,
    InfoBasicaComponent,
    MisServiciosComponent,
    ModalCrearServicioComponent,
    SobreMiComponent,
    ProgressPerfilComponent,
    SeccionFotosComponent,
    PortafolioComponent,
    TabsPerfilComponent,
    UbicacionDisponibilidadComponent,
    HorarioDisponibilidadComponent,
    ExcepcionesFeriadosComponent,
    VerificacionPerfilComponent,
    OnlineStatusSwitchComponent,
    ReviewsComponent
  ],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class DashPerfilComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private providerProfileService = inject(ProviderProfileService);
  private portfolioService = inject(PortfolioService);
  private availabilityService = inject(ProviderAvailabilityService);
  private progressService = inject(ProfileProgressService);

  ngOnInit() {
    // Leer query parameters para activar tab específico
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab = params['tab'] as TabType;
      }
    });

    // Cargar datos del perfil desde el backend
    this.loadProfileData();
  }

  // Marcar zona como principal
  onSetZonePrimary(zoneId: string) {
    if (!zoneId) return;
    this.providerProfileService.setCoverageZonePrimary(Number(zoneId)).subscribe({
      next: (resp) => {
        const zones = (resp?.zones || []) as any[];
        this.locationSettings = {
          ...this.locationSettings,
          coverageZones: zones.map((z: any) => ({ id: String(z.id), name: z.commune, isPrimary: !!z.is_primary }))
        };
        alert('✅ Zona marcada como principal');
      },
      error: (err) => {
        console.error('[PERFIL] Error al marcar zona principal', err);
        alert('❌ No se pudo marcar zona principal');
      }
    });
  }

  /**
   * Cargar todos los datos del perfil
   */
  private loadProfileData() {
    console.log('[PERFIL] Cargando datos del perfil...');
    
    // Cargar perfil básico
    this.providerProfileService.getProfile().subscribe({
      next: (profile) => {
        console.log('[PERFIL] Perfil cargado:', profile);
        this.updateLocalDataFromProfile(profile);
        this.updateProgress();
      },
      error: (err) => {
        console.error('[PERFIL] Error al cargar perfil:', err);
      }
    });

    // Cargar servicios
    this.providerProfileService.getServices().subscribe({
      next: (services) => {
        console.log('[PERFIL] Servicios cargados:', services);
        this.services = services.map(s => ({
          id: s.id || 0,
          name: s.name,
          description: s.description || '',
          duration_minutes: s.duration_minutes,
          price: s.price,
          category_id: s.category_id,
          custom_category: s.custom_category,
          service_image_url: s.service_image_url,
          is_active: s.is_active ?? true,
          is_featured: s.is_featured ?? false,
          order_index: s.order_index ?? 0,
          booking_count: s.booking_count ?? 0,
          average_rating: s.average_rating,
          created_at: s.created_at || new Date().toISOString(),
          updated_at: s.updated_at || new Date().toISOString()
        }));
      },
      error: (err) => {
        console.error('[PERFIL] Error al cargar servicios:', err);
      }
    });

    // Cargar portafolio
    this.providerProfileService.getPortfolio().subscribe({
      next: (portfolio) => {
        console.log('[PERFIL] Portafolio cargado:', portfolio);
        this.portfolioImages = this.normalizePortfolioItems(portfolio);
      },
      error: (err) => {
        console.error('[PERFIL] Error al cargar portafolio:', err);
      }
    });

    // Cargar zonas de cobertura
    this.providerProfileService.getCoverageZones().subscribe({
      next: (zones) => {
        console.log('[PERFIL] Zonas cargadas:', zones);
        this.locationSettings = {
          ...this.locationSettings,
          coverageZones: zones.map((z: any) => ({
            id: String(z.id),
            name: z.commune,
            isPrimary: !!z.is_primary
          }))
        };
      },
      error: (err) => {
        console.error('[PERFIL] Error al cargar zonas:', err);
      }
    });
  }

  /**
   * Actualizar datos locales desde el perfil del backend
   */
  private updateLocalDataFromProfile(profile: any) {
    this.name = profile.full_name;
    this.bio = profile.bio || '';
    // Asegurar URL absoluta para evitar 404 si viene como ruta relativa
    this.avatar = profile.profile_photo_url ? (
      profile.profile_photo_url.startsWith('http') ? profile.profile_photo_url : `${environment.apiBaseUrl}${profile.profile_photo_url}`
    ) : null;
    
    // Actualizar fotos del perfil - construir URLs completas
    this.profilePhoto = profile.profile_photo_url ? 
      `${environment.apiBaseUrl}${profile.profile_photo_url}` : null;
    this.coverPhoto = profile.cover_photo_url ? 
      `${environment.apiBaseUrl}${profile.cover_photo_url}` : null;
    
    this.basicInfo = {
      fullName: profile.full_name,
      professionalTitle: profile.professional_title || '',
      mainCommune: profile.main_commune || '',
      yearsExperience: profile.years_experience || 0
    };

    this.profileProgress = profile.profile_completion || 0;
    this.ratingAverage = profile.rating_average != null ? Number(profile.rating_average) : null;
    this.reviewCount = profile.review_count != null ? Number(profile.review_count) : 0;
    
    this.locationSettings = {
      ...this.locationSettings,
      availableForNewBookings: profile.is_online !== false,
      shareRealTimeLocation: profile.share_real_time_location || false
    };
  }

  // Datos básicos del perfil
  name = 'Elena Torres';
  bio = 'Estilista profesional con más de 5 años de experiencia en cortes modernos y coloración. Especializada en técnicas de color y cortes personalizados.';
  phone = '+56 9 1234 5678';
  avatar: string | null = 'https://placehold.co/96x96/C7D2FE/4338CA?text=ET';
  profilePhoto: string | null = null;
  coverPhoto: string | null = null;
  lang = 'es';
  emailNoti = true;
  pushNoti = true;

  // Datos para los nuevos componentes
  basicInfo: BasicInfo = {
    fullName: 'Elena Torres',
    professionalTitle: 'Estilista Profesional',
    mainCommune: 'Providencia',
    yearsExperience: 5
  };

  services: ProviderService[] = [
    { 
      id: 1, 
      name: 'Corte de Pelo', 
      description: 'Corte de pelo profesional con lavado incluido',
      duration_minutes: 60, 
      price: 25000,
      is_active: true,
      is_featured: true,
      order_index: 0,
      booking_count: 15,
      average_rating: 4.8,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    },
    { 
      id: 2, 
      name: 'Manicura', 
      description: 'Manicura completa con esmaltado',
      duration_minutes: 45, 
      price: 15000,
      is_active: true,
      is_featured: false,
      order_index: 1,
      booking_count: 8,
      average_rating: 4.5,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    },
    { 
      id: 3, 
      name: 'Maquillaje Profesional', 
      description: 'Maquillaje para eventos especiales',
      duration_minutes: 75, 
      price: 30000,
      is_active: true,
      is_featured: false,
      order_index: 2,
      booking_count: 5,
      average_rating: 4.9,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    }
  ];

  portfolioImages: PortfolioItemDisplay[] = [
    { id: '1', url: 'https://placehold.co/400x300/ddd6fe/4338ca?text=Corte+1', alt: 'Corte de pelo', type: 'image', thumbnailUrl: null, order: 0 },
    { id: '2', url: 'https://placehold.co/400x300/ddd6fe/4338ca?text=Coloraci%C3%B3n', alt: 'Coloración', type: 'image', thumbnailUrl: null, order: 1 },
    { id: '3', url: 'https://placehold.co/400x300/ddd6fe/4338ca?text=Peinado', alt: 'Peinado elegante', type: 'image', thumbnailUrl: null, order: 2 },
    { id: '4', url: 'https://placehold.co/400x300/ddd6fe/4338ca?text=Maquillaje', alt: 'Maquillaje profesional', type: 'image', thumbnailUrl: null, order: 3 },
    { id: '5', url: 'https://placehold.co/400x300/ddd6fe/4338ca?text=Manicura', alt: 'Manicura artística', type: 'image', thumbnailUrl: null, order: 4 }
  ];

  portfolioPreviewLimit = 6;
  portfolioLightboxOpen = false;
  portfolioLightboxIndex = 0;

  profileProgress = 75;
  ratingAverage: number | null = null;
  reviewCount = 0;

  // Reseñas públicas para el preview
  publicReviewsData: ReviewsData = {
    title: 'Lo que dicen sus clientes',
    reviews: [],
    showAllButton: true
  };

  // Estado de las tabs
  activeTab: TabType = 'perfil-publico';

  // Estado del modal de servicios
  showServiceModal = false;
  editingService: ProviderService | null = null;
  savingService = false;

  // Estado de las fotos
  savingPhotos = false;
  photosHasChanges = false;

  // Estados de carga
  savingPublicProfile = false;
  savingBasicInfo = false;
  
  get activePortfolioItem(): PortfolioItemDisplay | null {
    return this.portfolioImages[this.portfolioLightboxIndex] ?? null;
  }

  // Estados de cambios por sección
  basicInfoHasChanges = false;
  
  // Referencia al componente mis-servicios
  @ViewChild('misServiciosComponent') misServiciosComponent: any;

  // Datos para ubicación y disponibilidad
  locationSettings: LocationSettings = {
    availableForNewBookings: true,
    shareRealTimeLocation: false,
    coverageZones: [
      { id: '1', name: 'Providencia' },
      { id: '2', name: 'Las Condes' },
      { id: '3', name: 'Ñuñoa' }
    ]
  };

  // Datos para horario semanal
  weeklySchedule: WeeklySchedule = {
    days: [
      {
        day: 'Lunes',
        enabled: true,
        timeBlocks: [
          { id: '1', start: '09:00', end: '18:00' }
        ]
      },
      {
        day: 'Martes',
        enabled: false,
        timeBlocks: []
      },
      {
        day: 'Miércoles',
        enabled: true,
        timeBlocks: [
          { id: '2', start: '09:00', end: '18:00' }
        ]
      },
      {
        day: 'Jueves',
        enabled: true,
        timeBlocks: [
          { id: '3', start: '09:00', end: '18:00' }
        ]
      },
      {
        day: 'Viernes',
        enabled: true,
        timeBlocks: [
          { id: '4', start: '09:00', end: '18:00' }
        ]
      },
      {
        day: 'Sábado',
        enabled: true,
        timeBlocks: [
          { id: '5', start: '10:00', end: '16:00' }
        ]
      },
      {
        day: 'Domingo',
        enabled: false,
        timeBlocks: []
      }
    ]
  };

  // Datos para excepciones
  exceptions: ExceptionDate[] = [
    {
      id: '1',
      date: '2025-10-05',
      reason: 'Ejemplo: Día de Limpieza/Mantenimiento'
    }
  ];

  // Event handlers para los componentes
  onBasicInfoChange(info: BasicInfo) {
    this.basicInfo = info;
    this.basicInfoHasChanges = true;
    this.updateProgress();
  }

  onSaveBasicInfo(info: BasicInfo) {
    console.log('[PERFIL] Guardando información básica manualmente:', info);
    this.savingBasicInfo = true;
    
    // Actualizar información básica
    const profileData: ServiceBasicInfo = {
      fullName: info.fullName,
      professionalTitle: info.professionalTitle,
      mainCommune: info.mainCommune,
      yearsExperience: info.yearsExperience
    };

    this.providerProfileService.updateBasicInfo(profileData).subscribe({
      next: (response) => {
        console.log('[PERFIL] Información básica guardada:', response);
        this.updateProgress();
        this.basicInfoHasChanges = false;
        this.savingBasicInfo = false;
        alert('✅ Información básica guardada correctamente');
      },
      error: (err) => {
        console.error('[PERFIL] Error al guardar información básica:', err);
        this.savingBasicInfo = false;
        alert('❌ Error al guardar información básica');
      }
    });
  }

  // Métodos para manejar las fotos
  onPhotosChange() {
    this.photosHasChanges = true;
    this.updateProgress();
  }

  onSavePhotos(files: {profilePhoto?: File, coverPhoto?: File}) {
    console.log('[PERFIL] Guardando fotos:', files);
    this.savingPhotos = true;
    
    // Subir foto de perfil si existe
    if (files.profilePhoto) {
      this.providerProfileService.uploadPhoto(files.profilePhoto, 'profile').subscribe({
        next: (response) => {
          console.log('[PERFIL] Foto de perfil subida:', response);
          // Actualizar la URL de la foto de perfil
          if (response.profile_photo_url) {
            this.profilePhoto = response.profile_photo_url;
          }
          this.updateProgress();
        },
        error: (err) => {
          console.error('[PERFIL] Error al subir foto de perfil:', err);
        }
      });
    }
    
    // Subir foto de portada si existe
    if (files.coverPhoto) {
      this.providerProfileService.uploadPhoto(files.coverPhoto, 'cover').subscribe({
        next: (response) => {
          console.log('[PERFIL] Foto de portada subida:', response);
          // Actualizar la URL de la foto de portada
          if (response.cover_photo_url) {
            this.coverPhoto = response.cover_photo_url;
          }
          this.updateProgress();
        },
        error: (err) => {
          console.error('[PERFIL] Error al subir foto de portada:', err);
        },
        complete: () => {
          // Finalizar el proceso cuando ambas fotos se hayan subido
          this.savingPhotos = false;
          this.photosHasChanges = false;
          alert('✅ Fotos guardadas correctamente');
        }
      });
    } else {
      // Si solo se subió la foto de perfil
      this.savingPhotos = false;
      this.photosHasChanges = false;
      alert('✅ Fotos guardadas correctamente');
    }
  }

  onEditService(service: ProviderService) {
    console.log('[PERFIL] Editar servicio:', service);
    this.editingService = service;
    this.showServiceModal = true;
  }

  onDeleteService(serviceId: number) {
    console.log('[PERFIL] Eliminar servicio:', serviceId);

    this.providerProfileService.deleteService(serviceId).subscribe({
      next: () => {
        console.log('[PERFIL] Servicio eliminado');
        this.services = this.services.filter(s => s.id !== serviceId);
        this.updateProgress();
        // Notificar al componente hijo que la eliminación se completó
        this.notifyDeleteComplete();
      },
      error: (err) => {
        console.error('[PERFIL] Error al eliminar servicio:', err);
        // Notificar al componente hijo que hubo un error
        this.notifyDeleteError();
      }
    });
  }

  private notifyDeleteComplete() {
    // Notificar al componente mis-servicios que la eliminación se completó
    if (this.misServiciosComponent) {
      this.misServiciosComponent.onDeleteComplete();
    }
  }

  private notifyDeleteError() {
    // Notificar al componente mis-servicios que hubo un error
    if (this.misServiciosComponent) {
      this.misServiciosComponent.onCancelDelete();
    }
  }

  onAddService() {
    console.log('[PERFIL] 🟢 Abriendo modal para agregar nuevo servicio');
    console.log('[PERFIL] 🟢 showServiceModal antes:', this.showServiceModal);
    this.editingService = null;
    this.showServiceModal = true;
    console.log('[PERFIL] 🟢 showServiceModal después:', this.showServiceModal);
    console.log('[PERFIL] 🟢 editingService:', this.editingService);
  }

  onCloseServiceModal() {
    console.log('[PERFIL] 🔴 Cerrando modal de servicio');
    console.log('[PERFIL] 🔴 showServiceModal antes:', this.showServiceModal);
    this.showServiceModal = false;
    this.editingService = null;
    this.savingService = false;
    console.log('[PERFIL] 🔴 showServiceModal después:', this.showServiceModal);
  }

  onSaveService(serviceData: ServiceFormData) {
    console.log('[PERFIL] ===== INICIANDO onSaveService =====');
    console.log('[PERFIL] 🎯 MÉTODO onSaveService EJECUTÁNDOSE');
    console.log('[PERFIL] 🎯 showServiceModal estado:', this.showServiceModal);
    console.log('[PERFIL] serviceData recibido:', serviceData);
    console.log('[PERFIL] editingService:', this.editingService);
    console.log('[PERFIL] savingService antes:', this.savingService);
    console.log('[PERFIL] providerProfileService disponible:', !!this.providerProfileService);
    
    this.savingService = true;
    console.log('[PERFIL] savingService después:', this.savingService);
    console.log('[PERFIL] 🎯 INICIANDO PETICIÓN HTTP AL BACKEND');
    
    if (this.editingService) {
      console.log('[PERFIL] Modo: ACTUALIZAR servicio existente');
      // Actualizar servicio existente
      this.providerProfileService.updateService(this.editingService.id, serviceData).subscribe({
        next: (response: any) => {
          console.log('[PERFIL] ✅ Servicio actualizado exitosamente:', response);
          
          // Actualizar el servicio en la lista local
          const index = this.services.findIndex(s => s.id === this.editingService!.id);
          if (index !== -1) {
            this.services[index] = { ...this.services[index], ...serviceData };
          }
          
          this.updateProgress();
          alert('✅ Servicio actualizado correctamente');
          this.savingService = false;
          this.onCloseServiceModal();
        },
        error: (err: any) => {
          console.error('[PERFIL] ❌ Error al actualizar servicio:', err);
          alert('❌ Error al actualizar servicio');
          this.savingService = false;
        }
      });
          } else {
            console.log('[PERFIL] Modo: CREAR nuevo servicio');
            console.log('[PERFIL] Llamando a providerProfileService.addService...');
            console.log('[PERFIL] 🚀 EJECUTANDO HTTP POST AL BACKEND');
            
            // Crear nuevo servicio
            this.providerProfileService.addService(serviceData).subscribe({
        next: (response: any) => {
          console.log('[PERFIL] ✅ Servicio creado exitosamente:', response);
          console.log('[PERFIL] ✅ Respuesta completa del backend:', response);
          
          // Agregar el nuevo servicio a la lista local
          if (response.service) {
            console.log('[PERFIL] Agregando servicio a lista local:', response.service);
            this.services.push(response.service);
          } else {
            console.log('[PERFIL] ⚠️ response.service es undefined/null');
          }
          
          this.updateProgress();
          alert('✅ Servicio creado correctamente');
          this.savingService = false;
          this.onCloseServiceModal();
        },
        error: (err: any) => {
          console.error('[PERFIL] ❌ Error al crear servicio:', err);
          console.error('[PERFIL] ❌ Error completo:', err);
          console.error('[PERFIL] ❌ Error status:', err.status);
          console.error('[PERFIL] ❌ Error message:', err.message);
          const backendMsg = (err && err.error && err.error.error) ? String(err.error.error) : 'Error al crear servicio';
          alert('❌ ' + backendMsg);
          this.savingService = false;
        }
      });
    }
    
    console.log('[PERFIL] ===== FINALIZANDO onSaveService =====');
    console.log('[PERFIL] 🏁 onSaveService COMPLETADO');
  }

  /**
   * Actualizar el progreso del perfil
   */
  private updateProgress() {
    const progressData = {
      basicInfo: {
        fullName: !!this.basicInfo.fullName?.trim(),
        professionalTitle: !!this.basicInfo.professionalTitle?.trim(),
        mainCommune: !!this.basicInfo.mainCommune?.trim(),
        yearsExperience: !!this.basicInfo.yearsExperience && this.basicInfo.yearsExperience > 0
      },
      bio: !!this.bio?.trim(),
      profilePhoto: !!this.avatar,
      coverPhoto: !!this.coverPhoto,
      services: this.services.length,
      portfolio: this.portfolioImages.length,
      coverageZones: this.locationSettings.coverageZones.length,
      schedule: this.weeklySchedule.days.some((day: any) => day.isAvailable)
    };

    this.progressService.updateProgress(progressData);
  }

  onBioChange(bio: string) {
    this.bio = bio;
  }

  onProfilePhotoChange(imageUrl: string) {
    console.log('Foto de perfil actualizada:', imageUrl);
    // La imagen se actualiza automáticamente en el componente
  }

  onCoverPhotoChange(imageUrl: string) {
    console.log('Foto de portada actualizada:', imageUrl);
    // La imagen se actualiza automáticamente en el componente
  }

  onAddPortfolioImage() {
    console.log('[PERFIL] Agregar imagen al portafolio');
    
    // Crear input file dinámicamente
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/jpg,image/png,image/webp';
    
    input.onchange = (event: any) => {
      const file = event.target?.files?.[0];
      if (!file) return;

      // Validar tamaño (máx 6MB por defecto, alineado con backend)
      const maxMb = Number((window as any)?.PORTFOLIO_IMAGE_MAX_MB || 6);
      if (file.size > maxMb * 1024 * 1024) {
        alert(`❌ El archivo es muy grande. Máximo ${maxMb}MB`);
        return;
      }

      console.log('[PERFIL] Firmando subida S3 para imagen...', file.name);
      this.portfolioService.signUpload({ type: 'image', contentType: file.type, sizeBytes: file.size }).subscribe({
        next: async (sig) => {
          try {
            // PUT a S3
            const putResp = await fetch(sig.uploadUrl, { method: 'PUT', headers: sig.headers, body: file });
            if (!putResp.ok) throw new Error(`PUT S3 failed: ${putResp.status}`);

            // Finalizar en backend
            this.portfolioService.finalizeUpload({ type: 'image', key: sig.key, url: sig.url, sizeBytes: file.size, mimeType: file.type }).subscribe({
              next: () => {
                alert('✅ Imagen agregada al portafolio');
                // Refrescar lista
                this.providerProfileService.getPortfolio().subscribe({
                  next: (portfolio) => {
                    this.portfolioImages = this.normalizePortfolioItems(portfolio);
                  }
                });
              },
              error: (err) => {
                console.error('[PERFIL] Error finalizando subida:', err);
                alert('❌ Error al registrar la imagen');
              }
            });
          } catch (e: any) {
            console.error('[PERFIL] Error subiendo a S3', e);
            alert('❌ Error subiendo a S3');
          }
        },
        error: (err) => {
          console.error('[PERFIL] Error firmando subida:', err);
          alert('❌ No se pudo firmar la subida');
        }
      });
    };
    
    input.click();
  }

  onAddPortfolioVideo() {
    console.log('[PERFIL] Agregar video al portafolio');
    alert('📹 Función de subida de videos próximamente. Por ahora solo imágenes.');
    // TODO: Implementar uploader de videos
  }

  onDeletePortfolioImage(imageId: string) {
    console.log('[PERFIL] Eliminar imagen del portafolio:', imageId);
    
    if (!confirm('¿Estás seguro de que deseas eliminar esta imagen?')) {
      return;
    }

    this.providerProfileService.deletePortfolioItem(Number(imageId)).subscribe({
      next: () => {
        console.log('[PERFIL] Imagen eliminada del portafolio');
        this.portfolioImages = this.portfolioImages.filter(img => img.id !== imageId);
        alert('✅ Imagen eliminada correctamente');
      },
      error: (err) => {
        console.error('[PERFIL] Error al eliminar imagen:', err);
        alert('❌ Error al eliminar imagen');
      }
    });
  }

  // Event handlers para tabs
  onTabChange(tab: TabType) {
    this.activeTab = tab;
    console.log('[PERFIL] Tab cambiado a:', tab);
    
    // Cargar datos específicos cuando se cambie al perfil público
    if (tab === 'perfil-publico') {
      this.loadPublicProfileData();
    }
  }

  private loadPublicProfileData() {
    console.log('[PERFIL] Cargando datos del perfil público...');
    
    // Los datos básicos ya están cargados en loadProfileData()
    // Solo necesitamos asegurarnos de que los servicios y portafolio estén actualizados
    
    // Recargar servicios si no están cargados
    if (this.services.length === 0) {
      this.providerProfileService.getServices().subscribe({
        next: (services) => {
          console.log('[PERFIL] Servicios cargados para perfil público:', services);
          this.services = services.map(s => ({
            id: s.id || 0,
            name: s.name,
            description: s.description || '',
            duration_minutes: s.duration_minutes,
            price: s.price,
            category_id: s.category_id,
            custom_category: s.custom_category,
            service_image_url: s.service_image_url,
            is_active: s.is_active ?? true,
            is_featured: s.is_featured ?? false,
            order_index: s.order_index ?? 0,
            booking_count: s.booking_count ?? 0,
            average_rating: s.average_rating,
            created_at: s.created_at || new Date().toISOString(),
            updated_at: s.updated_at || new Date().toISOString()
          }));
        },
        error: (err) => {
          console.error('[PERFIL] Error al cargar servicios para perfil público:', err);
        }
      });
    }
    
    // Recargar portafolio si no está cargado
    if (this.portfolioImages.length === 0) {
      this.providerProfileService.getPortfolio().subscribe({
        next: (portfolio) => {
          console.log('[PERFIL] Portafolio cargado para perfil público:', portfolio);
          this.portfolioImages = this.normalizePortfolioItems(portfolio);
        },
        error: (err) => {
          console.error('[PERFIL] Error al cargar portafolio para perfil público:', err);
        }
      });
    }

    // Cargar reseñas públicas del proveedor (si hay id en el perfil cargado)
    const providerId = (this as any)?.providerId || 0;
    if (providerId) {
      fetch(`${environment.apiBaseUrl}/providers/${providerId}/reviews`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adomi_access_token') || ''}` }
      }).then(r => r.json()).then(resp => {
        if (resp?.success && Array.isArray(resp.reviews)) {
          this.publicReviewsData = {
            title: 'Lo que dicen sus clientes',
            reviews: resp.reviews.map((r: any, idx: number) => {
              const name = String(r.client_name || 'Cliente');
              const initials = name.trim().split(/\s+/).slice(0,2).map((p: string) => p.charAt(0).toUpperCase()).join('') || 'CL';
              let dateStr = '';
              try { const dt = new Date(r.created_at); if (!isNaN(dt.getTime())) dateStr = dt.toLocaleDateString('es-CL'); } catch {}
              return { id: String(r.id ?? idx), clientName: name, clientInitials: initials, rating: Number(r.rating||0), date: dateStr, text: String(r.comment||'') };
            }),
            showAllButton: true
          };
        }
      }).catch(() => {});
    }
  }

  // Event handlers para ubicación y disponibilidad
  onLocationSettingsChange(settings: LocationSettings) {
    this.locationSettings = settings;
  }

  onRequestCurrentLocation() {
    if (!navigator?.geolocation) {
      alert('Geolocalización no disponible en este navegador/dispositivo');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        this.providerProfileService.updateCurrentLocation({ lat, lng }).subscribe({
          next: () => {
            // Si el proveedor comparte ubicación, aseguramos persistir el flag también
            this.providerProfileService.updateAvailability({
              share_real_time_location: true
            }).subscribe();
            alert('✅ Ubicación actualizada');
          },
          error: (err) => {
            console.error('[PERFIL] Error al actualizar ubicación actual', err);
            alert('❌ No se pudo actualizar la ubicación');
          }
        });
      },
      (err) => {
        console.error('[PERFIL] Geolocation error', err);
        alert('❌ Permiso de ubicación denegado o no disponible');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }

  onOnlineToggle(isOnline: boolean) {
    this.locationSettings = { ...this.locationSettings, availableForNewBookings: isOnline };
    // Guardar online/offline inmediato
    this.providerProfileService.updateAvailability({
      is_online: isOnline,
      share_real_time_location: this.locationSettings.shareRealTimeLocation
    }).subscribe({
      next: () => console.log('[PERFIL] Online status actualizado a', isOnline),
      error: (err) => console.error('[PERFIL] Error actualizando Online status:', err)
    });
  }

  onAddCoverageZone(zoneName: string) {
    console.log('[PERFIL] Agregar zona de cobertura:', zoneName);
    
    // TODO: Obtener región desde un servicio de comunas
    const region = 'Región Metropolitana';

    this.providerProfileService.addCoverageZone({
      commune: zoneName,
      region: region
    }).subscribe({
      next: (zone) => {
        console.log('[PERFIL] Zona agregada:', zone);
        const newZone: CoverageZone = {
          id: String(zone.id),
          name: zoneName
        };
        this.locationSettings = {
          ...this.locationSettings,
          coverageZones: [...this.locationSettings.coverageZones, newZone]
        };
        alert('✅ Zona agregada correctamente');
      },
      error: (err) => {
        console.error('[PERFIL] Error al agregar zona:', err);
        alert('❌ Error al agregar zona');
      }
    });
  }

  onRemoveCoverageZone(zoneId: string) {
    console.log('[PERFIL] Eliminar zona de cobertura:', zoneId);
    
    if (!confirm('¿Estás seguro de que deseas eliminar esta zona?')) {
      return;
    }

    this.providerProfileService.deleteCoverageZone(Number(zoneId)).subscribe({
      next: () => {
        console.log('[PERFIL] Zona eliminada');
        this.locationSettings = {
          ...this.locationSettings,
          coverageZones: this.locationSettings.coverageZones.filter(zone => zone.id !== zoneId)
        };
        alert('✅ Zona eliminada correctamente');
      },
      error: (err) => {
        console.error('[PERFIL] Error al eliminar zona:', err);
        alert('❌ Error al eliminar zona');
      }
    });
  }

  // Guardar coordenadas precisas de una zona y refrescar la lista
  onSetZoneLocation(evt: { zoneId: string; lat: number; lng: number }) {
    const { zoneId, lat, lng } = evt || ({} as any);
    if (!zoneId || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    this.providerProfileService.updateCoverageZoneLocation(Number(zoneId), { lat, lng }).subscribe({
      next: () => {
        this.providerProfileService.getCoverageZones().subscribe({
          next: (zones) => {
            this.locationSettings = {
              ...this.locationSettings,
              coverageZones: zones.map((z: any) => ({ id: String(z.id), name: z.commune }))
            };
            alert('✅ Punto guardado para la zona');
          },
          error: () => {}
        });
      },
      error: (err) => {
        if (err?.status === 404) {
          // Fallback temporal: guardar como ubicación actual del provider
          this.providerProfileService.updateCurrentLocation({ lat, lng }).subscribe({
            next: () => {
              alert('✅ Punto guardado como ubicación actual (temporal). Actualiza backend para guardar por zona.');
            },
            error: () => {
              alert('❌ No se pudo guardar la ubicación');
            }
          });
          return;
        }
        console.error('[PERFIL] Error guardando coordenadas de zona', err);
        alert('❌ No se pudo guardar el punto de la zona');
      }
    });
  }

  // Event handlers para horario
  onScheduleChange(schedule: WeeklySchedule) {
    this.weeklySchedule = schedule;
  }

  onAddTimeBlock(data: { day: string; block: any }) {
    console.log('Agregar bloque de tiempo:', data);
    // La lógica ya está en el componente
  }

  onRemoveTimeBlock(data: { day: string; blockId: string }) {
    console.log('Remover bloque de tiempo:', data);
    // La lógica ya está en el componente
  }

  onToggleDay(data: { day: string; enabled: boolean }) {
    console.log('Toggle día:', data);
    // La lógica ya está en el componente
  }

  // Event handlers para excepciones
  onExceptionsChange(exceptions: ExceptionDate[]) {
    this.exceptions = exceptions;
  }

  onAddException(data: { date: string; reason?: string }) {
    console.log('Agregar excepción:', data);
    // La lógica ya está en el componente
  }

  onRemoveException(exceptionId: string) {
    console.log('Remover excepción:', exceptionId);
    // La lógica ya está en el componente
  }

  save() { 
    console.log('Guardando perfil...', {
      name: this.name,
      bio: this.bio,
      phone: this.phone,
      avatar: this.avatar,
      basicInfo: this.basicInfo,
      services: this.services,
      portfolioImages: this.portfolioImages
    });
    // TODO: Implementar persistencia
  }

  // Guardar horario semanal desde el tab Configuración del Perfil
  savingWeeklySchedule = false;
  saveWeeklySchedule() {
    this.savingWeeklySchedule = true;
    // 1) Cargar bloques existentes
    this.availabilityService.getWeekly().subscribe({
      next: (resp) => {
        const existing = resp.blocks || [];
        const mapDay: Record<string, any> = {
          'Lunes':'monday','Martes':'tuesday','Miércoles':'wednesday','Jueves':'thursday','Viernes':'friday','Sábado':'saturday','Domingo':'sunday'
        };

        const keyExisting = (b: any) => `${b.day_of_week}|${String(b.start_time).slice(0,5)}|${String(b.end_time).slice(0,5)}`;
        const existingMap = new Map(existing.map(b => [keyExisting(b), b]));

        const tasks: Array<Promise<any>> = [];

        // Crear/actualizar según weeklySchedule
        this.weeklySchedule.days.forEach(day => {
          const dayEnum = mapDay[day.day];
          if (!day.enabled) {
            // si el día está desactivado, eliminar bloques existentes de ese día
            existing
              .filter((b: any) => b.day_of_week === dayEnum)
              .forEach((b: any) => tasks.push(this.availabilityService.deleteWeekly(b.id).toPromise()));
            return;
          }
          day.timeBlocks.forEach(block => {
            const k = `${dayEnum}|${block.start}|${block.end}`;
            const found = existingMap.get(k);
            if (found) {
              tasks.push(this.availabilityService.updateWeekly(found.id, { is_active: true }).toPromise());
              existingMap.delete(k);
            } else {
              tasks.push(this.availabilityService.createWeekly(dayEnum, block.start, block.end, true).toPromise());
            }
          });
        });

        // Eliminar los bloques restantes no usados
        existingMap.forEach((b) => {
          tasks.push(this.availabilityService.deleteWeekly(b.id).toPromise());
        });

        Promise.allSettled(tasks).then(() => {
          this.savingWeeklySchedule = false;
          alert('✅ Horario guardado correctamente');
        });
      },
      error: () => {
        this.savingWeeklySchedule = false;
        alert('❌ Error al guardar horario');
      }
    });
  }

  savePublicProfile() {
    this.savingPublicProfile = true;
    console.log('[PERFIL] Guardando perfil público...', {
      basicInfo: this.basicInfo,
      bio: this.bio,
      locationSettings: this.locationSettings
    });

    // Actualizar información básica y bio
    const profileData: ServiceBasicInfo & { bio?: string } = {
      fullName: this.basicInfo.fullName,
      professionalTitle: this.basicInfo.professionalTitle,
      mainCommune: this.basicInfo.mainCommune,
      yearsExperience: this.basicInfo.yearsExperience
    };

    this.providerProfileService.updateBasicInfo(profileData).subscribe({
      next: () => {
        console.log('[PERFIL] Información básica actualizada');
        
        // Actualizar bio
        if (this.bio) {
          this.providerProfileService.updateBio(this.bio).subscribe({
            next: () => {
              console.log('[PERFIL] Bio actualizada');
              
              // Actualizar disponibilidad
              this.providerProfileService.updateAvailability({
                is_online: this.locationSettings.availableForNewBookings,
                share_real_time_location: this.locationSettings.shareRealTimeLocation
              }).subscribe({
                next: () => {
                  console.log('[PERFIL] Disponibilidad actualizada');
                  this.savingPublicProfile = false;
                  alert('✅ Perfil guardado exitosamente');
                },
                error: (err) => {
                  console.error('[PERFIL] Error al actualizar disponibilidad:', err);
                  this.savingPublicProfile = false;
                  alert('❌ Error al guardar disponibilidad');
                }
              });
            },
            error: (err) => {
              console.error('[PERFIL] Error al actualizar bio:', err);
              this.savingPublicProfile = false;
              alert('❌ Error al guardar biografía');
            }
          });
        } else {
          // Si no hay bio, solo actualizar disponibilidad
          this.providerProfileService.updateAvailability({
            is_online: this.locationSettings.availableForNewBookings,
            share_real_time_location: this.locationSettings.shareRealTimeLocation
          }).subscribe({
            next: () => {
              console.log('[PERFIL] Disponibilidad actualizada');
              this.savingPublicProfile = false;
              alert('✅ Perfil guardado exitosamente');
            },
            error: (err) => {
              console.error('[PERFIL] Error al actualizar disponibilidad:', err);
              this.savingPublicProfile = false;
              alert('❌ Error al guardar disponibilidad');
            }
          });
        }
      },
      error: (err) => {
        console.error('[PERFIL] Error al actualizar información básica:', err);
        this.savingPublicProfile = false;
        alert('❌ Error al guardar perfil');
      }
    });
  }

  // Métodos para el tab "Ver Perfil Público"
  openPublicProfile() {
    // Aquí se puede implementar la navegación al perfil público real
    // Por ejemplo: this.router.navigate(['/client/explorar', 'worker-id']);
    console.log('Abriendo perfil público...');
    // Por ahora, abrir en una nueva ventana
    window.open('/client/explorar/1', '_blank');
  }

  shareProfile() {
    // Implementar funcionalidad de compartir perfil
    console.log('Compartiendo perfil...');
    if (navigator.share) {
      navigator.share({
        title: `${this.basicInfo.fullName} - ${this.basicInfo.professionalTitle}`,
        text: this.bio,
        url: '/client/explorar/1'
      });
    } else {
      // Fallback: copiar URL al portapapeles
      navigator.clipboard.writeText(window.location.origin + '/client/explorar/1');
      alert('URL del perfil copiada al portapapeles');
    }
  }

  openPortfolioLightbox(index: number) {
    if (!this.portfolioImages.length) {
      return;
    }
    this.portfolioLightboxIndex = Math.max(0, Math.min(index, this.portfolioImages.length - 1));
    this.portfolioLightboxOpen = true;
    document.body.classList.add('portfolio-lightbox-open');
  }

  closePortfolioLightbox() {
    this.portfolioLightboxOpen = false;
    document.body.classList.remove('portfolio-lightbox-open');
  }

  nextPortfolioItem() {
    if (!this.portfolioImages.length) return;
    this.portfolioLightboxIndex = (this.portfolioLightboxIndex + 1) % this.portfolioImages.length;
  }

  previousPortfolioItem() {
    if (!this.portfolioImages.length) return;
    this.portfolioLightboxIndex = (this.portfolioLightboxIndex - 1 + this.portfolioImages.length) % this.portfolioImages.length;
  }

  goToPortfolioItem(index: number) {
    if (index < 0 || index >= this.portfolioImages.length) return;
    this.portfolioLightboxIndex = index;
  }

  private normalizePortfolioItems(portfolio: any[]): PortfolioItemDisplay[] {
    const fallbackPrefix = `pf-${Date.now()}-`;
    let counter = 0;

    return (portfolio || [])
      .map((item: any) => {
        if (!item) return null;
        const resolvedUrl = this.resolvePortfolioUrl(item.file_url);
        if (!resolvedUrl) return null;

        const type: 'image' | 'video' = item.file_type === 'video' ? 'video' : 'image';
        const thumbnailUrl = this.resolvePortfolioUrl(item.thumbnail_url) || resolvedUrl;
        const order = typeof item.order_index === 'number' ? item.order_index : undefined;
        const id = item.id != null ? String(item.id) : `${fallbackPrefix}${counter++}`;

        return {
          id,
          url: resolvedUrl,
          alt: item.title || 'Portfolio image',
          type,
          thumbnailUrl,
          order
        } as PortfolioItemDisplay;
      })
      .filter((item): item is PortfolioItemDisplay => !!item)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  get hasReviews(): boolean {
    return (this.reviewCount ?? 0) > 0;
  }

  get ratingStars(): string {
    const rating = Math.max(0, Math.min(5, Math.round((this.ratingAverage ?? 0))));
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  get ratingSummary(): string {
    if (this.hasReviews) {
      return `${(this.ratingAverage ?? 0).toFixed(1)} (${this.reviewCount} reseñas)`;
    }
    return 'Sin reseñas aún';
  }

  private resolvePortfolioUrl(url?: string | null): string | null {
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    if (url.startsWith('/')) {
      return `${environment.apiBaseUrl}${url}`;
    }
    return `${environment.apiBaseUrl}/${url}`;
  }
}
