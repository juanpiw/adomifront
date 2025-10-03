import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { ForgotComponent } from './auth/forgot/forgot.component';
import { DashLayoutComponent } from './dash/layout/dash-layout.component';
import { DashHomeComponent } from './dash/pages/home/home.component';
import { DashAgendaComponent } from './dash/pages/agenda/agenda.component';
import { DashIngresosComponent } from './dash/pages/ingresos/ingresos.component';
import { DashEstadisticasComponent } from './dash/pages/estadisticas/estadisticas.component';
import { DashPromocionComponent } from './dash/pages/promocion/promocion.component';
import { DashMensajesComponent } from './dash/pages/mensajes/mensajes.component';
import { DashServiciosComponent } from './dash/pages/servicios/servicios.component';
import { DashPerfilComponent } from './dash/pages/perfil/perfil.component';
import { LibraryComponent } from './pages/library/library.component';
import { ClientLayoutComponent } from './client/layout/client-layout.component';
import { ClientReservasComponent } from './client/pages/reservas/reservas.component';
import { ClientFavoritosComponent } from './client/pages/favoritos/favoritos.component';
import { ClientPerfilComponent } from './client/pages/perfil/perfil.component';
import { ClientPagosComponent } from './client/pages/pagos/pagos.component';
import { ClientConfigComponent } from './client/pages/configuracion/configuracion.component';
import { OnboardingComponent } from './client/pages/onboarding/onboarding.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { SelectPlanComponent } from './auth/select-plan/select-plan.component';
import { CheckoutComponent } from './auth/checkout/checkout.component';
import { PaymentSuccessComponent } from './auth/payment-success/payment-success.component';
import { PaymentErrorComponent } from './auth/payment-error/payment-error.component';
import { ValidacionDatosTrabajadorComponent } from './client/validacion-datos-trabajador/validacion-datos-trabajador';
import { GoogleCallbackComponent } from './auth/google-callback/google-callback.component';
import { GoogleSuccessComponent } from './auth/google-success/google-success.component';
import { QuickPaymentComponent } from './auth/quick-payment/quick-payment.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'libreria', component: LibraryComponent },
  { path: 'onboarding', component: OnboardingComponent },
  { path: 'client', component: ClientLayoutComponent, children: [
      { path: '', redirectTo: 'reservas', pathMatch: 'full' },
      { path: 'reservas', component: ClientReservasComponent },
      { path: 'favoritos', component: ClientFavoritosComponent },
      { path: 'perfil', component: ClientPerfilComponent },
      { path: 'pagos', component: ClientPagosComponent },
      { path: 'configuracion', component: ClientConfigComponent },
      { path: 'validacion-datos-trabajador', component: ValidacionDatosTrabajadorComponent }
    ] },
      { path: 'auth', children: [
          { path: '', redirectTo: 'login', pathMatch: 'full' },
          { path: 'login', component: LoginComponent },
          { path: 'register', component: RegisterComponent },
          { path: 'select-plan', component: SelectPlanComponent },
    { path: 'checkout', component: CheckoutComponent },
    { path: 'quick-payment', component: QuickPaymentComponent },
    { path: 'payment-success', component: PaymentSuccessComponent },
    { path: 'payment-error', component: PaymentErrorComponent },
          { path: 'forgot', component: ForgotComponent },
          { path: 'reset-password', component: ResetPasswordComponent },
          { path: 'google/callback', component: GoogleCallbackComponent },
          { path: 'google/success', component: GoogleSuccessComponent }
        ] },
  { path: 'dash', component: DashLayoutComponent, children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: DashHomeComponent },
      { path: 'agenda', component: DashAgendaComponent },
      { path: 'ingresos', component: DashIngresosComponent },
      { path: 'estadisticas', component: DashEstadisticasComponent },
      { path: 'promocion', component: DashPromocionComponent }
      ,{ path: 'mensajes', component: DashMensajesComponent }
      ,{ path: 'servicios', component: DashServiciosComponent }
      ,{ path: 'perfil', component: DashPerfilComponent }
    ] },
  { path: '**', redirectTo: '' }
];
