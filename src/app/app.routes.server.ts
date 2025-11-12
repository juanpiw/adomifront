import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'client/explorar/:workerId',
    renderMode: RenderMode.Server
  },
  {
    path: 'client/solicitante/:clientId',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
