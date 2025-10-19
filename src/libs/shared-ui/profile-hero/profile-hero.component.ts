import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ProfileHeroData {
  name: string;
  title: string;
  avatar: string;
  coverImage: string;
  hasVideo?: boolean;
}

@Component({
  selector: 'app-profile-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-hero.component.html',
  styleUrls: ['./profile-hero.component.scss']
})
export class ProfileHeroComponent {
  @Input() data: ProfileHeroData = {
    name: '',
    title: '',
    avatar: '',
    coverImage: '',
    hasVideo: false
  };

  @Output() playVideoClick = new EventEmitter<void>();
  @Output() avatarClick = new EventEmitter<void>();

  onPlayVideoClick() {
    this.playVideoClick.emit();
  }

  onAvatarClick() {
    this.avatarClick.emit();
  }
}







