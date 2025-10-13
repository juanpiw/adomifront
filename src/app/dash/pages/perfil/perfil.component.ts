import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProviderProfileService, BasicInfo as ServiceBasicInfo } from '../../../services/provider-profile.service';
import { ProfileProgressService } from '../../../services/profile-progress.service';
import { UiInputComponent } from '../../../../libs/shared-ui/ui-input/ui-input.component';
import { UiButtonComponent } from '../../../../libs/shared-ui/ui-button/ui-button.component';
import { AvatarUploaderComponent } from '../../../../libs/shared-ui/avatar-uploader/avatar-uploader.component';
import { LanguageSelectComponent } from '../../../../libs/shared-ui/language-select/language-select.component';
import { NotificationToggleComponent } from '../../../../libs/shared-ui/notification-toggle/notification-toggle.component';
import { InfoBasicaComponent, BasicInfo } from '../../../../libs/shared-ui/info-basica/info-basica.component';
import { MisServiciosComponent, Service, ProviderService } from '../../../../libs/shared-ui/mis-servicios/mis-servicios.component';
import { ModalCrearServicioComponent, ServiceFormData } from '../../../../libs/shared-ui/modal-crear-servicio/modal-crear-servicio.component';
import { SobreMiComponent } from '../../../../libs/shared-ui/sobre-mi/sobre-mi.component';
import { ProgressPerfilComponent } from '../../../../libs/shared-ui/progress-perfil/progress-perfil.component';
import { SeccionFotosComponent } from '../../../../libs/shared-ui/seccion-fotos/seccion-fotos.component';
import { PortafolioComponent, PortfolioImage } from '../../../../libs/shared-ui/portafolio/portafolio.component';
import { TabsPerfilComponent, TabType } from '../../../../libs/shared-ui/tabs-perfil/tabs-perfil.component';
import { UbicacionDisponibilidadComponent, LocationSettings, CoverageZone } from '../../../../libs/shared-ui/ubicacion-disponibilidad/ubicacion-disponibilidad.component';
import { HorarioDisponibilidadComponent, WeeklySchedule } from '../../../../libs/shared-ui/horario-disponibilidad/horario-disponibilidad.component';
import { ExcepcionesFeriadosComponent, ExceptionDate } from '../../../../libs/shared-ui/excepciones-feriados/excepciones-feriados.component';
import { VerificacionPerfilComponent } from '../../../../libs/shared-ui/verificacion-perfil/verificacion-perfil.component';
import { IconComponent } from '../../../../libs/shared-ui/icon/icon.component';

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
    IconComponent
  ],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class DashPerfilComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private providerProfileService = inject(ProviderProfileService);
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
          id: String(s.id),
          name: s.name,
          duration: s.duration_minutes,
          price: s.price
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
        this.portfolioImages = portfolio.map(p => ({
          id: String(p.id),
          url: p.file_url,
          alt: p.title || 'Portfolio image',
          type: p.file_type
        }));
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
          coverageZones: zones.map(z => ({
            id: String(z.id),
            name: z.commune
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
    this.avatar = profile.profile_photo_url;
    
    this.basicInfo = {
      fullName: profile.full_name,
      professionalTitle: profile.professional_title || '',
      mainCommune: profile.main_commune || '',
      yearsExperience: profile.years_experience || 0
    };

    this.profileProgress = profile.profile_completion || 0;
    
    this.locationSettings = {
      ...this.locationSettings,
      availableForNewBookings: profile.available_for_bookings !== false,
      shareRealTimeLocation: profile.share_real_time_location || false
    };
  }

  // Datos básicos del perfil
  name = 'Elena Torres';
  bio = 'Estilista profesional con más de 5 años de experiencia en cortes modernos y coloración. Especializada en técnicas de color y cortes personalizados.';
  phone = '+56 9 1234 5678';
  avatar: string | null = 'https://placehold.co/96x96/C7D2FE/4338CA?text=ET';
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

  services: Service[] = [
    { id: '1', name: 'Corte de Pelo', duration: 60, price: 25000 },
    { id: '2', name: 'Manicura', duration: 45, price: 15000 },
    { id: '3', name: 'Maquillaje Profesional', duration: 75, price: 30000 }
  ];

  portfolioImages: PortfolioImage[] = [
    { id: '1', url: 'https://placehold.co/400x300/ddd6fe/4338ca?text=Corte+1', alt: 'Corte de pelo', type: 'image' },
    { id: '2', url: 'https://placehold.co/400x300/ddd6fe/4338ca?text=Coloraci%C3%B3n', alt: 'Coloración', type: 'image' },
    { id: '3', url: 'https://placehold.co/400x300/ddd6fe/4338ca?text=Peinado', alt: 'Peinado elegante', type: 'image' },
    { id: '4', url: 'https://placehold.co/400x300/ddd6fe/4338ca?text=Maquillaje', alt: 'Maquillaje profesional', type: 'image' },
    { id: '5', url: 'https://placehold.co/400x300/ddd6fe/4338ca?text=Manicura', alt: 'Manicura artística', type: 'image' }
  ];

  profileProgress = 75;

  // Estado de las tabs
  activeTab: TabType = 'perfil-publico';

  // Estado del modal de servicios
  showServiceModal = false;
  editingService: ProviderService | null = null;

  // Estado del carrusel del portafolio
  currentSlide = 0;

  // Estados de carga
  savingPublicProfile = false;

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
    this.updateProgress();
  }

  onSaveBasicInfo(info: BasicInfo) {
    console.log('[PERFIL] Guardando información básica automáticamente:', info);
    
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
      },
      error: (err) => {
        console.error('[PERFIL] Error al guardar información básica:', err);
      }
    });
  }

  onEditService(service: ProviderService) {
    console.log('[PERFIL] Editar servicio:', service);
    this.editingService = service;
    this.showServiceModal = true;
  }

  onDeleteService(serviceId: string) {
    console.log('[PERFIL] Eliminar servicio:', serviceId);
    
    if (!confirm('¿Estás seguro de que deseas eliminar este servicio?')) {
      return;
    }

    this.providerProfileService.deleteService(Number(serviceId)).subscribe({
      next: () => {
        console.log('[PERFIL] Servicio eliminado');
        this.services = this.services.filter(s => s.id !== serviceId);
        alert('✅ Servicio eliminado correctamente');
      },
      error: (err) => {
        console.error('[PERFIL] Error al eliminar servicio:', err);
        alert('❌ Error al eliminar servicio');
      }
    });
  }

  onAddService() {
    console.log('[PERFIL] Agregar nuevo servicio');
    this.editingService = null;
    this.showServiceModal = true;
  }

  onCloseServiceModal() {
    console.log('[PERFIL] Cerrando modal de servicio');
    this.showServiceModal = false;
    this.editingService = null;
  }

  onSaveService(serviceData: ServiceFormData) {
    console.log('[PERFIL] Guardando servicio:', serviceData);
    
    if (this.editingService) {
      // Actualizar servicio existente
      this.providerProfileService.updateService(this.editingService.id, serviceData).subscribe({
        next: (response: any) => {
          console.log('[PERFIL] Servicio actualizado:', response);
          
          // Actualizar el servicio en la lista local
          const index = this.services.findIndex(s => s.id === this.editingService!.id);
          if (index !== -1) {
            this.services[index] = { ...this.services[index], ...serviceData };
          }
          
          this.updateProgress();
          alert('✅ Servicio actualizado correctamente');
          this.onCloseServiceModal();
        },
        error: (err: any) => {
          console.error('[PERFIL] Error al actualizar servicio:', err);
          alert('❌ Error al actualizar servicio');
        }
      });
    } else {
      // Crear nuevo servicio
      this.providerProfileService.addService(serviceData).subscribe({
        next: (response: any) => {
          console.log('[PERFIL] Servicio creado:', response);
          
          // Agregar el nuevo servicio a la lista local
          if (response.service) {
            this.services.push(response.service);
          }
          
          this.updateProgress();
          alert('✅ Servicio creado correctamente');
          this.onCloseServiceModal();
        },
        error: (err: any) => {
          console.error('[PERFIL] Error al crear servicio:', err);
          alert('❌ Error al crear servicio');
        }
      });
    }
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
      schedule: this.weeklySchedule.some(day => day.isAvailable)
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

      // Validar tamaño (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('❌ El archivo es muy grande. Máximo 5MB');
        return;
      }

      // Subir al backend
      console.log('[PERFIL] Subiendo imagen...', file.name);
      this.providerProfileService.uploadPortfolioFile(file).subscribe({
        next: (response) => {
          console.log('[PERFIL] Imagen subida correctamente:', response);
          alert('✅ Imagen agregada al portafolio');
          // Recargar portafolio
          this.providerProfileService.getPortfolio().subscribe();
        },
        error: (err) => {
          console.error('[PERFIL] Error al subir imagen:', err);
          alert('❌ Error al subir imagen');
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
  }

  // Event handlers para ubicación y disponibilidad
  onLocationSettingsChange(settings: LocationSettings) {
    this.locationSettings = settings;
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
                available_for_bookings: this.locationSettings.availableForNewBookings,
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
            available_for_bookings: this.locationSettings.availableForNewBookings,
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

  // Métodos para el carrusel del portafolio
  nextSlide() {
    if (this.currentSlide < this.portfolioImages.length - 1) {
      this.currentSlide++;
    }
  }

  previousSlide() {
    if (this.currentSlide > 0) {
      this.currentSlide--;
    }
  }

  goToSlide(index: number) {
    this.currentSlide = index;
  }
}
