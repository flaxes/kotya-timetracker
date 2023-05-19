export interface TaskTracker {
    date: string;
    startedAt: number;
    stoppedAt: number;
    taskId: number;
}

export interface Task {
    id: number;
    name: string;
    createdAt: number;

    status: "pause" | "inwork" | "finished";

    trackers: TaskTracker[];
}
