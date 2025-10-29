import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sobre-mi',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sobre-mi.component.html',
  styleUrls: ['./sobre-mi.component.scss']
})
export class SobreMiComponent {
  @Input() bio: string = '';
  @Output() bioChange = new EventEmitter<string>();

  onBioChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.bio = target.value;
    this.bioChange.emit(this.bio);
  }
}











