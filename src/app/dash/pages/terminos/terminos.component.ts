import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../../libs/shared-ui/icon/icon.component';

type TabType = 'terminos' | 'privacidad';

@Component({
  selector: 'app-dash-terminos',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './terminos.component.html',
  styleUrls: ['./terminos.component.scss']
})
export class DashTerminosComponent {
  lastUpdated = 'Octubre 2025';
  activeTab: TabType = 'terminos';

  onTabChange(tab: TabType) {
    this.activeTab = tab;
  }

  downloadPDF(type: TabType) {
    const content = this.getPDFContent(type);
    const filename = type === 'terminos' ? 'Terminos_Condiciones_Profesionales_Adomi.pdf' : 'Politicas_Privacidad_Profesionales_Adomi.pdf';
    
    // Por ahora, solo mostramos un mensaje
    // En producción, aquí se generaría el PDF usando una librería como jsPDF o pdfmake
    console.log(`Descargando ${filename}...`);
    alert(`Función de descarga de PDF disponible próximamente.\n\nSe descargará: ${filename}`);
  }

  private getPDFContent(type: TabType): string {
    // Aquí se prepararía el contenido para el PDF
    return type === 'terminos' ? 'Contenido de Términos y Condiciones para Profesionales' : 'Contenido de Políticas de Privacidad para Profesionales';
  }
}

