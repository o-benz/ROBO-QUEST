import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Robot } from '@app/classes/robot/robot';
import { RobotManagementService } from '@app/services/robot-management/robot-management.service';

@Component({
    selector: 'app-start-mission-popup',
    templateUrl: './start-mission-popup.component.html',
    styleUrls: ['./start-mission-popup.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule],
})
export class StartMissionPopupComponent {
    @Output() startSimulationMission = new EventEmitter<{ robot1: Robot; robot2: Robot }>();
    @Output() startPhysicalMission = new EventEmitter<{ robot1: Robot; robot2: Robot }>();
    @Output() cancelMission = new EventEmitter<void>();

    robot1X: number = 0;
    robot1Y: number = 0;
    robot1Orientation: number = 0.0;
    robot2X: number = 0;
    robot2Y: number = 0;
    robot2Orientation: number = 0.0;
    selectedOption: string = 'simulation';

    constructor(private managementService: RobotManagementService) {}

    get robot1() {
        return this.managementService.robot1;
    }

    get robot2() {
        return this.managementService.robot2;
    }

    onStartMission() {
        this.robot1.position = { x: this.robot1X, y: this.robot1Y };
        this.robot2.position = { x: this.robot2X, y: this.robot2Y };

        this.robot1.orientation = this.robot1Orientation;
        this.robot2.orientation = this.robot2Orientation;

        switch (this.selectedOption) {
            case 'simulation':
                this.startSimulationMission.emit();
                break;
            case 'physical':
                this.startPhysicalMission.emit();
                break;
        }
    }

    onCancel() {
        this.cancelMission.emit();
    }
}
