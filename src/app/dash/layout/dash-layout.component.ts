import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ThemeSwitchComponent } from '../../../libs/shared-ui/theme-switch/theme-switch.component';
import { IconComponent } from '../../../libs/shared-ui/icon/icon.component';
import { PlanUpgradeAlertComponent, PlanInfo } from '../../../libs/shared-ui/plan-upgrade-alert/plan-upgrade-alert.component';
import { PlanService } from '../../services/plan.service';
import { SessionService } from '../../auth/services/session.service';

@Component({
  selector: 'app-dash-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet, ThemeSwitchComponent, IconComponent, PlanUpgradeAlertComponent],
  templateUrl: './dash-layout.component.html',
  styleUrls: ['./dash-layout.component.scss']
})
export class DashLayoutComponent implements OnInit {
  isCollapsed = false;
  planInfo: PlanInfo | null = null;
  showPlanAlert = false;

  private planService = inject(PlanService);
  private sessionService = inject(SessionService);

  ngOnInit() {
    this.loadPlanInfo();
  }

  onNav() {
    if (window && window.matchMedia && window.matchMedia('(max-width: 900px)').matches) {
      this.isCollapsed = true;
    }
  }

  private loadPlanInfo() {
    const user = this.sessionService.getUser();
    if (user && user.role === 'provider') {
      this.planService.getCurrentPlan(user.id).subscribe({
        next: (response) => {
          if (response.ok && response.currentPlan) {
            this.planInfo = response.currentPlan;
            this.showPlanAlert = this.planService.shouldShowUpgradeAlert();
          }
        },
        error: (error) => {
          console.error('Error loading plan info:', error);
        }
      });
    }
  }

  onPlanUpgrade() {
    // El componente ya redirige a /auth/select-plan
    console.log('Upgrading plan...');
  }

  onPlanAlertDismiss() {
    this.showPlanAlert = false;
  }
}
