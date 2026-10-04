export type DismantleStatus = 'QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface DismantleTask {
    id: string;
    customer_id: string;
    customer_name: string;
    phone_number?: string | null;
    address: string;
    cluster_name: string;
    parent_odp_id?: string | null;
    parent_odp_name?: string | null;
    latitude: number;
    longitude: number;
    status: DismantleStatus;
    device_type: string;
    serial_number?: string | null;
    mac_address?: string | null;
    accessories?: string[] | null;
    evidence_photo_url?: string | null;
    failure_reason?: string | null;
    technician_name?: string | null;
    completed_at?: string | null;
    handover_status?: boolean;
    ticket_id?: string | null;
    unpaid_amount?: number;
    billing_url?: string | null;
    auto_ingested?: boolean;
    created_at?: string;
    updated_at?: string;
    // Client-side computed properties
    distance_meters?: number;
}
