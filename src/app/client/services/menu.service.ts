import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private isMenuOpenSubject = new BehaviorSubject<boolean>(false);
  public isMenuOpen$ = this.isMenuOpenSubject.asObservable();

  constructor() { }

  toggleMenu(): void {
    const currentState = this.isMenuOpenSubject.value;
    this.isMenuOpenSubject.next(!currentState);
  }

  openMenu(): void {
    this.isMenuOpenSubject.next(true);
  }

  closeMenu(): void {
    this.isMenuOpenSubject.next(false);
  }

  get isMenuOpen(): boolean {
    return this.isMenuOpenSubject.value;
  }
}








