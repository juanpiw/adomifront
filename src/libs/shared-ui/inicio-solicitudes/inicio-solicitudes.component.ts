import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  AcceptReservaModalComponent, 
  RejectReservaModalComponent,
  ReservaData,
  AcceptReservaResult,
  RejectReservaResult
} from './modals';

// Mantener compatibilidad con la interfaz anterior
export interface SolicitudData {
  id: string;
  clientName: string;
  clientAvatar: string;
  service: string;
  when: string;
  time: string;
  date?: string;
  location?: string;
  estimatedIncome?: number;
  clientPhone?: string;
  clientEmail?: string;
  notes?: string;
}

@Component({
  selector: 'app-inicio-solicitudes',
  standalone: true,
  imports: [
    CommonModule,
    AcceptReservaModalComponent,
    RejectReservaModalComponent
  ],
  templateUrl: './inicio-solicitudes.component.html',
  styleUrls: ['./inicio-solicitudes.component.scss']
})
export class InicioSolicitudesComponent implements AfterViewInit {
  @Input() data: SolicitudData[] = [];

  @Output() acceptClick = new EventEmitter<SolicitudData>();
  @Output() declineClick = new EventEmitter<SolicitudData>();
  @Output() reservaAccepted = new EventEmitter<AcceptReservaResult>();
  @Output() reservaRejected = new EventEmitter<RejectReservaResult>();

  // Estados de los modales
  showAcceptModal = false;
  showRejectModal = false;
  loading = false;
  selectedSolicitud: SolicitudData | null = null;

  @ViewChild('scroller') private scrollerRef?: ElementRef<HTMLDivElement>;

  // Paginación por "página" (ancho visible)
  currentPage = 0;
  totalPages = 1;
  private autoplayTimer: any = null;
  autoplayIntervalMs = 4000;
  readonly fallbackAvatar = 'assets/default-avatar.png';

  ngAfterViewInit(): void {
    // Dar tiempo a que Angular pinte el DOM y calcule tamaños
    setTimeout(() => this.computePagination(), 0);

    const el = this.scrollerRef?.nativeElement;
    if (!el) return;
    el.addEventListener('scroll', this.onScrollThrottled, { passive: true });
    window.addEventListener('resize', this.onResizeThrottled);
    this.startAutoplay();
  }

  get filteredData(): SolicitudData[] {
    return (this.data || []).filter(d => !this.isPast(d));
  }

  private isPast(d: SolicitudData): boolean {
    const dateStr = d.date || '';
    const timeStr = d.time || '';
    let dt: Date | null = null;

    if (dateStr) {
      // Si viene fecha ISO, concatenar hora si existe
      dt = new Date(timeStr ? `${dateStr}T${timeStr}` : dateStr);
    }

    if ((!dt || Number.isNaN(dt.getTime())) && d.when) {
      dt = this.parseHumanDate(d.when, timeStr);
    }

    if (!dt || Number.isNaN(dt.getTime())) return false;

    const now = new Date();
    return dt.getTime() < now.getTime();
  }

  /**
   * Parsea fechas en español del tipo "lunes, 15 de diciembre" o "jueves, 1 de enero"
   * con hora opcional. Si no hay año, se asume el año actual.
   */
  private parseHumanDate(when: string, time: string): Date | null {
    if (!when) return null;
    const months: Record<string, number> = {
      enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
      julio: 6, agosto: 7, septiembre: 8, setiembre: 8, octubre: 9,
      noviembre: 10, diciembre: 11
    };
    const regex = /(\d{1,2})\s+de\s+([a-záéíóúñ]+)(?:\s+de\s+(\d{4}))?/i;
    const match = when.match(regex);
    if (!match) return null;
    const day = Number(match[1]);
    const monthName = match[2].toLowerCase();
    const year = match[3] ? Number(match[3]) : new Date().getFullYear();
    const monthIdx = months[monthName];
    if (!Number.isFinite(day) || monthIdx === undefined || !Number.isFinite(year)) return null;

    const parsedTime = this.parseTime(time);
    const dt = new Date(year, monthIdx, day, parsedTime?.hour ?? 0, parsedTime?.minute ?? 0, 0, 0);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  private parseTime(time: string): { hour: number; minute: number } | null {
    if (!time) return null;
    const m = time.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const hour = Number(m[1]);
    const minute = Number(m[2]);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
    return { hour, minute };
  }

  onAvatarError(event: Event) {
    const img = event.target as HTMLImageElement | null;
    if (!img) return;

    const container = img.closest('.inicio-solicitudes__avatar');
    const currentSrc = img.getAttribute('src');
    if (currentSrc === this.fallbackAvatar) {
      return;
    }

    console.warn('[InicioSolicitudes] Avatar no disponible, usando fallback.', {
      previousSrc: currentSrc
    });

    img.src = this.fallbackAvatar;
    if (container) {
      container.classList.add('inicio-solicitudes__avatar--fallback');
    } else {
      img.classList.add('inicio-solicitudes__avatar--fallback');
    }
  }

  onAcceptClick(solicitud: SolicitudData) {
    this.selectedSolicitud = solicitud;
    this.showAcceptModal = true;
    this.acceptClick.emit(solicitud);
  }

  onDeclineClick(solicitud: SolicitudData) {
    this.selectedSolicitud = solicitud;
    this.showRejectModal = true;
    this.declineClick.emit(solicitud);
  }

  onAcceptModalClose() {
    this.showAcceptModal = false;
    this.selectedSolicitud = null;
  }

  onRejectModalClose() {
    this.showRejectModal = false;
    this.selectedSolicitud = null;
  }

  onAcceptConfirm(result: AcceptReservaResult) {
    this.reservaAccepted.emit(result);
    this.showAcceptModal = false;
  }

  onRejectConfirm(result: RejectReservaResult) {
    this.loading = true;
    this.reservaRejected.emit(result);
    
    // Simular delay de API
    setTimeout(() => {
      this.loading = false;
      this.showRejectModal = false;
    }, 1000);
  }

  scrollLeft() {
    const el = this.scrollerRef?.nativeElement;
    if (!el) return;
    const amount = Math.max(300, el.clientWidth * 0.8);
    el.scrollBy({ left: -amount, behavior: 'smooth' });
  }

  scrollRight() {
    const el = this.scrollerRef?.nativeElement;
    if (!el) return;
    const amount = Math.max(300, el.clientWidth * 0.8);
    el.scrollBy({ left: amount, behavior: 'smooth' });
  }

  goTo(pageIndex: number) {
    const el = this.scrollerRef?.nativeElement;
    if (!el) return;
    const clamped = Math.max(0, Math.min(pageIndex, this.totalPages - 1));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' });
  }

  onMouseEnter() { this.stopAutoplay(); }
  onMouseLeave() { this.startAutoplay(); }

  private computePagination() {
    const el = this.scrollerRef?.nativeElement;
    if (!el) { this.currentPage = 0; this.totalPages = 1; return; }
    const viewport = Math.max(1, el.clientWidth);
    const total = Math.max(viewport, el.scrollWidth);
    this.totalPages = Math.max(1, Math.ceil(total / viewport));
    this.currentPage = Math.max(0, Math.min(this.totalPages - 1, Math.round(el.scrollLeft / viewport)));
  }

  private onScrollThrottled = () => {
    this.computePagination();
  };

  private onResizeThrottled = () => {
    this.computePagination();
  };

  private startAutoplay() {
    if (this.autoplayTimer || this.totalPages <= 1) return;
    this.autoplayTimer = setInterval(() => {
      const next = (this.currentPage + 1) % this.totalPages;
      this.goTo(next);
    }, this.autoplayIntervalMs);
  }

  private stopAutoplay() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  getInitials(name?: string | null): string {
    if (!name) return 'C';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'C';
    if (parts.length === 1) return (parts[0][0] || 'C').toUpperCase();
    const first = parts[0][0] || '';
    const last = parts[parts.length - 1][0] || '';
    const initials = `${first}${last}`.trim();
    return initials ? initials.toUpperCase() : 'C';
  }
}
