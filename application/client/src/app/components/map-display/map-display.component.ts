import { Component, ElementRef, ViewChild, OnInit, Input } from '@angular/core';
import { RobotCommunicationService } from '@app/services/robot-communication/robot-communication.service';
import { OccupancyGrid, MapMetaData } from '@common/interfaces/LiveMap';
import { collapseExpandAnimation } from 'src/assets/CollapseExpand';
import { GeofenceService } from '@app/services/geofence/geofence.service';
import { GeofenceCoord } from '@common/types/GeofenceCoord';
import { RobotPose } from '@common/interfaces/RobotPoseWithDistance';

const ROBOT_RADIUS = 5;
const ROBOT_START_ANGLE = 0;
const ROBOT_END_ANGLE = 2 * Math.PI;
const HEX_LETTERS = '0123456789ABCDEF';
const EMPTY_HEX_COLOR = '#';
const COLOR_LENGTH = 6;
const HEX_BASE = 16;
const OCCUPANCY_GRID_UNKNOWN_COLOR = 'gray';
const OCCUPANCY_GRID_FREE_COLOR = 'white';
const OCCUPANCY_GRID_OCCUPIED_COLOR = 'black';

@Component({
    selector: 'app-map-display',
    standalone: true,
    templateUrl: './map-display.component.html',
    styleUrls: ['./map-display.component.scss'],
    animations: [collapseExpandAnimation],
})
export class MapDisplayComponent implements OnInit {
    @ViewChild('mapCanvas', { static: true }) mapCanvas!: ElementRef<HTMLCanvasElement>;
    @Input() map: OccupancyGrid;
    isCollapsed = true;
    private robotPoses: { [topic: string]: RobotPose[] } = {};
    private topicColors: { [key: string]: string } = {};
    private occupancyGridInfo: MapMetaData;
    private geofence: GeofenceCoord | null = null;

    constructor(
        private robotCommunicationService: RobotCommunicationService,
        private geofenceService: GeofenceService,
    ) {}

    ngOnInit(): void {
        this.subscribeToLiveMap();
        this.subscribeToRobotPositions();
        this.subscribeToGeofence();
    }

    toggleCollapse() {
        this.isCollapsed = !this.isCollapsed;
    }

    private subscribeToLiveMap(): void {
        if (this.map) {
            this.occupancyGridInfo = this.map.info;
            this.drawMap(this.map);
        } else {
            this.robotCommunicationService.onLiveMap().subscribe((occupancyGrid: OccupancyGrid) => {
                this.occupancyGridInfo = occupancyGrid.info;
                this.drawMap(occupancyGrid);
            });
        }
    }

    private subscribeToRobotPositions(): void {
        this.robotCommunicationService.onRobotPositions().subscribe((robotPose: RobotPose) => {
            if (robotPose.topic) {
                this.robotPoses[robotPose.topic] = [robotPose];
            }
            this.drawRobotPositions();
        });
    }

    private subscribeToGeofence(): void {
        this.geofenceService.geofence$.subscribe((geofence) => {
            this.geofence = geofence;
            this.drawMap(this.map);
        });
    }

    private drawMap(occupancyGrid: OccupancyGrid): void {
        if (!this.occupancyGridInfo || !occupancyGrid.data) return;
        const canvas = this.mapCanvas.nativeElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        this.setCanvasDimensions(canvas);
        this.drawOccupancyGrid(ctx, occupancyGrid);
        this.drawRobotPositions();
        this.drawGeofence(ctx);
    }

    private setCanvasDimensions(canvas: HTMLCanvasElement): void {
        if (!this.occupancyGridInfo) return;
        const { width, height } = this.occupancyGridInfo;
        canvas.width = width;
        canvas.height = height;
    }

    private drawOccupancyGrid(ctx: CanvasRenderingContext2D, occupancyGrid: OccupancyGrid): void {
        if (!this.occupancyGridInfo || !occupancyGrid.data) return;
        const { width, height } = this.occupancyGridInfo;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const flippedY = height - 1 - y;
                const index = flippedY * width + x;
                const cellValue = occupancyGrid.data[index];
                ctx.fillStyle = this.getCellColor(cellValue);
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    private getCellColor(cellValue: number): string {
        switch (cellValue) {
            case -1:
                return OCCUPANCY_GRID_UNKNOWN_COLOR;
            case 0:
                return OCCUPANCY_GRID_FREE_COLOR;
            default:
                return OCCUPANCY_GRID_OCCUPIED_COLOR;
        }
    }

    private drawRobotPositions(): void {
        const canvas = this.mapCanvas.nativeElement;
        const ctx = canvas.getContext('2d');
        if (!ctx || !this.occupancyGridInfo) return;

        const { origin, resolution } = this.occupancyGridInfo;

        Object.keys(this.robotPoses).forEach((topic) => {
            const color = this.getColorForTopic(topic);
            this.robotPoses[topic].forEach((robot) => {
                if (robot && robot.position) {
                    this.drawRobot(ctx, robot, color, origin, resolution, canvas.height);
                }
            });
        });
    }

    private drawRobot(ctx: CanvasRenderingContext2D, robot: RobotPose, color: string, origin: any, resolution: number, canvasHeight: number): void {
        const { x, y } = this.calculateMapRelativePosition(robot.position, origin, resolution, canvasHeight);

        this.drawRobotBody(ctx, x, y, color);
        this.drawRobotOrientation(ctx, x, y, robot.orientation);
    }

    private calculateMapRelativePosition(
        position: { x: number; y: number },
        origin: any,
        resolution: number,
        canvasHeight: number,
    ): { x: number; y: number } {
        const x = (position.x - origin.position.x) / resolution;
        const y = canvasHeight - (position.y - origin.position.y) / resolution;
        return { x, y };
    }

    private drawRobotBody(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, ROBOT_RADIUS, ROBOT_START_ANGLE, ROBOT_END_ANGLE);
        ctx.fill();
    }

    private drawRobotOrientation(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        orientation: { x: number; y: number; z: number; w: number },
    ): void {
        const angle = this.quaternionToAngle(orientation);
        ctx.beginPath();
        ctx.moveTo(x + (ROBOT_RADIUS / 3) * Math.cos(angle), y - (ROBOT_RADIUS / 3) * Math.sin(angle));
        ctx.lineTo(x + ROBOT_RADIUS * Math.cos(angle), y - ROBOT_RADIUS * Math.sin(angle));
        ctx.stroke();
    }

    private quaternionToAngle(q: { x: number; y: number; z: number; w: number }): number {
        return Math.atan2(2.0 * (q.w * q.z + q.x * q.y), 1.0 - 2.0 * (q.y * q.y + q.z * q.z));
    }

    private drawGeofence(ctx: CanvasRenderingContext2D): void {
        if (!this.geofence || !this.occupancyGridInfo) return;

        const { origin, resolution } = this.occupancyGridInfo;
        const canvasHeight = this.mapCanvas.nativeElement.height;

        const bottomLeft = this.calculateMapRelativePosition({ x: this.geofence.x_max, y: this.geofence.y_min }, origin, resolution, canvasHeight);
        const topRight = this.calculateMapRelativePosition({ x: this.geofence.x_min, y: this.geofence.y_max }, origin, resolution, canvasHeight);

        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(bottomLeft.x, topRight.y, topRight.x - bottomLeft.x, bottomLeft.y - topRight.y);
    }

    getColorForTopic(topic: string): string {
        if (!this.topicColors[topic]) {
            this.topicColors[topic] = this.getRandomColor();
        }
        return this.topicColors[topic];
    }

    getRandomColor(): string {
        let color = EMPTY_HEX_COLOR;
        for (let i = 0; i < COLOR_LENGTH; i++) {
            color += HEX_LETTERS[Math.floor(Math.random() * HEX_BASE)];
        }
        return color;
    }
}
