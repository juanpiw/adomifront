import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-empty-canceladas',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="ec-container">
    <svg class="ec-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
    <h3 class="ec-title">{{ title }}</h3>
    <p class="ec-sub">{{ subtitle }}</p>
  </div>
  `,
  styles:[`
    .ec-container{text-align:center;padding:3rem 0}
    .ec-icon{width:48px;height:48px;color:#94a3b8;display:block;margin:0 auto}
    .ec-title{margin-top:.5rem;font-size:1.125rem;font-weight:700;color:#0f172a}
    .ec-sub{margin-top:.25rem;font-size:1rem;color:#64748b}
  `]
})
export class EmptyCanceladasComponent {
  @Input() title: string = 'Sin citas canceladas';
  @Input() subtitle: string = 'Aquí aparecerán las reservas que hayas cancelado.';
}








