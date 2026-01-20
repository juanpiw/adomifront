import { firebaseConfig } from './firebase.config';

export const environment = {
  production: true,
  apiBaseUrl: 'https://adomi.impactrenderstudio.com',
  gaMeasurementId: 'G-ZQYRWPHT60',
  clarityProjectId: 'v4211tl2fp',
  // Publishable key (pública) - necesaria para Stripe.js en frontend.
  stripePublishableKey: 'pk_live_51Opto6Lae2ozUqcfkEx6dKK4p8jRPlibbXBIfsTqg8KKNXQzIyDhNO0Ok0Y1uhdGw8QXglvcyJowQh7PuKS9b5db00ddVgUejq',
  connectEnabled: false,
  googleClientId: '319925819744-4snhnq7vtcb33g516a67qu7bu42r2hk1.apps.googleusercontent.com',
  googleRedirectUri: 'https://adomi.impactrenderstudio.com/auth/google/callback',
  googleMapsApiKey: 'AIzaSyDWOGEJ9XnCyrKDSvpK4TKFj1_eM3NHdeo',
  firebase: firebaseConfig
};

