import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../../libs/shared-ui/icon/icon.component';
import jsPDF from 'jspdf';

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
    const doc = new jsPDF();
    const filename = type === 'terminos' ? 'Terminos_Condiciones_Profesionales_Adomi.pdf' : 'Politicas_Privacidad_Profesionales_Adomi.pdf';
    
    // Configuración
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Header con color
    doc.setFillColor(102, 126, 234); // Indigo
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Título principal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    const title = type === 'terminos' ? 'Términos y Condiciones - Profesionales' : 'Políticas de Privacidad - Profesionales';
    doc.text(title, margin, 25);
    
    // Subtítulo
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Última actualización: ${this.lastUpdated}`, margin, 33);
    
    yPosition = 55;
    doc.setTextColor(0, 0, 0);

    if (type === 'terminos') {
      this.addTerminosContent(doc, yPosition, margin, maxWidth, pageHeight);
    } else {
      this.addPrivacidadContent(doc, yPosition, margin, maxWidth, pageHeight);
    }

    // Footer
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('© 2025 Adomi - Todos los derechos reservados', pageWidth / 2, footerY, { align: 'center' });
    
    // Descargar
    doc.save(filename);
  }

  private addTerminosContent(doc: jsPDF, yPos: number, margin: number, maxWidth: number, pageHeight: number) {
    let y = yPos;

    const sections = [
      {
        title: '1. Aceptación de los Términos',
        content: 'Al registrarse como profesional en Adomi, acepta estos Términos y Condiciones y las leyes aplicables.'
      },
      {
        title: '2. Registro como Profesional',
        content: 'Para ofrecer servicios debe cumplir requisitos de verificación.',
        list: ['Mayor de 18 años', 'Documentación válida', 'Certificaciones o experiencia', 'Mantener calificación mínima 3.5']
      },
      {
        title: '3. Comisiones y Pagos',
        content: 'Adomi cobra 15% de comisión. Pagos depositados en 3-5 días hábiles tras completar servicio.'
      },
      {
        title: '4. Responsabilidades',
        list: ['Proporcionar servicios de calidad', 'Mantener puntualidad', 'Comunicación profesional', 'Cumplir normativas de seguridad']
      },
      {
        title: '5. Cancelaciones',
        content: 'Cancelaciones con +24h sin penalización. Cancelaciones tardías afectan calificación.'
      },
      {
        title: '6. Planes y Suscripciones',
        content: 'Diferentes planes con beneficios variables. Plan gratuito tiene limitaciones. Planes de pago se renuevan automáticamente.'
      },
      {
        title: '7. Privacidad',
        content: 'Protegemos su privacidad conforme a Política de Privacidad y leyes de protección de datos.'
      },
      {
        title: '8. Suspensión',
        content: 'Reservamos derecho de suspender cuenta por violación de términos, fraude, quejas o baja calificación.'
      },
      {
        title: '9. Contacto',
        content: 'Consultas: profesionales@adomiapp.com | +56 9 XXXX XXXX'
      }
    ];

    sections.forEach(section => {
      y = this.addSection(doc, section, y, margin, maxWidth, pageHeight);
    });
  }

  private addPrivacidadContent(doc: jsPDF, yPos: number, margin: number, maxWidth: number, pageHeight: number) {
    let y = yPos;

    const sections = [
      {
        title: '1. Información que Recopilamos',
        content: 'Como profesional recopilamos información de registro y servicios.',
        list: ['Datos personales y RUT', 'Información profesional', 'Datos bancarios', 'Historial de servicios', 'Documentos de verificación']
      },
      {
        title: '2. Uso de Información',
        list: ['Verificar identidad', 'Conectar con clientes', 'Procesar pagos', 'Mostrar perfil', 'Mejorar plataforma', 'Cumplir obligaciones legales']
      },
      {
        title: '3. Compartir con Clientes',
        content: 'Su perfil profesional es visible. Información de contacto solo se comparte con clientes que reservan.'
      },
      {
        title: '4. Protección de Datos de Clientes',
        list: ['Mantener confidencialidad', 'Usar información solo para servicios', 'No compartir con terceros', 'Eliminar datos tras completar servicios']
      },
      {
        title: '5. Seguridad de Cuenta',
        content: 'Es su responsabilidad mantener segura su cuenta. Implementamos medidas de seguridad.'
      },
      {
        title: '6. Sus Derechos',
        list: ['Acceder y descargar datos', 'Actualizar perfil', 'Solicitar eliminación', 'Exportar historial', 'Oponerse al procesamiento']
      },
      {
        title: '7. Retención',
        content: 'Mantenemos información durante cuenta activa y 5 años adicionales según requisitos legales.'
      },
      {
        title: '8. Contacto',
        content: 'Consultas privacidad: privacidad@adomiapp.com | +56 9 XXXX XXXX'
      }
    ];

    sections.forEach(section => {
      y = this.addSection(doc, section, y, margin, maxWidth, pageHeight);
    });
  }

  private addSection(doc: jsPDF, section: any, yPos: number, margin: number, maxWidth: number, pageHeight: number): number {
    let y = yPos;

    // Verificar si necesitamos nueva página
    if (y > pageHeight - 40) {
      doc.addPage();
      y = margin;
    }

    // Título de sección
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text(section.title, margin, y);
    y += 8;

    // Contenido
    if (section.content) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const lines = doc.splitTextToSize(section.content, maxWidth);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 5;
    }

    // Lista
    if (section.list) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      section.list.forEach((item: string) => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = margin;
        }
        doc.text('✓ ' + item, margin + 5, y);
        y += 6;
      });
      y += 3;
    }

    y += 5; // Espacio entre secciones
    return y;
  }
}

