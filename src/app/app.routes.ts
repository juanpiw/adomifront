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
import { NotificationsPageComponent } from './pages/notifications/notifications.component';
import { ClientLayoutComponent } from './client/layout/client-layout.component';
import { ClientReservasComponent } from './client/pages/reservas/reservas.component';
import { FavoritosComponent } from './client/pages/favoritos/favoritos.component';
import { ClientPerfilComponent } from './client/pages/perfil/perfil.component';
import { ClientPagosComponent } from './client/pages/pagos/pagos.component';
import { ClientWalletComponent } from './client/pages/wallet/wallet.component';
import { ClientConfiguracionComponent } from './client/pages/configuracion/configuracion.component';
import { ExplorarComponent } from './client/explorar/explorar.component';
import { PerfilTrabajadorComponent } from './client/pages/perfil-trabajador/perfil-trabajador.component';
import { ConversacionesComponent } from './client/pages/conversaciones/conversaciones.component';
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
import { TermsComponent } from './auth/terms/terms.component';
import { ClientTerminosComponent } from './client/pages/terminos/terminos.component';
import { DashTerminosComponent } from './dash/pages/terminos/terminos.component';
import { Component } from '@angular/core';
import { AdminPagosComponent } from './dash/pages/admin-pagos/admin-pagos.component';
import { TbkReturnComponent } from './client/pages/tbk-return/tbk-return.component';
import { TbkPlanReturnComponent } from './auth/tbk-plan-return/tbk-plan-return.component';
import { PerfilSolicitanteComponent } from './client/pages/perfil-solicitante/perfil-solicitante.component';
import { DashQuotesComponent } from './dash/pages/quotes/quotes.component';
import { quotesFeatureGuard } from './dash/pages/quotes/quotes.guard';
import { ClientQuotesComponent } from './client/pages/quotes/client-quotes.component';
import { providerOnboardingGuard, providerOnboardingChildGuard } from './auth/guards/provider-onboarding.guard';
import { InvitacionComponent } from './pages/invitacion/invitacion.component';
import { ProviderSetupComponent } from './dash/pages/provider-setup/provider-setup.component';
import { providerSetupGuard, providerSetupChildGuard } from './auth/guards/provider-setup.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'terminos', component: ClientTerminosComponent, data: { tab: 'terminos' } },
  { path: 'privacidad', component: ClientTerminosComponent, data: { tab: 'privacidad' } },
  { path: 'invitacion', component: InvitacionComponent },
  { path: 'tbk/return', component: TbkReturnComponent },
  { path: 'tbk/oneclick/finish', component: TbkReturnComponent },
  { path: 'tbk/plan-return', component: TbkPlanReturnComponent },
  { path: 'libreria', component: LibraryComponent },
  { path: 'onboarding', component: OnboardingComponent },
  { path: 'client', component: ClientLayoutComponent, canActivate: [providerOnboardingGuard, providerSetupGuard], canActivateChild: [providerOnboardingChildGuard, providerSetupChildGuard], children: [
      { path: '', redirectTo: 'explorar', pathMatch: 'full' },
      { path: 'explorar', component: ExplorarComponent },
      { path: 'explorar/:workerId', component: PerfilTrabajadorComponent },
      { path: 'solicitante/:clientId', component: PerfilSolicitanteComponent },
      { path: 'reservas', component: ClientReservasComponent },
      { path: 'cotizaciones', component: ClientQuotesComponent },
      { path: 'favoritos', component: FavoritosComponent },
      { path: 'conversaciones', component: ConversacionesComponent },
      { path: 'perfil', component: ClientPerfilComponent },
      { path: 'pagos', component: ClientPagosComponent },
      { path: 'notificaciones', component: NotificationsPageComponent },
      { path: 'wallet', component: ClientWalletComponent },
      { path: 'pago/exito', component: ClientReservasComponent },
      { path: 'pago/cancelado', component: ClientReservasComponent },
      { path: 'configuracion', component: ClientConfiguracionComponent },
      { path: 'terminos', component: ClientTerminosComponent },
      { path: 'soporte', loadComponent: () => import('./client/pages/soporte/client-support.component').then(m => m.ClientSupportComponent) },
      { path: 'validacion-datos-trabajador', component: ValidacionDatosTrabajadorComponent }
    ] },
      { path: 'auth', children: [
          { path: '', redirectTo: 'login', pathMatch: 'full' },
          { path: 'login', component: LoginComponent },
          { path: 'register', component: RegisterComponent },
          { path: 'select-plan', component: SelectPlanComponent },
    { path: 'checkout', component: CheckoutComponent },
    { path: 'quick-payment', component: QuickPaymentComponent },
    { path: 'terms', component: TermsComponent },
    { path: 'payment-success', component: PaymentSuccessComponent },
    { path: 'payment-error', component: PaymentErrorComponent },
          { path: 'forgot', component: ForgotComponent },
          { path: 'reset-password', component: ResetPasswordComponent },
          { path: 'google/callback', component: GoogleCallbackComponent },
          { path: 'google/success', component: GoogleSuccessComponent }
        ] },
  { path: 'dash', component: DashLayoutComponent, canActivate: [providerOnboardingGuard, providerSetupGuard], canActivateChild: [providerOnboardingChildGuard, providerSetupChildGuard], children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'provider-setup', component: ProviderSetupComponent },
      { path: 'home', component: DashHomeComponent },
      { path: 'agenda', component: DashAgendaComponent },
      { path: 'ingresos', component: DashIngresosComponent },
      { path: 'cotizaciones', component: DashQuotesComponent, canActivate: [quotesFeatureGuard] },
      { path: 'estadisticas', component: DashEstadisticasComponent },
      { path: 'promocion', component: DashPromocionComponent }
      ,{ path: 'mensajes', component: DashMensajesComponent }
      ,{ path: 'servicios', component: DashServiciosComponent }
      ,{ path: 'perfil', component: DashPerfilComponent }
      ,{ path: 'notificaciones', component: NotificationsPageComponent }
      ,{ path: 'terminos', component: DashTerminosComponent }
      ,{ path: 'clientes/:clientId', component: PerfilSolicitanteComponent }
      ,{ path: 'admin-pagos', component: AdminPagosComponent }
      ,{ path: 'soporte', loadComponent: () => import('./dash/pages/soporte/dash-support.component').then(m => m.DashSupportComponent) }
    ] },
  { path: '**', redirectTo: '' }
];
