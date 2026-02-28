import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { MisDatoPostulacion } from '../models';

@Component({
  selector: 'ui-mis-datos-postulacion-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mis-datos-postulacion-item.component.html',
  styleUrls: ['./mis-datos-postulacion-item.component.scss']
})
export class MisDatosPostulacionItemComponent {
  @Input({ required: true }) postulacion!: MisDatoPostulacion;
  @Input() dimmed = false;

  constructor(private router: Router) {}

  goToProviderProfile(): void {
    const providerId = Number(this.postulacion?.providerId || 0);
    if (!providerId) return;
    this.router.navigate(['/client/explorar', providerId], {
      queryParams: { src: 'mis-datos-postulacion' }
    });
  }
}

