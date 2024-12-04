import { Injectable } from '@angular/core';
import { RobotManagementService } from '@app/services/robot-management/robot-management.service';
import { EndMission } from '@common/interfaces/EndMission';
import { StartMission } from '@common/interfaces/StartMission';
import { IdentifyRobot } from '@common/interfaces/IdentifyRobot';
import { UpdateRobot } from '@common/interfaces/UpdateRobot';
import { ReturnToBase } from '@common/interfaces/ReturnToBase';
import { UpdateControllerCode } from '@common/interfaces/UpdateControllerCode';
import { NotifyRobotsToCommunicate } from '@common/interfaces/NotifyRobotsToCommunicate';
import { FindFurthestRobot } from '@common/interfaces/FindFurthestRobot';
import { Observable, Subject } from 'rxjs';
import { SocketHandlerService } from '@app/services/socket-handler/socket-handler.service';
import { RobotCommand } from '@common/enums/RobotCommand';
import { RobotId } from '@common/enums/RobotId';
import { RobotStatus } from '@common/interfaces/RobotStatus';
import { LogMessage } from '@common/interfaces/LogMessage';
import { OccupancyGrid } from '@common/interfaces/LiveMap';
import { SetGeofence } from '@common/interfaces/SetGeofence';
import { GeofenceCoord } from '@common/types/GeofenceCoord';
import { RobotPose } from '@common/interfaces/RobotPoseWithDistance';

@Injectable({
    providedIn: 'root',
})
export class RobotCommunicationService {
    private missionStatusSubject = new Subject<string>();
    private robotIdentificationSubject = new Subject<string>();
    private commandErrorSubject = new Subject<string>();
    private connectionStatusSubject = new Subject<boolean>();
    private logSubject = new Subject<string>();
    private liveMapSubject = new Subject<OccupancyGrid>();
    private robotPoseSubject = new Subject<RobotPose>();

    constructor(
        public socketService: SocketHandlerService,
        private robotManagementService: RobotManagementService,
    ) {
        this.connect();
    }

    get robot1() {
        return this.robotManagementService.robot1;
    }

    get robot2() {
        return this.robotManagementService.robot2;
    }

    connect() {
        if (!this.socketService.isSocketAlive()) {
            this.socketService.connect();
            this.handleConnect();
            this.handleMissionStatus();
            this.handleRobotIdentification();
            this.handleCommandError();
            this.handleRobotStatus();
            this.handleLog();
            this.handleLiveMap();
            this.handleRobotPose();
        }
    }

    handleConnect() {
        this.socketService.on('connect', () => {
            console.log('WebSocket connection established');
            this.connectionStatusSubject.next(true);
        });
    }

    handleMissionStatus() {
        this.socketService.on('missionStatus', (message: string) => {
            this.missionStatusSubject.next(message);
        });
    }

    handleRobotStatus() {
        this.socketService.on('robotStatus', (message: RobotStatus) => {
            this.updateRobotStatus(message);
        });
    }

    handleLog() {
        this.socketService.on('log', (message: LogMessage) => {
            const formattedLog = `[${message.date}] ${message.source} - ${message.log_type}: ${message.message}`;
            this.logSubject.next(formattedLog);
        });
    }

    handleLiveMap() {
        this.socketService.on('liveMap', (message: OccupancyGrid) => {
            this.liveMapSubject.next(message);
        });
    }

    handleRobotIdentification() {
        this.socketService.on('robotIdentification', (message: string) => {
            this.robotIdentificationSubject.next(message);
        });
    }

    handleCommandError() {
        this.socketService.on('commandError', (message: string) => {
            this.commandErrorSubject.next(message);
        });
    }

    handleDisconnect() {
        this.socketService.on('disconnect', () => {
            console.log('WebSocket connection lost');
            this.connectionStatusSubject.next(false);
        });
    }

    handleRobotPose() {
        this.socketService.on('robotPose', (message: RobotPose) => {
            console.log('Received robot pose', message.position);
            this.robotPoseSubject.next(message);
        });
    }

    onMissionStatus(): Observable<string> {
        return this.missionStatusSubject.asObservable();
    }

    onRobotIdentification(): Observable<string> {
        return this.robotIdentificationSubject.asObservable();
    }

    onCommandError(): Observable<string> {
        return this.commandErrorSubject.asObservable();
    }

    onConnectionStatus(): Observable<boolean> {
        return this.connectionStatusSubject.asObservable();
    }

    onLog(): Observable<string> {
        return this.logSubject.asObservable();
    }

    onLiveMap(): Observable<OccupancyGrid> {
        return this.liveMapSubject.asObservable();
    }

    onRobotPositions(): Observable<RobotPose> {
        return this.robotPoseSubject.asObservable();
    }

    startMissionRobot(): void {
        const message: StartMission = {
            command: RobotCommand.StartMission,
            target: [RobotId.robot1, RobotId.robot2],
            mission_details: {
                orientation1: this.robot1.orientation,
                position1: this.robot1.position,
                orientation2: this.robot2.orientation,
                position2: this.robot2.position,
            },
            timestamp: new Date().toISOString(),
        };
        this.socketService.send(RobotCommand.StartMission, message);
    }

    startMissionGazebo(): void {
        const message: StartMission = {
            command: RobotCommand.StartMission,
            target: [RobotId.gazebo],
            mission_details: {
                orientation1: this.robot1.orientation,
                position1: this.robot1.position,
                orientation2: this.robot2.orientation,
                position2: this.robot2.position,
            },
            timestamp: new Date().toISOString(),
        };
        this.socketService.send(RobotCommand.StartMission, message);
    }

    endMissionRobot(): void {
        const message: EndMission = {
            command: RobotCommand.EndMission,
            target: [RobotId.robot1, RobotId.robot2],
            timestamp: new Date().toISOString(),
        };
        this.socketService.send(RobotCommand.EndMission, message);
    }

    endMissionGazebo(): void {
        const message: EndMission = {
            command: RobotCommand.EndMission,
            target: [RobotId.gazebo],
            timestamp: new Date().toISOString(),
        };
        this.socketService.send(RobotCommand.EndMission, message);
    }

    updateRobot(identifier: string, status: string, position: { x: number; y: number }): void {
        const message: UpdateRobot = {
            command: RobotCommand.UpdateRobot,
            identifier,
            status,
            position,
            timestamp: new Date().toISOString(),
        };
        this.socketService.send(RobotCommand.UpdateRobot, message);
    }

    returnToBase(): void {
        const message: ReturnToBase = {
            command: RobotCommand.ReturnToBase,
            timestamp: new Date().toISOString(),
        };
        this.socketService.send(RobotCommand.ReturnToBase, message);
    }

    updateControllerCode(newCode: string, filename: string): void {
        const message: UpdateControllerCode = {
            command: RobotCommand.UpdateControllerCode,
            code: newCode,
            timestamp: new Date().toISOString(),
            filename: filename,
        };
        this.socketService.send(RobotCommand.UpdateControllerCode, message);
    }

    notifyRobotsToCommunicate(): void {
        const message: NotifyRobotsToCommunicate = {
            command: RobotCommand.InitiateP2P,
            timestamp: new Date().toISOString(),
        };
        this.socketService.send(RobotCommand.InitiateP2P, message);
    }

    findFurthestRobot(relativePoint: { x: number; y: number }): void {
        const message: FindFurthestRobot = {
            command: RobotCommand.FindFurthestRobot,
            relative_point: relativePoint,
            timestamp: new Date().toISOString(),
        };
        this.socketService.send(RobotCommand.FindFurthestRobot, message);
    }

    identifyRobot(target: RobotId): void {
        const message: IdentifyRobot = {
            command: RobotCommand.IdentifyRobot,
            target,
        };
        this.socketService.send(RobotCommand.IdentifyRobot, message);
    }

    setGeofence(coords: GeofenceCoord): void {
        const message: SetGeofence = {
            command: RobotCommand.SetGeofence,
            geofence_coordinates: coords,
            timestamp: new Date().toISOString(),
        };
        this.socketService.send(RobotCommand.SetGeofence, message);
    }

    onMessage(eventName: string): Observable<unknown> {
        return new Observable((observer) => {
            this.socketService.on(eventName, (data: unknown) => {
                observer.next(data);
            });
        });
    }

    disconnect(): void {
        this.socketService.disconnect();
    }

    private updateRobotStatus(status: RobotStatus): void {
        if (status.robot_id === RobotId.robot1) {
            this.robot1.status = status.robot_status;
            this.robot1.battery = status.battery_level;
        } else if (status.robot_id === RobotId.robot2) {
            this.robot2.status = status.robot_status;
            this.robot2.battery = status.battery_level;
        }
    }
}
