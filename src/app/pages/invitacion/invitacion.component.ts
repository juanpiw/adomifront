import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-invitacion',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './invitacion.component.html',
  styleUrls: ['./invitacion.component.scss']
})
export class InvitacionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);

  inviteToken: string | null = null;
  hostName = 'Tu profesional';
  avatarUrl = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Camila&backgroundColor=c0aede';

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const token = params.get('id');
      this.inviteToken = token;
      if (token) {
        localStorage.setItem('adomiInviteToken', token);
        this.fetchInviteMeta(token);
      }
      const nameParam = params.get('name');
      if (nameParam) {
        this.hostName = nameParam;
      }
    });
  }

  private fetchInviteMeta(token: string): void {
    const url = `${environment.apiBaseUrl}/provider/invites/public/${encodeURIComponent(token)}`;
    this.http.get<any>(url).subscribe({
      next: (resp) => {
        if (resp?.success && resp?.invite?.inviter) {
          this.hostName = resp.invite.inviter.name || this.hostName;
          const avatarFull = resp.invite.inviter.avatar_full;
          const avatarRaw = resp.invite.inviter.avatar;
          const chosen = avatarFull || avatarRaw;
          if (chosen) {
            this.avatarUrl = String(chosen);
          }
        }
      },
      error: () => {
        // silencioso, dejamos placeholders
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

