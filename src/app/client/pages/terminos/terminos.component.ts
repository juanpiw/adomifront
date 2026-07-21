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
  lastUpdated = '12 de julio de 2026';
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
        title: '1. Definiciones',
        list: [
          'Plataforma: El sitio web, app móvil y APIs de Adomiapp, operados por Adomiapp.',
          'Profesional: Proveedor/a independiente que ofrece Servicios a través de la Plataforma.',
          'Cliente: Usuario/a que solicita y contrata Servicios de un Profesional.',
          'Servicios: Actividades profesionales ofrecidas por los Profesionales a los Clientes.',
          'Cuenta: Perfil registrado en la Plataforma (Profesional o Cliente).',
          'PSP: Proveedor/a externo de servicios de pago (pasarela, split, escrow).',
          'Contenido: Textos, imágenes, valoraciones, perfiles y demás información cargada por usuarios.',
        ],
      },
      {
        title: '2. Naturaleza y alcance de Adomiapp (Marketplace / Intermediación)',
        paragraphs: [
          'Adomiapp es una plataforma tecnológica que intermedia la contratación entre Clientes y Profesionales independientes, facilitando publicación, agenda, mensajería, pagos y gestión de incidencias.',
          'El Servicio es ejecutado por el Profesional, quien es responsable por su calidad, idoneidad, permisos, seguridad y cumplimiento normativo aplicable.',
          'Sin perjuicio de lo anterior, Adomiapp asume obligaciones propias como operador de plataforma, incluyendo: (i) entregar información esencial del Servicio y del Profesional disponible en la Plataforma, (ii) habilitar un canal de soporte/reclamos, y (iii) aplicar los flujos de pagos, retenciones, disputas y reembolsos descritos en estos Términos y Políticas.',
          'Adomiapp puede incluir enlaces o integraciones de terceros; su uso se rige por términos propios de dichos terceros.',
        ]
      },
      {
        title: '3. Elegibilidad y registro de cuentas',
        list: [
          'Debes tener 18 años o más y capacidad legal para contratar.',
          'La información de registro debe ser veraz, exacta y actualizada.',
          'Adomiapp puede solicitar verificación de identidad/KYC, documentos tributarios o profesionales.',
          'Eres responsable de la confidencialidad de tus credenciales y de toda actividad realizada con tu Cuenta.',
          'Adomiapp puede suspender o cerrar Cuentas por incumplimientos, fraudes o riesgos para la comunidad.',
        ]
      },
      {
        title: '4. Verificación, reputación y moderación',
        paragraphs: [
          'Adomiapp puede realizar verificaciones (identidad, antecedentes, credenciales), sin estar obligada a ello ni garantizar su vigencia o exactitud. La reputación (ratings/comentarios) es una herramienta orientativa basada en experiencias de usuarios y no equivale a certificación ni recomendación.',
          'Adomiapp podrá moderar o remover Contenido que: (i) incumpla estos Términos, (ii) vulnere derechos de terceros, (iii) afecte la seguridad o (iv) constituya publicidad engañosa, difamación, datos sensibles, o información personal de terceros sin autorización.',
          'Visibilidad y Posicionamiento: Adomiapp se reserva el derecho exclusivo de determinar el algoritmo, los criterios de búsqueda, el posicionamiento y la visibilidad de los perfiles de los Profesionales en la Plataforma. Estos criterios pueden incluir, de forma no taxativa, la calificación de los Clientes, la tasa de respuesta, la disponibilidad, el historial de cancelaciones y el cumplimiento de estos Términos.',
        ]
      },
      {
        title: '5. Obligaciones del Cliente',
        list: [
          'Proveer información correcta y condiciones seguras para la ejecución del Servicio.',
          'Pagar el precio acordado y cargos aplicables.',
          'No solicitar actividades ilegales o que excedan lo contratado.',
        ]
      },
      {
        title: '6. Planes, suscripciones y comisiones',
        paragraphs: [
          'Adomiapp cobra una comisión del 25% sobre el valor del Servicio efectivamente pagado, salvo otra comisión vigente indicada en la app/plan.',
          'Los planes de pago se renuevan automáticamente (mensual/anual) hasta su cancelación. Puedes cancelar desde tu Cuenta (la cancelación evita renovaciones futuras, no reembolsa periodos ya devengados).',
          'Adomiapp puede modificar precios y comisiones con aviso previo de 15 días. Cambios rigen para Servicios futuros.',
        ]
      },
      {
        title: '7. Pagos, facturación y tributación (Chile)',
        paragraphs: [
          'Los pagos se procesan mediante PSP autorizado. El depósito al Profesional se realiza típicamente en 3–5 días hábiles desde el pago del Cliente, sujeto a conciliación, medidas anti-fraude y plazos del PSP.',
          '7.X Autorización de pago (Oneclick / tokenización / cargos): Al registrar un medio de pago o usar Oneclick, el Cliente autoriza la tokenización por el PSP (Adomiapp no almacena datos completos de tarjeta; conserva identificadores/tokens). Al confirmar una reserva, el Cliente autoriza a Adomiapp/PSP a: (a) cargar el monto informado del Servicio mediante captura diferida u otro método autorizado, (b) aplicar cargos de cancelación/no-show solo si fueron informados antes de pagar y se cumplen condiciones objetivas, y (c) ejecutar ajustes por error de cobro o reversas instruidas por el PSP/banco cuando corresponda.',
          '7.Y Retención operativa (“hold”) y liberación: Para reducir fraudes y disputas, el pago puede permanecer retenido hasta: (i) finalización del Servicio mediante código/botón, o (ii) auto-liberación si no hay reclamo dentro del plazo definido en §16.',
          'Boletas/facturas: El Profesional es responsable de emitir el documento tributario al Cliente cuando corresponda, y Adomiapp emite el documento por su comisión al Profesional. Alternativamente, si el modelo operacional lo requiere, Adomiapp podrá emitir boleta/factura a nombre del Profesional como agente de facturación, previa autorización expresa (ver Anexo C).',
          'El Cliente podrá solicitar boleta/factura al Profesional cuando corresponda, y el Profesional se obliga a entregarla conforme la normativa tributaria aplicable.',
          'El Profesional es responsable de declarar y pagar sus impuestos ante el SII, incluyendo IVA y renta cuando proceda.',
          'Chargebacks/reembolsos: Los montos devueltos al Cliente (por reversa bancaria o PSP) se deducen de futuros pagos al Profesional. Adomiapp puede retener fondos ante disputas/contracargos hasta su resolución.',
        ]
      },
      {
        title: '8. Cancelaciones, no-show y reembolsos',
        paragraphs: [
          'Cliente (cancelación/reprogramación): Cancelaciones con +24h respecto a la hora de inicio → sin penalización. Con –24h, puede aplicar cargo por cancelación/no-show solo si fue informado antes del pago y se cumplen condiciones objetivas mínimas (p. ej., registro de llegada, timestamps, comunicaciones).',
          'Derecho de Retracto: Conforme al artículo 3 bis letra b) de la Ley N° 19.496 sobre Protección de los Derechos de los Consumidores, el Cliente acepta expresamente que, dada la naturaleza de los Servicios de intermediación que presta Adomiapp, y una vez que el Servicio con el Profesional ha comenzado a ejecutarse o se encuentra dentro de las 24 horas previas a su inicio programado, no procederá el derecho de retracto.',
          'Profesional: Cancelaciones injustificadas o reiteradas pueden afectar su reputación, visibilidad y acceso, y podrían generar cargos operativos cuando existan costos directos asociados.',
          'Reembolsos (regla general y excepciones): Por regla general, los reembolsos se efectuarán mediante Créditos Adomi utilizables en la Plataforma, por motivos operativos y costos de pasarela, informados antes del pago. Excepciones: Adomiapp podrá devolver por el mismo medio de pago cuando exista: (i) cobro duplicado, (ii) monto incorrecto por falla técnica, (iii) instrucción del PSP/banco, (iv) fraude comprobado, o (v) cuando sea legalmente exigible. La política aplicable se muestra en el flujo de reserva/checkout y en el correo de confirmación.',
        ]
      },
      {
        title: '9. Obligaciones del Profesional',
        list: [
          'Legalidad y licencias: Cumplir toda normativa aplicable a su rubro, incluyendo sanitarias, municipales, de seguridad y consumo.',
          'Calidad y seguridad: Prestar Servicios con diligencia profesional, buenas prácticas y cuidado razonable.',
          'Transparencia de precios: Publicar precios y condiciones completas (incluyendo cargos adicionales previsibles).',
          'No sustitución no autorizada: No delegar el Servicio a terceros no registrados/validados.',
          'Datos personales y Secreto Profesional: Tratar datos del Cliente solo para ejecutar el Servicio y conforme a la ley, al Código de Ética Profesional y a la Política de Privacidad de Adomiapp.',
        ]
      },
      {
        title: '10. Relación con Profesionales: contratistas independientes',
        paragraphs: [
          'El Profesional declara y garantiza actuar como entidad económica independiente (persona natural con inicio de actividades o empresa). La relación con Adomiapp es comercial y no laboral. En particular, el Profesional:',
        ],
        list: [
          'Usa sus propias herramientas y materiales.',
          'Asume sus costos y riesgos (transporte, insumos, seguros, cotizaciones, licencias).',
          'No está sujeto a jornadas, metas, supervisión o órdenes de Adomiapp; las calificaciones de usuarios no constituyen subordinación.',
          'No recibe beneficios laborales (vacaciones, licencias, gratificaciones, etc.).',
          'No tiene exclusividad: puede usar otras plataformas o canales.',
        ],
        paragraphsAfterList: [
          'Para evitar apariencias de subordinación, Adomiapp no impone horarios obligatorios, uniformes, multas punitivas, ni sanciones automáticas opacas. Los ajustes de visibilidad o acceso por incumplimientos siguen un proceso transparente (ver §15).',
          'Ausencia de garantías de flujo o ingresos: Adomiapp no garantiza, bajo ninguna circunstancia, un volumen mínimo de Clientes, cantidad de reservas, ni un nivel específico de ingresos o ganancias para el Profesional. La Plataforma opera como un espacio de intermediación sujeto a las dinámicas de libre mercado. La obtención de Clientes depende exclusivamente de la demanda de los usuarios, la visibilidad del perfil, la competitividad de los precios del Profesional, su reputación en la Plataforma y la calidad de su oferta. El Profesional asume íntegra y exclusivamente su propio riesgo comercial al utilizar la Plataforma.',
        ],
      },
      {
        title: '11. Seguros',
        paragraphs: [
          'El Profesional es único responsable de contar con seguro de responsabilidad civil adecuado. Adomiapp no provee seguros ni responde por daños derivados de la ejecución de los Servicios.',
        ]
      },
      {
        title: '12. Uso aceptable y prohibiciones',
        paragraphs: ['Queda prohibido:'],
        list: [
          '(i) Vulnerar la ley',
          '(ii) Difamar, discriminar o acosar',
          '(iii) Subir malware o interferir con la Plataforma',
          '(iv) Eludir tarifas, pagos o procesos de Adomiapp',
          '(v) Publicar información falsa/engañosa',
          '(vi) Recolectar datos de otros usuarios sin base legal',
          '(vii) Compartir credenciales',
        ],
        paragraphsAfterList: ['Detalle en Anexo A (Conductas Prohibidas).'],
      },
      {
        title: '13. Propiedad intelectual y licencias',
        paragraphs: [
          'Adomiapp y sus componentes (software, marcas, diseños) son de Adomiapp o sus licenciantes.',
          'El usuario conserva derechos sobre su Contenido y otorga a Adomiapp una licencia no exclusiva, mundial, gratuita y sublicenciable para alojar, reproducir y mostrar dicho Contenido a efectos de operar la Plataforma.',
          'No se concede licencia implícita sobre marcas o software de Adomiapp.',
        ]
      },
      {
        title: '14. Datos personales y comunicaciones',
        paragraphs: [
          'El tratamiento de datos se rige por la Política de Privacidad (parte integrante de estos Términos) y la Ley 19.628 (y futura Ley 21.719 o normas aplicables).',
          'La Política de Privacidad detalla finalidades y bases de tratamiento, plazos de retención, terceros (p. ej., PSP, analítica), y los derechos de los titulares. Adomiapp puede actualizar sus prácticas para alinearse con estándares regulatorios vigentes y futuros.',
          'Adomiapp puede enviarte comunicaciones transaccionales y, con tu consentimiento, comunicaciones comerciales; podrás revocar dicho consentimiento en cualquier momento.',
          'Los permisos de dispositivo (ubicación, cámara, etc.) se solicitan solo cuando son necesarios para la funcionalidad.',
        ]
      },
      {
        title: '15. Medidas de seguridad, cumplimiento y sanciones',
        paragraphs: ['Para proteger a la comunidad, Adomiapp puede adoptar medidas proporcionadas y transparentes:'],
        list: [
          'Alertas y advertencias',
          'Limitación temporal',
          'Retiro de Contenido',
          'Retención de pagos ante sospecha de fraude o incumplimientos',
          'Suspensión/cierre de Cuenta',
        ],
        paragraphsAfterList: [
          'Antes de medidas severas no urgentes, Adomiapp procurará notificar y ofrecer instancia de descargos. En casos de riesgo grave/inmediato, podrá actuar sin aviso previo.',
        ]
      },
      {
        title: '16. Disputas entre Cliente y Profesional',
        paragraphs: [
          'Las disputas por el Servicio deben intentarse resolver directamente entre Cliente y Profesional mediante el chat de la Plataforma o canal habilitado. Si no hay acuerdo, Adomiapp puede (sin obligación) facilitar una mediación interna no vinculante basada en la evidencia disponible (mensajes, fotos, geolocalización, etc.).',
          'Esto no limita los derechos del consumidor ante SERNAC o tribunales competentes.',
          '16.B Disputas de pago, contracargos y cooperación: (1) Primero Adomiapp: si el Cliente desconoce un cargo o reporta un problema de cobro, deberá ingresarlo por el canal de reclamos de la Plataforma antes de iniciar gestiones externas, para permitir revisión rápida (sin limitar derechos del consumidor). (2) Congelamiento: al abrirse un reclamo/contracargo, Adomiapp puede bloquear el pago, retener fondos o solicitar evidencia a ambas partes. (3) Evidencia válida: mensajes del chat, timestamps, geolocalización (si aplica), fotos, comprobantes de llegada/ejecución y confirmación por código/botón. (4) Resultados: si la reversa prospera por causa atribuible al Servicio (p. ej., no prestación demostrada), se podrá revertir el pago y ajustar balances; si el reclamo resulta fraudulento o abusivo, Adomiapp podrá restringir cuentas y aplicar medidas antifraude (§15). (5) Costos: el Profesional autoriza a descontar montos revertidos y fees de contracargo desde su wallet o pagos futuros, cuando corresponda.',
          '16.C Confirmación de Servicio (código/botón) y auto-liberación: (1) El código/botón “Finalizar” constituye un mecanismo de confirmación de que el Servicio fue prestado. (2) Si no existe reclamo dentro de un plazo razonable desde la hora de término, Adomiapp podrá auto-liberar el pago al Profesional. (3) Si existe disputa dentro del plazo, el pago queda retenido/bloqueado hasta resolución.',
        ]
      },
      {
        title: '17. Garantías, exenciones y limitación de responsabilidad',
        paragraphs: [
          'La Plataforma se proporciona "tal cual" y "según disponibilidad". Adomiapp no garantiza disponibilidad ininterrumpida ni ausencia de errores.',
          'En la máxima medida permitida por ley, Adomiapp no será responsable por daños indirectos, especiales, emergentes, lucro cesante, pérdida de oportunidad comercial, expectativas de ingresos no cumplidas, falta de clientela, o pérdida de datos, ni por actos/omisiones de terceros (incluidos Profesionales y Clientes).',
          'Límite agregado de responsabilidad de Adomiapp: el menor entre (i) UF 50 y (ii) el total de comisiones pagadas por el Profesional a Adomiapp en los últimos 6 meses previos al hecho generador.',
          'Nada de lo anterior limita responsabilidad por dolo o cuando la ley lo prohíba.',
        ]
      },
      {
        title: '18. Indemnidad',
        paragraphs: ['El usuario defenderá e indemnizará a Adomiapp, sus directores/as, trabajadores/as y agentes frente a reclamos, daños, costos (incluidos honorarios legales razonables) derivados de:'],
        list: [
          '(i) Incumplimiento de estos Términos',
          '(ii) Infracción de derechos de terceros',
          '(iii) Contenido o conductas del usuario',
          '(iv) Prestación o recepción de Servicios fuera de la Plataforma',
        ]
      },
      {
        title: '19. Fuerza mayor',
        paragraphs: [
          'Adomiapp no será responsable por incumplimientos debidos a eventos fuera de su control razonable (p. ej., desastres naturales, fallas de Internet/PSP, actos de autoridad).',
        ]
      },
      {
        title: '20. Cambios a los Términos',
        paragraphs: [
          'Adomiapp puede modificar estos Términos con aviso previo de 15 días (o el plazo legal que corresponda). El uso posterior a dicho plazo implica aceptación. Cambios sustanciales se comunicarán por correo/app.',
        ]
      },
      {
        title: '21. Terminación',
        paragraphs: [
          'El usuario puede cerrar su Cuenta en cualquier momento. Adomiapp puede terminar o suspender Cuentas por incumplimiento, fraude o riesgo. Al terminar, subsisten las cláusulas por su naturaleza: propiedad intelectual, pagos pendientes, responsabilidad, indemnidad, ley aplicable y jurisdicción.',
        ]
      },
      {
        title: '22. Ley aplicable, consumo y jurisdicción',
        paragraphs: [
          'Se aplican las leyes de la República de Chile. Para consumidores, prevalecen los derechos irrenunciables de la Ley 19.496.',
          'Toda controversia se somete a los tribunales ordinarios de justicia de Santiago de Chile, sin perjuicio de la competencia del SERNAC u organismos sectoriales cuando corresponda.',
          'Si alguna disposición se declara inválida, el resto permanece vigente.',
        ]
      },
      {
        title: '23. Diversos',
        list: [
          'Cesión: Adomiapp puede ceder su posición contractual. El usuario no puede ceder sin autorización.',
          'Notificaciones: Por app/correo al email registrado.',
          'Acuerdo íntegro: Estos Términos + Política de Privacidad + políticas específicas reemplazan acuerdos previos.',
          'Idioma: En caso de discrepancia entre versiones, prevalece el español (Chile).',
        ]
      },
      {
        title: 'Anexo A: Conductas Prohibidas',
        list: [
          'Suplantar identidades, vulnerar privacidad o publicar datos de terceros sin permiso.',
          'Publicidad engañosa, promesas imposibles, comparativas denigratorias.',
          'Desintermediación (Bypass): Queda estrictamente prohibido utilizar la Plataforma para contactar a un usuario (Cliente o Profesional) con el fin de contratar, agendar, ofrecer o pagar Servicios por fuera de Adomiapp para eludir el pago de comisiones. Cualquier intento de compartir datos de contacto directos (teléfono, redes sociales, email) antes de confirmada una reserva, o invitar a transaccionar por fuera, será causal de suspensión inmediata y cierre definitivo de la Cuenta.',
          'Subir malware, hacer scraping, ingeniería inversa o ataques a la seguridad.',
          'Discriminación, acoso, violencia o incitación al odio.',
          'Publicar o solicitar Servicios ilegales o que requieran licencias no obtenidas.',
          'Compartir credenciales o vender Cuentas.',
        ]
      },
      {
        title: 'Anexo B: Términos para Profesionales y Prestadores de Salud',
        paragraphs: [
          'Estos términos especiales aplican a Profesionales, Técnicos en Enfermería (TENS), cuidadores/as, enfermeras/os, especialistas y otros prestadores que postulen, publiquen, acepten o ejecuten servicios domiciliarios de salud, asistencia, cuidado, confort o apoyo paliativo mediante Adomiapp.',
          'Al presionar el botón "Acepto los términos y condiciones de prestador", completar su registro, cargar documentos profesionales, activar su perfil o postular a cualquier solicitud de servicio domiciliario, el Profesional declara aceptar de forma libre, expresa e informada estas cláusulas de carácter civil y comercial.',
          'B.1. Naturaleza de la relación jurídica: ausencia de vínculo laboral. El Profesional y Aicomstudio SpA, operador de Adomiapp, declaran que la relación entre ambos es exclusivamente comercial y de prestación independiente de servicios inmateriales, regulada por el Código Civil y el Código de Comercio chileno. No existe contrato de trabajo, subordinación ni dependencia.',
        ],
        list: [
          'Ausencia de subordinación y dependencia: el Profesional no está sujeto a órdenes directas, instrucciones vinculantes de ejecución, metas impuestas ni supervigilancia temporal o técnica de Adomiapp en el domicilio. Las pautas de cuidado son definidas por el Cliente conforme a las prescripciones del médico tratante del Paciente.',
          'Inexistencia de jornada laboral: el Profesional conserva autonomía para determinar días, horas y turnos en que desea conectarse a la Plataforma y aceptar solicitudes. Adomiapp no impone horarios obligatorios.',
          'No exclusividad: el Profesional puede prestar servicios de forma directa, en clínicas, hospitales, centros de salud o mediante otras plataformas, sin restricción de Adomiapp.',
          'Exclusión de beneficios laborales: por la naturaleza civil y comercial de la relación, el Profesional no tiene derecho a remuneración fija, gratificaciones, vacaciones pagadas, feriados proporcionales, indemnización por años de servicio, asignaciones de colación o movilización, ni pago de licencias médicas bajo el Código del Trabajo.',
          'Condiciones operacionales y medios propios: el Profesional presta servicios con sus propios conocimientos técnicos, títulos habilitantes, competencias, uniformes y herramientas básicas, asumiendo costos de transporte, viáticos y riesgos asociados al traslado al domicilio del Cliente.',
          'Inicio de actividades: el Profesional deberá contar con iniciación de actividades vigente ante el Servicio de Impuestos Internos (SII), bajo la categoría tributaria correspondiente a su actividad profesional u oficio.',
          'Flujo económico: el Profesional mandata y autoriza a Adomiapp para actuar como agente de recaudación y cobranza tecnológica respecto de los montos pagados por el Cliente en la Plataforma.',
          'Comisión de intermediación: Adomiapp cobrará al Profesional una comisión del 25% o la tarifa vigente informada en la App sobre el valor total del Servicio efectivamente ejecutado y cobrado al Cliente.',
          'Plazos de pago: los fondos del Servicio, deducida la comisión de la Plataforma, se transferirán a la cuenta bancaria registrada por el Profesional dentro de 3 a 5 días hábiles desde la finalización efectiva del turno o liberación del hito de pago, sujeto a conciliación, validaciones antifraude y plazos del PSP.',
          'Obligación tributaria: el Profesional es responsable de emitir la boleta de honorarios electrónica al Cliente por el monto total bruto del servicio prestado. Adomiapp emitirá al Profesional la factura o boleta correspondiente por la comisión de intermediación digital.',
          'Validación de antecedentes: el Profesional autoriza a Adomiapp a exigir cédula vigente, certificado de antecedentes para fines especiales y certificado de inscripción vigente en el Registro Nacional de Prestadores Individuales cuando corresponda.',
          'Cumplimiento normativo: el Profesional se obliga a ejecutar sus labores con apego a las normas éticas de su profesión, la Lex Artis médica y las indicaciones e insumos proporcionados en el domicilio, bajo su exclusiva responsabilidad civil y penal individual.',
          'Autonomía comercial y riesgo propio: Adomiapp no garantiza volumen mínimo de ofertas, turnos asignados, regularidad de llamados, ingresos base ni ganancias mínimas. El Profesional asume íntegramente su propio riesgo comercial.',
          'Reputación y moderación: las calificaciones y ratings no constituyen subordinación ni poder de dirección laboral. Adomiapp podrá suspender o bloquear el acceso ante falsificación documental, pérdida de vigencia de títulos, bypass, maltrato o abandono injustificado del Paciente, difamación, fraude financiero o riesgos para la comunidad.',
          'Ley aplicable: estos términos especiales se rigen por las leyes de la República de Chile y las controversias se someten a los Tribunales Ordinarios de Justicia de Santiago de Chile, sin perjuicio de competencias legales irrenunciables cuando correspondan.',
        ]
      },
      {
        title: 'Anexo C: Términos para Clientes en Modalidad Salud y Cuidado Domiciliario',
        paragraphs: [
          'Estos términos especiales aplican al Cliente, familiar responsable o tercero contratante que solicita, programa, paga o coordina servicios domiciliarios de salud, cuidado, asistencia, confort o soporte paliativo para sí mismo o para un Paciente mediante Adomiapp.',
          'Al registrarse, utilizar la Plataforma, solicitar una reserva, entregar antecedentes clínicos o proceder al pago de cualquier hito, el Cliente declara haber leído, comprendido y aceptado estas reglas especiales de la modalidad salud.',
          'Adomiapp es una plataforma tecnológica de intermediación, validación documental previa, asignación y coordinación operacional de profesionales y prestadores independientes. Adomiapp no es un centro de salud, clínica, hospital, prestador institucional, servicio médico directo ni empleador del personal asignado.',
          'El Servicio es ejecutado de forma autónoma por el Profesional, quien responde por su calidad, idoneidad, permisos, seguridad, actos u omisiones en el domicilio y cumplimiento normativo aplicable, incluyendo la Lex Artis cuando corresponda.',
        ],
        list: [
          'Cliente y familiar responsable: el Cliente debe tener 18 años o más, capacidad legal para contratar en Chile y autorización suficiente cuando contrata para un tercero o Paciente.',
          'Veracidad de antecedentes: la información de registro, domicilio, condiciones de acceso, antecedentes del Cliente y datos clínicos del Paciente deben ser veraces, completos, exactos y actualizados.',
          'Información médica: diagnósticos, recetas, pautas de medicamentos, indicaciones de cuidado y documentos clínicos entregados deben ser fidedignos, vigentes y emitidos por profesional médico habilitado cuando corresponda.',
          'Actualización clínica: cualquier cambio de tratamiento, condición clínica, movilidad, riesgo de caída, oxigenoterapia, heridas, alergias, indicación farmacológica o requerimiento especial debe informarse de inmediato.',
          'Suministro total de insumos clínicos: el Cliente debe proveer de forma oportuna y suficiente elementos de protección personal, asepsia, higiene, confort y cuidado requeridos, incluyendo guantes, pecheras, pañales, toallitas húmedas, alcohol, apósitos, cremas barrera, medicamentos prescritos y otros insumos necesarios.',
          'Seguridad y habitabilidad: el domicilio debe contar con condiciones seguras, higiénicas, acceso razonable, iluminación, ventilación, espacio de trabajo y trato digno para el Profesional.',
          'Prohibición de maltrato: cualquier maltrato físico, verbal, psicológico, discriminación, acoso o amenaza contra el Profesional podrá generar suspensión o cierre de cuenta.',
          'Modalidades de jornada: los servicios de salud y cuidado podrán contratarse por turnos, fines de semana, jornadas de 12 o 24 horas, o paquetes mensuales sujetos a disponibilidad y condiciones informadas en la Plataforma.',
          'Hito 1 o anticipo de reserva: podrá corresponder al 50% del valor total del ciclo o al monto informado en checkout. Su pago activa asignación, validación operacional de relevos y preparación de antecedentes. Sin este pago no se inicia cobertura.',
          'Hito 2 o cierre de ciclo: podrá corresponder al saldo restante, cargado al cumplirse el hito operativo informado, por ejemplo el término del segundo fin de semana o turno pactado.',
          'Tokenización y cargos diferidos: al registrar un medio de pago, el Cliente autoriza la tokenización segura por el PSP y cargos diferidos asociados a hitos, no-show, cancelaciones tardías o ajustes informados antes del pago.',
          'Impago o retraso: el retraso o impago de hitos económicos podrá habilitar suspensión de la cobertura, sin responsabilidad de Adomiapp por la discontinuidad causada por falta de pago.',
          'Cancelaciones: las cancelaciones con más de 24 horas podrán no tener penalización, salvo costos informados o reglas del plan. Cancelaciones con menos de 24 horas o ausencia en domicilio podrán generar cargos conforme al checkout.',
          'Exclusión del derecho de retracto: una vez iniciado el Servicio o dentro de las 24 horas previas a su ejecución programada, el Cliente acepta que no procederá el derecho de retracto conforme al artículo 3 bis letra b) de la Ley N° 19.496.',
          'Reembolsos: por regla general, los reembolsos aprobados podrán efectuarse mediante Créditos Adomi, salvo cobro duplicado, falla técnica comprobada, instrucción del PSP/banco, fraude acreditado o exigencia legal.',
          'Riesgos clínicos: Adomiapp asume una obligación de medios tecnológicos, coordinación y filtro documental, no de resultados clínicos o médicos. No garantiza evolución, estabilización, mejoría o curación del Paciente.',
          'Responsabilidad del Profesional: el Cliente acepta que el Profesional actúa bajo su libre ejercicio profesional o actividad independiente, respondiendo individualmente por negligencia, impericia, mala praxis, maltrato, hurto u otros actos civiles o penales ejecutados en el domicilio.',
          'Falta de insumos: la falta, escasez, inoportunidad o mala calidad de insumos provistos por la familia podrá eximir a Adomiapp y al Profesional de responsabilidad por complicaciones derivadas.',
          'Fármacos y procedimientos: cuidadoras estándar se limitan al recordatorio y asistencia en ingesta de medicamentos orales previamente dosificados. TENS o profesionales habilitados podrán ejecutar procedimientos autorizados por su título solo con orden o prescripción médica vigente. El personal no puede modificar dosis, suspender tratamientos, indicar medicamentos ni emitir diagnósticos.',
          'Continuidad operacional: Adomiapp procurará gestionar sustituciones ante licencias, inasistencias, fuerza mayor o caso fortuito, sujeto a disponibilidad real de profesionales, cobertura geográfica, condiciones del domicilio, pago vigente y colaboración oportuna del Cliente.',
        ]
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

    // Contenido legado
    if (section.content) {
      y = this.writeWrappedText(doc, String(section.content), y, margin, maxWidth, pageHeight);
    }

    // Párrafos
    if (Array.isArray(section.paragraphs)) {
      section.paragraphs.forEach((paragraph: string) => {
        y = this.writeWrappedText(doc, paragraph, y, margin, maxWidth, pageHeight);
      });
    }

    // Lista
    if (section.list) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      section.list.forEach((item: string) => {
        y = this.writeWrappedText(doc, '✓ ' + item, y, margin + 5, maxWidth - 5, pageHeight, 4);
      });
      y += 3;
    }

    if (Array.isArray(section.paragraphsAfterList)) {
      section.paragraphsAfterList.forEach((paragraph: string) => {
        y = this.writeWrappedText(doc, paragraph, y, margin, maxWidth, pageHeight);
      });
    }

    y += 5; // Espacio entre secciones
    return y;
  }

  private writeWrappedText(
    doc: jsPDF,
    text: string,
    yPos: number,
    x: number,
    maxWidth: number,
    pageHeight: number,
    spacingAfter = 5
  ): number {
    let y = yPos;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const lines = doc.splitTextToSize(String(text || ''), maxWidth);

    lines.forEach((line: string) => {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, x, y);
      y += 5;
    });

    return y + spacingAfter;
  }
}

