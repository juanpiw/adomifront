import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProviderServicesService, Service } from '../../services/provider-services.service';

export type EditorMode = 'create' | 'edit';

export interface AppointmentEditorData {
  id?: number;
  clientId?: number;
  serviceId?: number;
  date?: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  status?: 'scheduled'|'confirmed'|'completed'|'cancelled';
  notes?: string;
}

@Component({
  selector: 'app-appointment-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <div *ngIf="isOpen" class="ae-overlay" (click)="onBackdrop($event)">
    <div class="ae-modal" (click)="$event.stopPropagation()">
      <h3 class="ae-title">{{ mode === 'create' ? 'Crear cita' : 'Editar cita' }}</h3>
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="ae-form">
        <div class="ae-row" *ngIf="mode==='create'">
          <label>Cliente (ID)</label>
          <input type="number" formControlName="clientId" placeholder="Ingrese ID del cliente" />
        </div>
        <div class="ae-row">
          <label>Servicio</label>
          <select formControlName="serviceId" (change)="onServiceChange()">
            <option *ngFor="let s of services" [value]="s.id">{{ s.name }} ({{ s.duration_minutes }} min)</option>
          </select>
        </div>
        <div class="ae-row">
          <label>Fecha</label>
          <input type="date" formControlName="date" />
        </div>
        <div class="ae-row">
          <label>Hora inicio</label>
          <input type="time" formControlName="startTime" />
        </div>
        <div class="ae-row">
          <label>Hora fin</label>
          <input type="time" formControlName="endTime" />
        </div>
        <div class="ae-row">
          <label>Notas</label>
          <textarea formControlName="notes" rows="3"></textarea>
        </div>
        <div class="ae-row" *ngIf="mode==='edit'">
          <label>Estado</label>
          <select formControlName="status">
            <option value="scheduled">Programada</option>
            <option value="confirmed">Confirmada</option>
            <option value="completed">Completada</option>
            <option value="cancelled">Cancelada</option>
          </select>
        </div>
        <div class="ae-actions">
          <button type="button" class="btn" (click)="close.emit()">Cancelar</button>
          <button type="submit" class="btn btn-primary">{{ mode==='create' ? 'Crear' : 'Guardar' }}</button>
          <button *ngIf="mode==='edit'" type="button" class="btn btn-danger" (click)="onDelete()">Eliminar</button>
        </div>
      </form>
    </div>
  </div>
  `,
  styles: [`
  .ae-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:1000}
  .ae-modal{background:#fff;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.2);padding:20px;min-width:320px;max-width:520px;width:92%}
  .ae-title{margin:0 0 10px;font-weight:700;color:#1e293b}
  .ae-form .ae-row{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
  .ae-form input,.ae-form select,.ae-form textarea{padding:8px;border:1px solid #cbd5e1;border-radius:8px}
  .ae-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:10px}
  .btn{padding:8px 12px;border-radius:8px;border:1px solid #cbd5e1;background:#e2e8f0;color:#334155}
  .btn-primary{background:#4f46e5;border-color:#4f46e5;color:#fff}
  .btn-danger{background:#ef4444;border-color:#ef4444;color:#fff}
  `]
})
export class AppointmentEditorComponent implements OnInit {
  @Input() isOpen = false;
  @Input() mode: EditorMode = 'create';
  @Input() data: AppointmentEditorData = {};
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<AppointmentEditorData>();
  @Output() delete = new EventEmitter<number>();

  private fb = inject(FormBuilder);
  private providerServices = inject(ProviderServicesService);

  services: Service[] = [];
  form: FormGroup = this.fb.group({
    clientId: [null],
    serviceId: [null, Validators.required],
    date: ['', Validators.required],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    notes: [''],
    status: ['scheduled']
  });

  ngOnInit(): void {
    this.providerServices.list().subscribe({
      next: (resp) => { this.services = resp.services || []; this.hydrate(); },
      error: () => { this.services = []; this.hydrate(); }
    });
  }

  hydrate(): void {
    const d = this.data || {};
    this.form.patchValue({
      clientId: d.clientId ?? null,
      serviceId: d.serviceId ?? (this.services[0]?.id ?? null),
      date: d.date || '',
      startTime: d.startTime || '',
      endTime: d.endTime || '',
      notes: d.notes || '',
      status: d.status || 'scheduled'
    });
  }

  onBackdrop(ev: MouseEvent) {
    if (ev.target === ev.currentTarget) this.close.emit();
  }

  onServiceChange() {
    // si tenemos duración del servicio, ajustar hora fin automáticamente si falta
    const serviceId = Number(this.form.value.serviceId);
    const svc = this.services.find(s => Number(s.id) === serviceId);
    if (svc && this.form.value.startTime && !this.form.value.endTime) {
      this.form.patchValue({ endTime: this.addMinutes(this.form.value.startTime, Number(svc.duration_minutes || 60)) });
    }
  }

  onSubmit() {
    if (!this.form.valid) return;
    const val = this.form.value;
    const payload: AppointmentEditorData = {
      id: this.data.id,
      clientId: val.clientId ? Number(val.clientId) : undefined,
      serviceId: Number(val.serviceId),
      date: val.date,
      startTime: val.startTime,
      endTime: val.endTime,
      notes: val.notes,
      status: val.status
    };
    this.save.emit(payload);
  }

  onDelete() {
    if (this.data.id) this.delete.emit(this.data.id);
  }

  private addMinutes(hhmm: string, minutes: number): string {
    const [hh, mm] = hhmm.split(':').map(Number);
    const d = new Date(1970, 0, 1, hh, mm);
    d.setMinutes(d.getMinutes() + minutes);
    const H = String(d.getHours()).padStart(2, '0');
    const M = String(d.getMinutes()).padStart(2, '0');
    return `${H}:${M}`;
  }
}


