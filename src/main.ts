import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeEsCl from '@angular/common/locales/es-CL';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

registerLocaleData(localeEsCl);

if (typeof window !== 'undefined' && environment.production) {
  const w = window as unknown as { __ADOMI_CONSOLE_WARNING_SHOWN__?: boolean };
  if (!w.__ADOMI_CONSOLE_WARNING_SHOWN__) {
    w.__ADOMI_CONSOLE_WARNING_SHOWN__ = true;
    console.warn(
      [
        'SECURITY WARNING',
        'Unauthorized attempts to debug, tamper with, or extract data from this application may violate our Terms and applicable laws.',
        'If you are not an authorized tester, please stop now.'
      ].join('\n')
    );
  }
}

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
