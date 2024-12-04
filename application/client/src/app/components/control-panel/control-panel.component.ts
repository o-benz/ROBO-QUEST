import { Component, OnDestroy, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RobotCommunicationService } from '@app/services/robot-communication/robot-communication.service';
import { LogsService } from '@app/services/logs/logs.service';
import { Subscription } from 'rxjs';
import { StartMissionPopupComponent } from '@app/components/start-mission-popup/start-mission-popup.component';
import { RobotId } from '@common/enums/RobotId';
import { collapseExpandAnimation } from 'src/assets/CollapseExpand';
import { MissionService } from '@app/services/mission/mission.service';
import { MissionType } from '@app/enums/MissionType';
import { GeofencePopupComponent } from "../geofence-popup/geofence-popup.component";
import { GeofenceCoord } from '@common/types/GeofenceCoord';
import { GeofenceService } from '@app/services/geofence/geofence.service';

@Component({
    selector: 'app-control-panel',
    standalone: true,
    templateUrl: './control-panel.component.html',
    styleUrls: ['./control-panel.component.scss'],
    imports: [CommonModule, StartMissionPopupComponent, GeofencePopupComponent],
    animations: [collapseExpandAnimation],
})
export class ControlPanelComponent implements OnInit, OnDestroy {
    private subscriptions : Subscription[] = [];
    private socketConnected : boolean = false;
    showPopup : boolean = false;
    showGeoPopup : boolean = false;
    isCollapsed : boolean = false;

    constructor(
        private robotService: RobotCommunicationService,
        private logsService: LogsService,
        private missionService: MissionService,
        private geofenceService: GeofenceService
    ) {}

    ngOnInit(): void {
        this.subscriptions.push(
            this.robotService.onConnectionStatus().subscribe((isConnected) => {
                this.socketConnected = isConnected;
            }),
        );

    }

    @HostListener('window:keydown', ['$event'])
    handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            this.showPopup = false;
            this.showGeoPopup = false;
            document.body.classList.remove('no-scroll');
        }
    }

    toggleCollapse() {
        this.isCollapsed = !this.isCollapsed;
    }

    verifySocketConnection() {
        if (this.socketConnected) return true;
        return false;
    }

    startMission() {
        if (this.verifySocketConnection()) {
            this.showPopup = true;
            document.body.classList.add('no-scroll');
        }
    }

    onPhysicalMissionStart() {
        this.showPopup = false;
        document.body.classList.remove('no-scroll');
        this.geofenceService.clearGeofence();
        this.robotService.startMissionRobot();
        this.missionService.setMissionType(MissionType.Physical);
        this.missionService.setIsMissionActive(true);
        this.logsService.triggerClearLogs();
    }

    onSimulationMissionStart() {
        this.showPopup = false;
        document.body.classList.remove('no-scroll');
        this.geofenceService.clearGeofence();
        this.robotService.startMissionGazebo();
        this.missionService.setMissionType(MissionType.Simulation);
        this.missionService.setIsMissionActive(true);
        this.logsService.triggerClearLogs();
    }

    onCancel() {
        this.showPopup = false;
        this.showGeoPopup = false;
        document.body.classList.remove('no-scroll');
    }

    stopMission() {
        switch (this.missionService.getMissionType()) {
            case MissionType.Physical:
                this.robotService.endMissionRobot();
                break;
            case MissionType.Simulation:
                this.robotService.endMissionGazebo();
                break;
        }
        this.missionService.setIsMissionActive(false);
    }

    identifyRobot(target: RobotId) {
        if (this.verifySocketConnection()) {
            this.robotService.identifyRobot(target);
        }
    }

    returnHome() {
        if (this.verifySocketConnection()) {
            this.robotService.returnToBase();
            this.missionService.setIsMissionActive(false);
        }
    }

    initiateP2P() {
        if (this.verifySocketConnection()) {
            this.robotService.notifyRobotsToCommunicate();
        }
    }

    updateSoftware() {
        if (this.verifySocketConnection()) {
            try {
                this.robotService.updateControllerCode(this.missionService.getNewCode(), this.missionService.getFileName());
                this.missionService.setInitialCode(this.missionService.getNewCode());
            } catch (error) {
                console.error('Error identifying robot', error);
            }
        }
    }

    isCodeChanged() {
        return this.missionService.getIsCodeChanged();
    }

    geofence() {
        if (this.verifySocketConnection()) {
            this.showGeoPopup = true;
            document.body.classList.add('no-scroll');
        }
    }

    handleGeofence(coords: GeofenceCoord) {
        this.showGeoPopup = false;
        document.body.classList.remove('no-scroll');
        this.robotService.setGeofence(coords);
    }
    
    isMissionActive() {
        return this.missionService.getIsMissionActive();
    }

    isMissionSim() {
        return this.missionService.getIsMissionActive() && this.missionService.getMissionType() == MissionType.Simulation;
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }
}
