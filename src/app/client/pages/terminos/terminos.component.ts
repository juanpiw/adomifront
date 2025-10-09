import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../../libs/shared-ui/icon/icon.component';
import jsPDF from 'jspdf';

type TabType = 'terminos' | 'privacidad';

@Component({
  selector: 'app-client-terminos',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './terminos.component.html',
  styleUrls: ['./terminos.component.scss']
})
export class ClientTerminosComponent {
  lastUpdated = 'Octubre 2025';
  activeTab: TabType = 'terminos';

  onTabChange(tab: TabType) {
    this.activeTab = tab;
  }

  downloadPDF(type: TabType) {
    const doc = new jsPDF();
    const filename = type === 'terminos' ? 'Terminos_Condiciones_Adomi.pdf' : 'Politicas_Privacidad_Adomi.pdf';
    
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
    const title = type === 'terminos' ? 'Términos y Condiciones' : 'Políticas de Privacidad';
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
        content: 'Al acceder y utilizar la plataforma Adomi, usted acepta estar sujeto a estos Términos y Condiciones, todas las leyes y regulaciones aplicables.'
      },
      {
        title: '2. Uso de la Plataforma',
        content: 'Adomi es una plataforma que conecta clientes con profesionales de servicios a domicilio.',
        list: ['Debe tener al menos 18 años', 'Debe proporcionar información precisa', 'Es responsable de su cuenta', 'No usar para actividades ilegales']
      },
      {
        title: '3. Servicios Ofrecidos',
        content: 'Los profesionales ofrecen diversos servicios a domicilio. Adomi actúa como intermediario.'
      },
      {
        title: '4. Pagos y Facturación',
        content: 'Los pagos se procesan de forma segura. Los precios incluyen impuestos. Cancelaciones sujetas a política.'
      },
      {
        title: '5. Responsabilidades',
        content: 'Adomi no se hace responsable por la calidad de los servicios. Mantenemos estándares a través de verificación.'
      },
      {
        title: '6. Privacidad y Datos',
        content: 'Nos comprometemos a proteger su privacidad. Consulte nuestra Política de Privacidad.'
      },
      {
        title: '7. Modificaciones',
        content: 'Adomi puede modificar estos términos. Los cambios entran en vigor tras su publicación.'
      },
      {
        title: '8. Contacto',
        content: 'Para preguntas: soporte@adomiapp.com | +56 9 XXXX XXXX'
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
        content: 'Recopilamos información que usted proporciona al registrarse y usar la plataforma.',
        list: ['Información personal', 'Información de pago', 'Información de perfil', 'Datos de uso']
      },
      {
        title: '2. Cómo Usamos su Información',
        list: ['Facilitar conexión con profesionales', 'Procesar pagos', 'Mejorar servicios', 'Enviar notificaciones', 'Prevenir fraudes']
      },
      {
        title: '3. Compartir Información',
        content: 'No vendemos su información. Solo compartimos cuando es necesario para el servicio o por ley.'
      },
      {
        title: '4. Seguridad de Datos',
        content: 'Implementamos medidas de seguridad para proteger su información contra acceso no autorizado.'
      },
      {
        title: '5. Sus Derechos',
        list: ['Acceder a su información', 'Corregir datos', 'Solicitar eliminación', 'Oponerse al procesamiento', 'Portabilidad de datos']
      },
      {
        title: '6. Cookies',
        content: 'Utilizamos cookies para mejorar su experiencia y analizar el uso de la plataforma.'
      },
      {
        title: '7. Retención de Datos',
        content: 'Retenemos información mientras sea necesario, según la ley.'
      },
      {
        title: '8. Contacto',
        content: 'Para consultas: privacidad@adomiapp.com | +56 9 XXXX XXXX'
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

