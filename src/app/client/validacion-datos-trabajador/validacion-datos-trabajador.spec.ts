import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidacionDatosTrabajador } from './validacion-datos-trabajador';

describe('ValidacionDatosTrabajador', () => {
  let component: ValidacionDatosTrabajador;
  let fixture: ComponentFixture<ValidacionDatosTrabajador>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValidacionDatosTrabajador]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ValidacionDatosTrabajador);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
