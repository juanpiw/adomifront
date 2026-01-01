import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-invitacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invitacion.component.html',
  styleUrls: ['./invitacion.component.scss']
})
export class InvitacionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  inviteToken: string | null = null;
  hostName = 'Tu profesional';
  avatarUrl = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Camila&backgroundColor=c0aede';

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const token = params.get('id');
      this.inviteToken = token;
      if (token) {
        localStorage.setItem('adomiInviteToken', token);
      }
      const nameParam = params.get('name');
      if (nameParam) {
        this.hostName = nameParam;
      }
    });
  }

  acceptInvitation(): void {
    if (this.inviteToken) {
      localStorage.setItem('adomiInviteToken', this.inviteToken);
    }
    this.router.navigate(['/auth/register'], {
      queryParams: this.inviteToken ? { invite: this.inviteToken } : undefined
    });
  }

  createAccount(): void {
    this.router.navigate(['/auth/register']);
  }
}

