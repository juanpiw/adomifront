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
  readonly fallbackAvatar = '/assets/default-avatar.png';

  ngAfterViewInit(): void {
    // Dar tiempo a que Angular pinte el DOM y calcule tamaños
    setTimeout(() => this.computePagination(), 0);

    const el = this.scrollerRef?.nativeElement;
    if (!el) return;
    el.addEventListener('scroll', this.onScrollThrottled, { passive: true });
    window.addEventListener('resize', this.onResizeThrottled);
    this.startAutoplay();
  }

  onAvatarError(event: Event) {
    const img = event.target as HTMLImageElement | null;
    if (!img) return;

    const currentSrc = img.getAttribute('src');
    if (currentSrc === this.fallbackAvatar) {
      return;
    }

    console.warn('[InicioSolicitudes] Avatar no disponible, usando fallback.', {
      previousSrc: currentSrc
    });

    img.src = this.fallbackAvatar;
    img.classList.add('inicio-solicitudes__avatar--fallback');
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
}
