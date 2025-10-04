import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-perfil.component.html',
  styleUrls: ['./progress-perfil.component.scss']
})
export class ProgressPerfilComponent {
  @Input() progress: number = 75;
  @Input() suggestion: string = 'Sugerencia: Añade fotos a tu portafolio para llegar al 100%.';

  // Asegurar que el progreso esté entre 0 y 100
  get normalizedProgress(): number {
    return Math.min(100, Math.max(0, this.progress));
  }
}
