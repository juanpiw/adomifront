import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../../libs/shared-ui/icon/icon.component';
import jsPDF from 'jspdf';
import { ActivatedRoute } from '@angular/router';

type TabType = 'terminos' | 'privacidad';

@Component({
  selector: 'app-client-terminos',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './terminos.component.html',
  styleUrls: ['./terminos.component.scss']
})
export class ClientTerminosComponent implements OnInit {
  lastUpdated = 'Octubre 2025';
  activeTab: TabType = 'terminos';
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    const tabFromData = String(this.route.snapshot.data?.['tab'] || '').toLowerCase();
    const tabFromQuery = String(this.route.snapshot.queryParamMap.get('tab') || '').toLowerCase();
    const tab = (tabFromData || tabFromQuery) as TabType;
    if (tab === 'privacidad' || tab === 'terminos') {
      this.activeTab = tab;
    }
  }

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
        content: 'Adomiapp es una plataforma tecnológica que intermedia la contratación entre Clientes y Profesionales independientes, facilitando publicación, agenda, mensajería, pagos y gestión de incidencias.',
        list: [
          'El Servicio es ejecutado por el Profesional, responsable por calidad, permisos, seguridad y cumplimiento normativo',
          'Adomiapp asume obligaciones propias como operador: información esencial, canal de soporte/reclamos y aplicación de flujos de pagos/retenciones/disputas/reembolsos',
          'La Plataforma puede contener enlaces o integraciones de terceros, sujetos a sus propios términos'
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
        title: '5. Pagos, Autorizaciones y Retención ("hold")',
        content: 'Los pagos se procesan mediante un PSP autorizado. Al registrar un medio de pago/Oneclick, el Cliente autoriza la tokenización por el PSP (Adomiapp no almacena datos completos de tarjeta).',
        list: [
          'Al confirmar una reserva, el Cliente autoriza el cargo del monto informado del Servicio',
          'Cargos de cancelación/no-show solo si fueron informados antes de pagar y se cumplen condiciones objetivas',
          'El pago puede permanecer retenido hasta finalización del Servicio (código/botón) o auto-liberación si no hay reclamo dentro del plazo'
        ]
      },
      {
        title: '6. Reembolsos, Contracargos y Disputas',
        content: 'Por regla general, los reembolsos se efectúan mediante Créditos Adomi utilizables en la Plataforma. Adomiapp puede devolver por el mismo medio de pago en casos excepcionales (cobro duplicado, monto incorrecto por falla técnica, instrucción del PSP/banco, fraude comprobado o cuando sea legalmente exigible).',
        list: [
          'Si el Cliente desconoce un cargo o reporta un problema de cobro, debe ingresarlo primero por el canal de reclamos de la Plataforma (sin limitar derechos del consumidor)',
          'Al abrirse un reclamo/contracargo, el pago puede quedar retenido/bloqueado y se solicitará evidencia a ambas partes',
          'Evidencia válida: chat, timestamps, geolocalización (si aplica), fotos, comprobantes y confirmación por código/botón'
        ]
      },
      {
        title: '7. Limitación General de Responsabilidad',
        content: 'En máxima medida por ley, Adomiapp NO responsable por daño directo, indirecto, incidental, especial, consecuente o punitivo, incluyendo pérdida ganancias, datos, uso, fondo comercio u otras pérdidas intangibles, de:',
        list: [
          'Acceso/uso o imposibilidad de usar Plataforma',
          'Conducta/contenido terceros (difamatoria, ofensiva, ilegal)',
          'Servicio por Profesionales (negligencia, mala conducta, daños propiedad, lesiones, muerte)',
          'Disputa o conflicto Cliente-Profesional'
        ]
      },
      {
        title: '8. Indemnización',
        content: 'Usted acepta defender, indemnizar y mantener indemne a Adomiapp, directores, empleados y agentes, contra reclamo, demanda, daño, pérdida, costo, deuda y gastos (honorarios abogados) de:',
        list: [
          'Uso y acceso a Plataforma',
          'Violación de términos de Condiciones',
          'Violación derechos tercero (autor, propiedad, privacidad)',
          'Reclamo que contenido/acciones causaron daño a tercero'
        ]
      },
      {
        title: '9. Privacidad y Datos',
        content: 'Consulte nuestra Política de Privacidad para información sobre finalidades, bases de tratamiento, retención, terceros y derechos. Adomiapp puede ajustar sus prácticas para alinearse con estándares regulatorios vigentes y futuros (por ejemplo, Ley 21.719).'
      },
      {
        title: '10. Modificaciones',
        content: 'Adomiapp se reserva el derecho de modificar estos términos en cualquier momento. Los cambios entran en vigor inmediatamente tras su publicación.'
      },
      {
        title: '11. Ley Aplicable y Jurisdicción',
        content: 'Estos Términos se regirán por leyes de República de Chile. Disputa, controversia o reclamo se someterá a jurisdicción exclusiva de tribunales ordinarios de Santiago, Chile, renunciando a cualquier otro fuero.'
      },
      {
        title: '12. Contacto',
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

