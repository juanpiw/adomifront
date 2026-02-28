import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MisDatoMatch } from '../models';

@Component({
  selector: 'ui-mis-datos-matches-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mis-datos-matches-list.component.html',
  styleUrls: ['./mis-datos-matches-list.component.scss']
})
export class MisDatosMatchesListComponent {
  @Input() matches: MisDatoMatch[] = [];
}

