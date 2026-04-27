import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { KanbanColumn } from '../../models/column.model';
import { Project } from '../../models/project.model';
import { KanbanTask } from '../../models/task.model';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'app-board',
  imports: [DragDropModule, FormsModule, RouterLink],
  templateUrl: './board.html',
  styleUrl: './board.css',
})
export class Board implements OnInit, OnDestroy {
  project?: Project;
  taskTitle = '';
  columnName = '';
  columnMessage = '';
  editingColumn?: KanbanColumn;
  editColumnName = '';
  now = Date.now();
  private timerId?: number;
  private messageTimerId?: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService
  ) { }

  ngOnInit(): void {
    if (!this.projectService.getUserName()) {
      this.router.navigateByUrl('/onboarding');
      return;
    }

    const projectId = this.route.snapshot.paramMap.get('id');

    if (!projectId) {
      this.router.navigateByUrl('/');
      return;
    }

    this.project = this.projectService.getProject(projectId);

    if (!this.project) {
      this.router.navigateByUrl('/');
      return;
    }

    this.timerId = window.setInterval(() => {
      this.now = Date.now();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      window.clearInterval(this.timerId);
    }

    if (this.messageTimerId) {
      window.clearTimeout(this.messageTimerId);
    }
  }

  get connectedColumnIds(): string[] {
    return this.project?.columns.map((column) => column.id) || [];
  }

  tasksByColumn(columnId: string): KanbanTask[] {
    return this.project?.tasks.filter((task) => task.currentColumnId === columnId) || [];
  }

  addTask(): void {
    const title = this.taskTitle.trim();

    if (!this.project || !title) {
      return;
    }

    this.project = this.projectService.addTask(this.project, title, 'todo');
    this.now = Date.now();
    this.taskTitle = '';
  }

  drop(event: CdkDragDrop<KanbanTask[]>): void {
    if (!this.project || event.previousContainer.id === event.container.id) {
      return;
    }

    const task = event.item.data as KanbanTask;
    this.project = this.projectService.moveTask(this.project, task.id, event.container.id);
    this.now = Date.now();
  }

  deleteTask(taskId: string): void {
    if (!this.project || !confirm('Delete this task?')) {
      return;
    }

    this.project = this.projectService.deleteTask(this.project, taskId);
  }

  addColumn(): void {
    const name = this.columnName.trim();

    if (!this.project || !name) {
      return;
    }

    const completedIndex = this.project.columns.findIndex((column) => column.id === 'completed');
    const newColumn: KanbanColumn = {
      id: crypto.randomUUID(),
      name,
      isDefault: false,
      isLocked: false,
    };

    const columns = [...this.project.columns];
    columns.splice(completedIndex, 0, newColumn);

    this.project = { ...this.project, columns };
    this.projectService.saveProject(this.project);
    this.columnName = '';
    this.showColumnMessage('Column added');
  }

  editColumn(column: KanbanColumn): void {
    if (!this.project || column.isLocked) {
      return;
    }

    this.editingColumn = column;
    this.editColumnName = column.name;
  }

  closeEditPopup(): void {
    this.editingColumn = undefined;
    this.editColumnName = '';
  }

  saveColumnEdit(): void {
    const name = this.editColumnName.trim();

    if (!this.project || !this.editingColumn || !name) {
      return;
    }

    const columns = this.project.columns.map((item) =>
      item.id === this.editingColumn?.id ? { ...item, name } : item
    );

    this.project = { ...this.project, columns };
    this.projectService.saveProject(this.project);
    this.closeEditPopup();
    this.showColumnMessage('Column edited');
  }

  deleteColumn(column: KanbanColumn): void {
    if (!this.project || column.isLocked) {
      return;
    }

    const tasksInColumn = this.tasksByColumn(column.id);
    let targetColumnId = 'todo';
    let columns = this.project.columns;

    if (tasksInColumn.length > 0) {
      const answer = prompt(
        'This column has tasks. Type another column name to move them there, or type a new column name.'
      )?.trim();

      if (!answer) {
        return;
      }

      const existingColumn = columns.find(
        (item) => item.id !== column.id && item.name.toLowerCase() === answer.toLowerCase()
      );

      if (existingColumn) {
        targetColumnId = existingColumn.id;
      } else {
        const newColumn: KanbanColumn = {
          id: crypto.randomUUID(),
          name: answer,
          isDefault: false,
          isLocked: false,
        };

        const deleteIndex = columns.findIndex((item) => item.id === column.id);
        columns = [...columns];
        columns.splice(deleteIndex, 0, newColumn);
        targetColumnId = newColumn.id;
      }
    }

    const now = Date.now();
    const tasks = this.project.tasks.map((task) => {
      if (task.currentColumnId !== column.id) {
        return task;
      }

      const oldColumnTime = task.timeSpent[column.id] || 0;
      const timeInDeletedColumn = Math.max(0, now - task.enteredAt);

      return {
        ...task,
        currentColumnId: targetColumnId,
        enteredAt: now,
        timeSpent: {
          ...task.timeSpent,
          [column.id]: oldColumnTime + timeInDeletedColumn,
        },
      };
    });

    columns = columns.filter((item) => item.id !== column.id);
    this.project = { ...this.project, columns, tasks };
    this.projectService.saveProject(this.project);
    this.now = now;
    this.showColumnMessage('Column deleted');
  }

  formatTime(milliseconds: number): string {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}min:${seconds}sec`;
  }

  timeForTask(task: KanbanTask, columnId: string): number {
    const savedTime = task.timeSpent[columnId] || 0;

    if (task.currentColumnId === columnId) {
      return Math.max(0, savedTime + this.now - task.enteredAt);
    }

    return Math.max(0, savedTime);
  }

  private showColumnMessage(message: string): void {
    this.columnMessage = message;

    if (this.messageTimerId) {
      window.clearTimeout(this.messageTimerId);
    }

    this.messageTimerId = window.setTimeout(() => {
      this.columnMessage = '';
    }, 2200);
  }
}
