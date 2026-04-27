import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'app-onboarding',
  imports: [FormsModule],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.css',
})
export class Onboarding {
  name = '';

  constructor(
    private projectService: ProjectService,
    private router: Router
  ) {}

  saveName(): void {
    const userName = this.name.trim();

    if (!userName) {
      return;
    }

    this.projectService.saveUserName(userName);
    this.router.navigateByUrl('/');
  }
}
