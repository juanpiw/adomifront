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
        content: 'Adomiapp es una plataforma tecnológica que intermedia la contratación entre Clientes y Profesionales independientes, facilitando publicación, agenda, mensajería, pagos y gestión de incidencias.',
        list: [
          'El Servicio es ejecutado por el Profesional, responsable por calidad, idoneidad, permisos, seguridad y cumplimiento normativo',
          'Sin perjuicio de lo anterior, Adomiapp asume obligaciones propias como operador: información esencial, canal de soporte/reclamos y aplicación de flujos de pagos/retenciones/disputas/reembolsos',
          'Adomiapp no emplea ni supervisa el trabajo del Profesional; no es parte del contrato por el Servicio salvo obligaciones propias como plataforma',
          'La Plataforma puede contener enlaces o integraciones de terceros, sujetos a sus propios términos'
        ]
      },
      {
        title: '3. Relación Jurídica: Contratistas Independientes',
        content: 'Usted reconoce que actúa como entidad económica independiente (persona natural con inicio de actividades o empresa). Relación estrictamente comercial, NO laboral.',
        list: [
          'Aporta herramientas: Usa herramientas, equipos, materiales propios',
          'Asume costos y riesgos: Responsable de transporte, materiales, seguros, cotizaciones',
          'Sin supervisión directa: Adomiapp no controla métodos o técnicas. Calificaciones NO son supervisión laboral',
          'Sin beneficios laborales: No vacaciones, licencias, gratificaciones, seguro cesantía',
          'Sin exclusividad: Libre de trabajar con otras plataformas o clientes propios'
        ]
      },
      {
        title: '4. Verificación de Usuarios y Descargo',
        content: 'Adomiapp podrá, pero no está obligada a, verificar antecedentes o credenciales al registro.',
        list: [
          'Verificación basada en información proporcionada, sin garantía de exactitud o vigencia',
          'Sin obligación de seguimiento continuo de antecedentes',
          'Cliente responsable de evaluar idoneidad y confiabilidad',
          'Sistema de calificaciones es referencia de opiniones, NO garantía de Adomiapp'
        ]
      },
      {
        title: '5. Seguros',
        content: 'El Profesional es el único y exclusivo responsable de obtener y mantener seguro de responsabilidad civil adecuado para cubrir daño, perjuicio o siniestro durante prestación de Servicios. Adomiapp no proporciona ni se hace responsable de seguros.'
      },
      {
        title: '6. Pagos, retención ("hold") y obligaciones tributarias',
        content: 'Cuando un Cliente paga con tarjeta, el monto puede permanecer retenido (escrow/hold) hasta verificación de finalización del Servicio. Los depósitos ocurren según plazos del PSP (usualmente 3–5 días hábiles) desde la captura/liberación.',
        list: [
          'Verificación: liberación estándar cuando el Cliente marca “Finalizar Servicio”',
          'Auto-liberación: si no hay reclamo/disputa/no-show dentro de 48 horas desde la hora de término agendada, Adomiapp puede liberar automáticamente',
          'Tributación: usted emite boleta/factura al Cliente cuando corresponda; Adomiapp emite documento por su comisión',
          'Usted declara y paga impuestos ante SII (IVA/renta cuando proceda)'
        ]
      },
      {
        title: '7. Disputas de pago, contracargos y cooperación',
        content: 'Al abrirse un reclamo/contracargo, el pago puede quedar retenido/bloqueado y se solicitará evidencia a ambas partes. Esto no limita los derechos del consumidor.',
        list: [
          'Evidencia válida: chat, timestamps, geolocalización (si aplica), fotos, comprobantes y confirmación por código/botón',
          'Costos: usted autoriza a descontar montos revertidos, fees/costos de contracargo del PSP y ajustes desde su wallet o pagos futuros, cuando corresponda'
        ]
      },
      {
        title: '8. Limitación General de Responsabilidad',
        content: 'En la máxima medida permitida por ley, Adomiapp NO responsable por daño directo, indirecto, incidental, especial, consecuente o punitivo, incluyendo pérdida de ganancias, datos, uso, fondo de comercio, que resulte de:',
        list: [
          'Acceso o uso, o imposibilidad de usar la Plataforma',
          'Conducta o contenido de terceros (difamatoria, ofensiva, ilegal)',
          'Servicio prestado por Profesionales (negligencia, mala conducta, daños, lesiones, muerte)',
          'Disputa o conflicto entre Cliente y Profesional'
        ]
      },
      {
        title: '9. Indemnización',
        content: 'Usted acepta defender, indemnizar y mantener indemne a Adomiapp, directores, empleados y agentes, contra reclamo, demanda, daño, pérdida, costo, deuda y gastos (incluidos honorarios de abogados) que surjan de:',
        list: [
          'Su uso y acceso a la Plataforma',
          'Violación de cualquier término de estas Condiciones',
          'Violación de derechos de tercero (autor, propiedad, privacidad)',
          'Reclamo de que su contenido o acciones causaron daño a tercero'
        ]
      },
      {
        title: '10. Cancelaciones / No-show',
        content: 'Cancelaciones +24h sin penalización. Tardías afectan calificación.'
      },
      {
        title: '11. Planes',
        content: 'Planes con beneficios variables. Gratuito con limitaciones. Pago renovación automática.'
      },
      {
        title: '12. Ley y Jurisdicción',
        content: 'Regido por leyes de Chile. Disputas en tribunales Santiago, Chile.'
      },
      {
        title: '13. Contacto',
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

