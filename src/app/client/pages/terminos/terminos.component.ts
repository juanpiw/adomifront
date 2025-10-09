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
        title: '1. Definiciones Clave',
        content: 'Plataforma: Adomiapp y sus servicios tecnológicos. Cliente: Usuario que busca servicios. Profesional: Proveedor independiente de servicios. Servicio: Actividad prestada por el Profesional.'
      },
      {
        title: '2. Naturaleza y Alcance de la Plataforma',
        content: 'Adomiapp es plataforma tecnológica de mercado en línea de intermediación. Función exclusiva: conectar Clientes con Profesionales independientes.',
        list: [
          'NO es parte del contrato de servicio entre Cliente y Profesional',
          'NO supervisa, dirige, controla ni monitorea trabajo de Profesionales',
          'NO garantiza calidad, seguridad, idoneidad o legalidad de Servicios',
          'Plataforma puede contener enlaces a terceros sin responsabilidad sobre disponibilidad, exactitud o contenido'
        ]
      },
      {
        title: '3. Uso de la Plataforma',
        content: 'Al usar Adomiapp usted acepta:',
        list: ['Tener al menos 18 años', 'Proporcionar información precisa y actualizada', 'Ser responsable de la seguridad de su cuenta', 'No usar la plataforma para actividades ilegales']
      },
      {
        title: '4. Verificación de Usuarios y Descargo',
        content: 'Adomiapp podrá, pero no está obligada a, verificar antecedentes o credenciales de Profesionales al registro.',
        list: [
          'Verificación basada en información proporcionada, sin garantía de exactitud, vigencia o integridad',
          'Sin obligación de seguimiento continuo de antecedentes',
          'Cliente único responsable de evaluar idoneidad y confiabilidad',
          'Sistema calificaciones: referencia de opiniones, NO recomendación ni garantía Adomiapp'
        ]
      },
      {
        title: '5. Pagos y Facturación',
        content: 'Los pagos se procesan de forma segura a través de la plataforma. Los precios mostrados incluyen todos los impuestos aplicables. Las cancelaciones están sujetas a la política de cada profesional.'
      },
      {
        title: '6. Limitación General de Responsabilidad',
        content: 'En máxima medida por ley, Adomiapp NO responsable por daño directo, indirecto, incidental, especial, consecuente o punitivo, incluyendo pérdida ganancias, datos, uso, fondo comercio u otras pérdidas intangibles, de:',
        list: [
          'Acceso/uso o imposibilidad de usar Plataforma',
          'Conducta/contenido terceros (difamatoria, ofensiva, ilegal)',
          'Servicio por Profesionales (negligencia, mala conducta, daños propiedad, lesiones, muerte)',
          'Disputa o conflicto Cliente-Profesional'
        ]
      },
      {
        title: '7. Indemnización',
        content: 'Usted acepta defender, indemnizar y mantener indemne a Adomiapp, directores, empleados y agentes, contra reclamo, demanda, daño, pérdida, costo, deuda y gastos (honorarios abogados) de:',
        list: [
          'Uso y acceso a Plataforma',
          'Violación de términos de Condiciones',
          'Violación derechos tercero (autor, propiedad, privacidad)',
          'Reclamo que contenido/acciones causaron daño a tercero'
        ]
      },
      {
        title: '8. Privacidad y Datos',
        content: 'Nos comprometemos a proteger su privacidad. Consulte nuestra Política de Privacidad para más información sobre manejo de datos personales.'
      },
      {
        title: '9. Modificaciones',
        content: 'Adomiapp se reserva el derecho de modificar estos términos en cualquier momento. Los cambios entran en vigor inmediatamente tras su publicación.'
      },
      {
        title: '10. Ley Aplicable y Jurisdicción',
        content: 'Estos Términos se regirán por leyes de República de Chile. Disputa, controversia o reclamo se someterá a jurisdicción exclusiva de tribunales ordinarios de Santiago, Chile, renunciando a cualquier otro fuero.'
      },
      {
        title: '11. Contacto',
        content: 'Para preguntas sobre estos Términos: soporte@adomiapp.com | +56 9 XXXX XXXX'
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

