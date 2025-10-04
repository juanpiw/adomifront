import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservasTabsComponent } from '../../../../libs/shared-ui/reservas/reservas-tabs.component';
import { ProximaCitaCardComponent, ProximaCitaData } from '../../../../libs/shared-ui/reservas/proxima-cita-card.component';
import { PendienteCardComponent, PendienteData } from '../../../../libs/shared-ui/reservas/pendiente-card.component';
import { ReservaPasadaCardComponent, ReservaPasadaData } from '../../../../libs/shared-ui/reservas/reserva-pasada-card.component';
import { CanceladaClienteCardComponent, CanceladaClienteData } from '../../../../libs/shared-ui/reservas/cancelada-cliente-card.component';
import { CanceladaProfesionalCardComponent, CanceladaProfesionalData } from '../../../../libs/shared-ui/reservas/cancelada-profesional-card.component';

@Component({ 
  selector:'app-c-reservas', 
  standalone:true, 
  imports:[CommonModule, ReservasTabsComponent, ProximaCitaCardComponent, PendienteCardComponent, ReservaPasadaCardComponent, CanceladaClienteCardComponent, CanceladaProfesionalCardComponent],
  template:`
  <section class="reservas-page">
    <h2 class="title">Mis Reservas</h2>

    <ui-reservas-tabs (tabChange)="activeTab = $event"></ui-reservas-tabs>

    <div class="content" *ngIf="activeTab === 0">
      <ui-proxima-cita-card [data]="proxima" style="margin-bottom:12px;"></ui-proxima-cita-card>
      <ui-pendiente-card [data]="pendiente"></ui-pendiente-card>
    </div>

    <div class="content" *ngIf="activeTab === 1">
      <ui-reserva-pasada-card [data]="pasada1" style="margin-bottom:12px;"></ui-reserva-pasada-card>
      <ui-reserva-pasada-card [data]="pasada2"></ui-reserva-pasada-card>
    </div>

    <div class="content" *ngIf="activeTab === 2">
      <ui-cancelada-cliente-card [data]="canceladaCliente" style="margin-bottom:12px;"></ui-cancelada-cliente-card>
      <ui-cancelada-profesional-card [data]="canceladaProfesional"></ui-cancelada-profesional-card>
    </div>
  </section>
  `,
  styles:[`
    .reservas-page{padding:24px}
    .title{font-weight:800;font-size:24px;margin:0 0 8px;color:#0f172a}
    .content{margin-top:16px}
  `]
})
export class ClientReservasComponent {
  activeTab = 0;
  proxima: ProximaCitaData = { titulo: 'Corte de Pelo con Elena Torres', subtitulo: 'Confirmada', fecha: 'Jueves, 25 de Octubre', hora: '10:00 AM', diasRestantes: 2 };
  pendiente: PendienteData = { titulo: 'Manicura con Ana Pérez', fecha: 'Sábado, 27 de Octubre', hora: '15:00 PM' };
  pasada1: ReservaPasadaData = { avatarUrl: 'https://placehold.co/64x64/E2E8F0/475569?text=JN', titulo: 'Soporte Técnico con Javier Núñez', fecha: '12 de Septiembre, 2025', precio: '$35.000', estado: 'Completado' };
  pasada2: ReservaPasadaData = { avatarUrl: 'https://placehold.co/64x64/E2E8F0/475569?text=AP', titulo: 'Manicura con Ana Pérez', fecha: '03 de Agosto, 2025', precio: '$15.000', estado: 'Completado' };
  canceladaCliente: CanceladaClienteData = { avatarUrl: 'https://placehold.co/64x64/E2E8F0/475569?text=RV', titulo: 'Jardinería con Ricardo Vega', fecha: '15 de Agosto, 2025', estadoPill: 'Gestionando Reembolso' };
  canceladaProfesional: CanceladaProfesionalData = { avatarUrl: 'https://placehold.co/64x64/E2E8F0/475569?text=CS', titulo: 'Manicura con Carla Soto', fecha: '28 de Agosto, 2025', pillText: 'Reembolso completado' };
}
