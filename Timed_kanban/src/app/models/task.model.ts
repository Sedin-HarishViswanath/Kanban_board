export interface KanbanTask {
    id: string;
    title: string;
    currentColumnId: string;
    enteredAt: number;
    timeSpent: Record<string, number>;
}
