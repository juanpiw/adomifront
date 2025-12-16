import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="terms-container">
      <div class="terms-card">
        <div class="header">
          <h1>📋 Términos y Condiciones</h1>
          <p class="subtitle">Adomi - Plataforma de Servicios Profesionales</p>
        </div>

        <div class="content">
          <div class="section">
            <h2>1. Aceptación de los Términos</h2>
            <p>Al acceder y utilizar Adomi, usted acepta cumplir con estos términos y condiciones. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestros servicios.</p>
          </div>

          <div class="section">
            <h2>2. Naturaleza y alcance (Marketplace / Intermediación)</h2>
            <p>
              Adomi es una plataforma tecnológica que intermedia la contratación entre Clientes y Profesionales independientes,
              facilitando publicación, agenda, mensajería, pagos y gestión de incidencias.
            </p>
            <p>
              El Servicio es ejecutado por el Profesional, quien es responsable por su calidad, idoneidad, permisos, seguridad y cumplimiento normativo.
              Sin perjuicio de lo anterior, Adomi asume obligaciones propias como operador de plataforma, incluyendo canal de soporte/reclamos y aplicación de flujos de pagos, retenciones, disputas y reembolsos descritos en nuestras políticas.
            </p>
          </div>

          <div class="section">
            <h2>3. Cuentas de Usuario</h2>
            <p>Para utilizar nuestros servicios, debe crear una cuenta proporcionando información precisa y actualizada. Es responsable de mantener la confidencialidad de su cuenta y contraseña.</p>
          </div>

          <div class="section">
            <h2>4. Conducta del Usuario</h2>
            <p>Los usuarios se comprometen a:</p>
            <ul>
              <li>Proporcionar información veraz y actualizada</li>
              <li>Respetar a otros usuarios y profesionales</li>
              <li>No utilizar la plataforma para actividades ilegales</li>
              <li>Cumplir con las reservas y citas programadas</li>
              <li>Realizar pagos puntualmente</li>
            </ul>
          </div>

          <div class="section">
            <h2>5. Pagos y Facturación</h2>
            <p>
              Los pagos se procesan mediante un PSP autorizado. Al registrar un medio de pago (por ejemplo, Oneclick/tokenización),
              el Cliente autoriza la tokenización por el PSP (Adomi no almacena datos completos de tarjeta).
            </p>
            <p>
              Por motivos de seguridad y disputas, el pago puede permanecer retenido (“hold”) hasta la finalización del servicio mediante código/botón,
              o auto-liberación si no existe reclamo dentro del plazo definido en nuestras políticas.
            </p>
            <p>
              Reembolsos, cancelaciones/no-show, contracargos y evidencias se rigen por las políticas visibles en la Plataforma.
            </p>
            <p>
              Puedes leer el texto completo aquí:
              <a href="/client/terminos" target="_blank" rel="noreferrer noopener">Términos y Condiciones</a>,
              <a href="/client/terminos#politica-pagos" target="_blank" rel="noreferrer noopener">Pagos y reembolsos</a>,
              <a href="/client/terminos#politica-cancelacion" target="_blank" rel="noreferrer noopener">Cancelación / No-show</a>,
              <a href="/client/terminos#politica-disputas" target="_blank" rel="noreferrer noopener">Disputas y evidencia</a>.
            </p>
          </div>

          <div class="section">
            <h2>6. Privacidad y Protección de Datos</h2>
            <p>Respetamos su privacidad y protegemos sus datos personales de acuerdo con nuestra Política de Privacidad. No compartimos su información con terceros sin su consentimiento explícito.</p>
          </div>

          <div class="section">
            <h2>7. Limitación de Responsabilidad</h2>
            <p>
              Adomi actúa como intermediario tecnológico. El Servicio es prestado por Profesionales independientes.
              Adomi no garantiza la calidad o resultados del Servicio; sin perjuicio de lo anterior, mantiene obligaciones propias como operador de plataforma
              (información esencial, soporte/reclamos y flujos de pago/disputa).
            </p>
          </div>

          <div class="section">
            <h2>8. Modificaciones</h2>
            <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados a través de la plataforma.</p>
          </div>

          <div class="section">
            <h2>9. Contacto</h2>
            <p>Para preguntas sobre estos términos, puede contactarnos en:</p>
            <ul>
              <li>Email: contacto@adomi.com</li>
              <li>Teléfono: +56 9 XXXX XXXX</li>
              <li>Sitio web: https://adomiapp.com</li>
            </ul>
          </div>

          <div class="section last-updated">
            <p><strong>Última actualización:</strong> {{ getCurrentDate() }}</p>
          </div>
        </div>

        <div class="actions">
          <button class="btn-secondary" (click)="goBack()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Volver al Registro
          </button>
          <button class="btn-primary" (click)="acceptTerms()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Acepto los Términos
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./terms.component.scss']
})
export class TermsComponent {
  constructor(private router: Router) {}

  goBack() {
    // Volver a la página anterior
    window.history.back();
  }

  acceptTerms() {
    // Guardar que el usuario aceptó los términos
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('termsAccepted', 'true');
    }
    
    // Volver al registro
    this.router.navigate(['/auth/register']);
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}








