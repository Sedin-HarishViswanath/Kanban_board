import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Project } from '../../models/project.model';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'app-home',
  imports: [FormsModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  userName = '';
  projectName = '';
  projects: Project[] = [];

  constructor(
    private projectService: ProjectService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userName = this.projectService.getUserName();

    if (!this.userName) {
      this.router.navigateByUrl('/onboarding');
      return;
    }

    this.projects = this.projectService.getProjects();
  }

  createProject(): void {
    const name = this.projectName.trim();

    if (!name) {
      return;
    }

    const project = this.projectService.createProject(name);
    this.router.navigate(['/project', project.id]);
  }
}
