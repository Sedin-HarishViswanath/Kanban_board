import { Injectable } from '@angular/core';
import { KanbanColumn } from '../models/column.model';
import { Project } from '../models/project.model';
import { KanbanTask } from '../models/task.model';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly userKey = 'kanban_user_name';
  private readonly projectsKey = 'kanban_projects';

  constructor(private storage: StorageService) {}

  getUserName(): string {
    return this.storage.getItem<string>(this.userKey, '');
  }

  saveUserName(name: string): void {
    this.storage.setItem(this.userKey, name);
  }

  getProjects(): Project[] {
    return this.storage.getItem<Project[]>(this.projectsKey, []);
  }

  getProject(id: string): Project | undefined {
    return this.getProjects().find((project) => project.id === id);
  }

  createProject(name: string): Project {
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      columns: this.createDefaultColumns(),
      tasks: [],
      createdAt: Date.now(),
    };

    this.saveProjects([...this.getProjects(), project]);
    return project;
  }

  saveProject(updatedProject: Project): void {
    const projects = this.getProjects().map((project) =>
      project.id === updatedProject.id ? updatedProject : project
    );

    this.saveProjects(projects);
  }

  addTask(project: Project, title: string, columnId: string): Project {
    const task: KanbanTask = {
      id: crypto.randomUUID(),
      title,
      currentColumnId: columnId,
      enteredAt: Date.now(),
      timeSpent: {},
    };

    const updatedProject = { ...project, tasks: [...project.tasks, task] };
    this.saveProject(updatedProject);
    return updatedProject;
  }

  moveTask(project: Project, taskId: string, newColumnId: string): Project {
    const now = Date.now();
    const tasks = project.tasks.map((task) => {
      if (task.id !== taskId || task.currentColumnId === newColumnId) {
        return task;
      }

      const oldColumnTime = task.timeSpent[task.currentColumnId] || 0;
      const timeInOldColumn = Math.max(0, now - task.enteredAt);

      return {
        ...task,
        currentColumnId: newColumnId,
        enteredAt: now,
        timeSpent: {
          ...task.timeSpent,
          [task.currentColumnId]: oldColumnTime + timeInOldColumn,
        },
      };
    });

    const updatedProject = { ...project, tasks };
    this.saveProject(updatedProject);
    return updatedProject;
  }

  deleteTask(project: Project, taskId: string): Project {
    const updatedProject = {
      ...project,
      tasks: project.tasks.filter((task) => task.id !== taskId),
    };

    this.saveProject(updatedProject);
    return updatedProject;
  }

  private saveProjects(projects: Project[]): void {
    this.storage.setItem(this.projectsKey, projects);
  }

  private createDefaultColumns(): KanbanColumn[] {
    return [
      { id: 'todo', name: 'Todo', isDefault: true, isLocked: true },
      { id: 'working', name: 'Working', isDefault: true, isLocked: false },
      { id: 'testing', name: 'Testing', isDefault: true, isLocked: false },
      { id: 'review', name: 'Review', isDefault: true, isLocked: false },
      { id: 'actual-testing', name: 'Actual Testing', isDefault: true, isLocked: false },
      { id: 'completed', name: 'Completed', isDefault: true, isLocked: true },
    ];
  }
}
