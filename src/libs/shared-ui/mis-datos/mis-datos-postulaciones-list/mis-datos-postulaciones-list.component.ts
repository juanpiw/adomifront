import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MisDatoPostulacion } from '../models';
import { MisDatosPostulacionItemComponent } from '../mis-datos-postulacion-item/mis-datos-postulacion-item.component';

@Component({
  selector: 'ui-mis-datos-postulaciones-list',
  standalone: true,
  imports: [CommonModule, MisDatosPostulacionItemComponent],
  templateUrl: './mis-datos-postulaciones-list.component.html',
  styleUrls: ['./mis-datos-postulaciones-list.component.scss']
})
export class MisDatosPostulacionesListComponent {
  @Input() postulaciones: MisDatoPostulacion[] = [];
}

