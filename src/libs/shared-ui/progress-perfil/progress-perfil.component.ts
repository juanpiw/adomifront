import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ProfileProgressService } from '../../../services/profile-progress.service';

@Component({
  selector: 'app-progress-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-perfil.component.html',
  styleUrls: ['./progress-perfil.component.scss']
})
export class ProgressPerfilComponent implements OnInit, OnDestroy {
  @Input() progress: number = 0;
  @Input() suggestion: string = '';

  private progressService = inject(ProfileProgressService);
  private subscription = new Subscription();

  currentProgress = 0;
  currentSuggestion = '';

  ngOnInit() {
    // Si no se pasa progreso desde el input, usar el servicio
    if (this.progress === 0) {
      this.subscription.add(
        this.progressService.progress$.subscribe(progress => {
          this.currentProgress = progress;
        })
      );

      this.subscription.add(
        this.progressService.progressData$.subscribe(data => {
          const suggestions = this.progressService.getSuggestions(data);
          this.currentSuggestion = suggestions.length > 0 
            ? `Sugerencia: ${suggestions[0]}.`
            : '¡Felicidades! Tu perfil está completo.';
        })
      );
    } else {
      this.currentProgress = this.progress;
      this.currentSuggestion = this.suggestion;
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  // Asegurar que el progreso esté entre 0 y 100
  get normalizedProgress(): number {
    return Math.min(100, Math.max(0, this.currentProgress));
  }
}
