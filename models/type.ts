export interface PropsReq {
    task_id: string;
    groups: TypeGroup[];
    all_columns: any[];
    rows: number;
    md: number;
    step: number;
    suggested_workers: number;
    sample_preview: {
        columns: any[];
        rows: any[];
    };
}

export interface ConverData {
    message: string,
    task: {
        step: number;
        columns: string[],
        filename: string,
        filesize: number,
        message: string,
        n_workers: string,
        pending_groups: any[],
        progress: number,
        result: ResultData,
        selected_groups: any[],
        status: string,
        suggested_workers: number,
        task_id: string
    }
}

export interface ResultData {
    fail_count: number,
    full_data: any[],
    success_count: number,
    total_rows: number
}

export interface TypeGroup {
    id?: string
    id_province: string,
    province: string,
    id_district: string,
    district: string,
    id_ward: string,
    ward: string,
}
export interface payloadStartCoversion {
    groups: TypeGroup[],
    n_workers: number
}
// types.ts
export type MappingStatus = "success" | "error";

