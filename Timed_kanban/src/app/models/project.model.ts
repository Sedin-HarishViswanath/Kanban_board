import { KanbanColumn } from './column.model';
import { KanbanTask } from './task.model';

export interface Project {
  id: string;
  name: string;
  columns: KanbanColumn[];
  tasks: KanbanTask[];
  createdAt: number;
}
