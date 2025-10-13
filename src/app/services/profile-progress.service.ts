import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ProfileProgressData {
  basicInfo: {
    fullName: boolean;
    professionalTitle: boolean;
    mainCommune: boolean;
    yearsExperience: boolean;
  };
  bio: boolean;
  profilePhoto: boolean;
  coverPhoto: boolean;
  services: number; // Cantidad de servicios
  portfolio: number; // Cantidad de imágenes en portafolio
  coverageZones: number; // Cantidad de zonas de cobertura
  schedule: boolean; // Horarios configurados
}

@Injectable({
  providedIn: 'root'
})
export class ProfileProgressService {
  private progressSubject = new BehaviorSubject<number>(0);
  private progressDataSubject = new BehaviorSubject<ProfileProgressData>({
    basicInfo: {
      fullName: false,
      professionalTitle: false,
      mainCommune: false,
      yearsExperience: false
    },
    bio: false,
    profilePhoto: false,
    coverPhoto: false,
    services: 0,
    portfolio: 0,
    coverageZones: 0,
    schedule: false
  });

  public progress$: Observable<number> = this.progressSubject.asObservable();
  public progressData$: Observable<ProfileProgressData> = this.progressDataSubject.asObservable();

  constructor() {}

  /**
   * Actualizar el progreso del perfil
   */
  updateProgress(data: Partial<ProfileProgressData>) {
    const currentData = this.progressDataSubject.value;
    const newData = { ...currentData, ...data };
    
    this.progressDataSubject.next(newData);
    this.calculateProgress(newData);
  }

  /**
   * Calcular el porcentaje de progreso
   */
  private calculateProgress(data: ProfileProgressData) {
    let totalPoints = 0;
    let earnedPoints = 0;

    // Información básica (25 puntos total)
    const basicInfoFields = Object.values(data.basicInfo);
    const basicInfoCompleted = basicInfoFields.filter(Boolean).length;
    totalPoints += 25;
    earnedPoints += (basicInfoCompleted / basicInfoFields.length) * 25;

    // Biografía (10 puntos)
    totalPoints += 10;
    earnedPoints += data.bio ? 10 : 0;

    // Foto de perfil (10 puntos)
    totalPoints += 10;
    earnedPoints += data.profilePhoto ? 10 : 0;

    // Foto de portada (5 puntos)
    totalPoints += 5;
    earnedPoints += data.coverPhoto ? 5 : 0;

    // Servicios (20 puntos - máximo 2 servicios)
    totalPoints += 20;
    earnedPoints += Math.min(20, data.services * 10);

    // Portafolio (15 puntos - máximo 3 imágenes)
    totalPoints += 15;
    earnedPoints += Math.min(15, data.portfolio * 5);

    // Zonas de cobertura (10 puntos - máximo 2 zonas)
    totalPoints += 10;
    earnedPoints += Math.min(10, data.coverageZones * 5);

    // Horarios (5 puntos)
    totalPoints += 5;
    earnedPoints += data.schedule ? 5 : 0;

    const progressPercentage = Math.round((earnedPoints / totalPoints) * 100);
    this.progressSubject.next(progressPercentage);
  }

  /**
   * Obtener sugerencias para mejorar el progreso
   */
  getSuggestions(data: ProfileProgressData): string[] {
    const suggestions: string[] = [];

    if (!data.basicInfo.fullName) suggestions.push('Completa tu nombre completo');
    if (!data.basicInfo.professionalTitle) suggestions.push('Añade tu título profesional');
    if (!data.basicInfo.mainCommune) suggestions.push('Selecciona tu comuna principal');
    if (!data.basicInfo.yearsExperience) suggestions.push('Especifica tus años de experiencia');
    if (!data.bio) suggestions.push('Escribe una biografía profesional');
    if (!data.profilePhoto) suggestions.push('Sube una foto de perfil');
    if (!data.coverPhoto) suggestions.push('Añade una foto de portada');
    if (data.services === 0) suggestions.push('Crea al menos un servicio');
    if (data.services < 2) suggestions.push('Añade más servicios para mejorar tu perfil');
    if (data.portfolio === 0) suggestions.push('Sube fotos a tu portafolio');
    if (data.portfolio < 3) suggestions.push('Añade más imágenes a tu portafolio');
    if (data.coverageZones === 0) suggestions.push('Configura tus zonas de cobertura');
    if (data.coverageZones < 2) suggestions.push('Añade más zonas de cobertura');
    if (!data.schedule) suggestions.push('Configura tus horarios de disponibilidad');

    return suggestions.slice(0, 3); // Máximo 3 sugerencias
  }

  /**
   * Obtener el progreso actual
   */
  getCurrentProgress(): number {
    return this.progressSubject.value;
  }

  /**
   * Obtener los datos de progreso actuales
   */
  getCurrentProgressData(): ProfileProgressData {
    return this.progressDataSubject.value;
  }
}
