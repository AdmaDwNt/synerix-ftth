export interface FiberColorToken {
    number: number;
    nameId: string;
    nameEn: string;
    hex: string;
    bgClass: string;
    textClass: string;
    borderClass?: string;
}

export type JointBoxType = 'DOME_CLOSURE' | 'INLINE_CLOSURE' | 'ODC_TRAY' | 'OPTICAL_SPLITTER_BOX';

export type SpliceType = 'FUSION_SPLICE' | 'MECHANICAL' | 'PASS_THROUGH';

export type CoreStatus = 'ACTIVE' | 'SPARE' | 'DAMAGED';

export interface JointBox {
    id: string;
    name: string;
    closure_type: JointBoxType;
    cluster_area: string;
    pole_number?: string | null;
    latitude: number;
    longitude: number;
    capacity_cores: number;
    tray_count: number;
    tray_photo_url?: string | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface JointBoxSplice {
    id: string;
    joint_box_id: string;
    tray_number: number;
    in_cable_name: string;
    in_tube_num: number;
    in_core_num: number;
    in_core_global: number;
    out_cable_name: string;
    out_tube_num: number;
    out_core_num: number;
    out_core_global: number;
    splice_type: SpliceType;
    status: CoreStatus;
    destination_target?: string | null;
    optical_loss_db?: number | null;
    technician_notes?: string | null;
    updated_at?: string;
}

export interface CalculatedCoreInfo {
    globalCore: number;
    tubeNumber: number;
    tubeColor: FiberColorToken;
    coreNumberInTube: number;
    coreColor: FiberColorToken;
}
