export interface origin {
    position: { x: number; y: number; z: number };
    orientation: { x: number; y: number; z: number; w: number };
}

export interface MapMetaData {
    width: number;
    height: number;
    resolution: number;
    origin: origin;
}

export interface OccupancyGrid {
    header: {
        stamp: { sec: number; nsec: number };
        frame_id: string;
    };
    info: MapMetaData;
    data: Int8Array;
}

