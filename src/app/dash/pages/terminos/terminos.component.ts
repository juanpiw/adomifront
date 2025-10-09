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
        title: '1. Definiciones Clave',
        content: 'Plataforma: Adomiapp. Profesional: Usted, proveedor independiente. Cliente: Usuario que contrata. Servicio: Actividad profesional prestada.'
      },
      {
        title: '2. Naturaleza y Alcance de la Plataforma',
        content: 'Adomiapp es plataforma de intermediación. Función limitada a conectar Clientes con Profesionales.',
        list: ['NO es parte del contrato', 'NO supervisa ni controla trabajo', 'NO garantiza calidad o legalidad', 'Enlaces a terceros sin responsabilidad']
      },
      {
        title: '3. Relación Jurídica: Contratista Independiente',
        content: 'Usted actúa como entidad independiente. Relación comercial, NO laboral.',
        list: ['Aporta herramientas propias', 'Asume costos y riesgos', 'Sin supervisión directa', 'Sin beneficios laborales', 'Sin exclusividad']
      },
      {
        title: '4. Verificación y Descargo',
        content: 'Adomiapp puede verificar credenciales, pero no garantiza exactitud. Clientes evalúan idoneidad. Calificaciones son opiniones, no garantías.'
      },
      {
        title: '5. Seguros',
        content: 'Usted es responsable de obtener seguro de responsabilidad civil. Adomiapp no proporciona seguros.'
      },
      {
        title: '6. Comisiones y Tributación',
        content: 'Comisión 15%. Pagos en 3-5 días. Usted declara ingresos y paga impuestos según ley chilena.'
      },
      {
        title: '7. Limitación de Responsabilidad',
        content: 'Adomiapp NO responsable por daños: uso de Plataforma, conducta terceros, disputas, pérdida ganancias/datos.'
      },
      {
        title: '8. Indemnización',
        list: ['Defender Adomiapp de reclamos', 'Por uso de Plataforma', 'Por violación Términos', 'Por daños a terceros'],
        content: 'Obligación sobrevive a estos Términos.'
      },
      {
        title: '9. Cancelaciones',
        content: 'Cancelaciones +24h sin penalización. Tardías afectan calificación.'
      },
      {
        title: '10. Planes',
        content: 'Planes con beneficios variables. Gratuito con limitaciones. Pago renovación automática.'
      },
      {
        title: '11. Ley y Jurisdicción',
        content: 'Regido por leyes de Chile. Disputas en tribunales Santiago, Chile.'
      },
      {
        title: '12. Contacto',
        content: 'Consultas: profesionales@adomiapp.com | +56 9 XXXX XXXX | Lun-Vie 9-18h'
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

