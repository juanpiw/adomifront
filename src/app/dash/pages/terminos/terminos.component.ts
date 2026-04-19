import { Component } from '@angular/core';
import { ClientTerminosComponent } from '../../../client/pages/terminos/terminos.component';

@Component({
  selector: 'app-dash-terminos',
  standalone: true,
  imports: [ClientTerminosComponent],
  templateUrl: './terminos.component.html',
  styleUrls: ['./terminos.component.scss']
})
export class DashTerminosComponent {}

