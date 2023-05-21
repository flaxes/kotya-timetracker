export interface TaskRow {
    id: number;
    external_id: string;
    name: string;
    status: 0 | 1 | 2;
    created_at: string;
    updated_at: string;
    is_hidden?: 1;
    wasted_total_mins?: number;
}

export interface TaskTrackRow {
    id: number;
    task_id: number;
    started_at: string;
    ended_at: string;
    wasted_mins?: number;

    // joined
    name: string;
    external_id: string;
}

export interface LoggingRow {
    id: number;
    task_id: number;
    text: string;
    created_at: string;
    external_id?: string;
}
