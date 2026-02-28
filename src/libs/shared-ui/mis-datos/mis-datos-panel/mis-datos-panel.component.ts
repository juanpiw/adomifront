import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MisDatoPublicado } from '../models';
import { MisDatosDatoCardComponent } from '../mis-datos-dato-card/mis-datos-dato-card.component';

@Component({
  selector: 'ui-mis-datos-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MisDatosDatoCardComponent],
  templateUrl: './mis-datos-panel.component.html',
  styleUrls: ['./mis-datos-panel.component.scss']
})
export class MisDatosPanelComponent {
  @Input() datos: MisDatoPublicado[] = [];
  searchContext = '';

  get filteredDatos(): MisDatoPublicado[] {
    const term = this.normalizeText(this.searchContext);
    if (!term) return this.datos;

    return this.datos.filter((dato) => {
      const baseText = [
        dato.title,
        dato.text,
        dato.postedMeta,
        dato.status
      ]
        .filter(Boolean)
        .join(' ');

      const postulacionesText = (dato.postulaciones || [])
        .map((item) => `${item.name || ''} ${item.profession || ''} ${item.commune || ''} ${item.message || ''}`)
        .join(' ');

      const matchesText = (dato.matches || [])
        .map((item) => `${item.name || ''} ${item.profession || ''} ${item.commune || ''}`)
        .join(' ');

      const context = this.normalizeText(`${baseText} ${postulacionesText} ${matchesText}`);
      return context.includes(term);
    });
  }

  private normalizeText(value: string): string {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}

