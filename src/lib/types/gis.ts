// ====================================================================
// GIS FTTH & ADVANCED OPERATIONAL TYPES (SYNERIX NETWORK OPERATIONS)
// ====================================================================

export type NodeType = 
  | 'SERVER' 
  | 'POP' 
  | 'ODC' 
  | 'ODP' 
  | 'CUSTOMER' 
  | 'DISMANTLE' 
  | 'TIANG' 
  | 'CLOSURE' 
  | 'OTHER';

export type NodeStatus = 
  | 'ACTIVE' 
  | 'MAINTENANCE' 
  | 'FULL' 
  | 'PLANNING' 
  | 'DAMAGED';

export type CableType = 
  | 'FEEDER' 
  | 'DISTRIBUTION' 
  | 'DROP_CABLE' 
  | 'BACKBONE' 
  | string;

export type LineStatus = 
  | 'NORMAL' 
  | 'CUT' 
  | 'HIGH_ATTENUATION' 
  | 'MAINTENANCE';

export type InstallationType = 
  | 'AERIAL' 
  | 'UNDERGROUND' 
  | 'DUCT';

export type PortStatus = 
  | 'IDLE' 
  | 'OCCUPIED' 
  | 'RESERVED' 
  | 'DAMAGED';

export interface KmlLayer {
  id: string;
  name: string;
  filename: string;
  file_size_bytes: number;
  total_nodes: number;
  total_lines: number;
  color: string;
  is_visible: boolean;
  description?: string | null;
  uploaded_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NetworkNode {
  id: string;
  layer_id?: string | null;
  name: string;
  type: NodeType;
  status?: NodeStatus;
  parent_node_id?: string | null;
  pole_number?: string | null;
  address?: string | null;
  photo_url?: string | null;
  notes?: string | null;
  description?: string | null;
  latitude: number;
  longitude: number;
  capacity?: number;
  used_ports?: number;
  raw_properties?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface NetworkLine {
  id: string;
  layer_id?: string | null;
  name: string;
  cable_type: CableType;
  installation_type?: InstallationType;
  status?: LineStatus;
  core_capacity: number;
  color: string;
  coordinates: [number, number][]; // [lat, lng] array
  length_meters?: number;
  start_node_id?: string | null;
  end_node_id?: string | null;
  raw_properties?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface OdpPort {
  id: string;
  node_id: string;
  port_number: number;
  status: PortStatus;
  customer_id?: string | null;
  customer_name?: string | null;
  optical_power_dbm?: number | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface GisAuditLog {
  id: string;
  entity_type: 'NODE' | 'LINE' | 'LAYER' | 'PORT';
  entity_id: string;
  entity_name?: string | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'BATCH_DELETE';
  performed_by: string;
  changes_summary?: Record<string, any>;
  created_at: string;
}

export interface ParsedGisPayload {
  layerMeta: {
    name: string;
    filename: string;
    fileSizeBytes: number;
    color: string;
    description?: string;
  };
  nodes: {
    name: string;
    type: NodeType;
    description?: string;
    latitude: number;
    longitude: number;
    capacity?: number;
    raw_properties?: Record<string, any>;
  }[];
  lines: {
    name: string;
    cable_type: CableType;
    core_capacity: number;
    color: string;
    coordinates: [number, number][];
    length_meters: number;
    raw_properties?: Record<string, any>;
  }[];
}

export type GisCategoryFilter = 
  | 'ALL' 
  | 'SERVER_POP' 
  | 'ODC' 
  | 'ODP' 
  | 'TIANG' 
  | 'DISMANTLE';

export type BasemapType = 
  | 'OSM' 
  | 'ESRI_SATELLITE' 
  | 'CARTO_DARK' 
  | 'OPENTOPO';
