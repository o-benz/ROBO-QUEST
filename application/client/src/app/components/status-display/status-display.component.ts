import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RobotManagementService } from '@app/services/robot-management/robot-management.service';
import { RobotCommunicationService } from '@app/services/robot-communication/robot-communication.service';
import { RobotId } from '@common/enums/RobotId';
import { collapseExpandAnimation } from 'src/assets/CollapseExpand';
import { RobotPose } from '@common/interfaces/RobotPoseWithDistance';

@Component({
    selector: 'app-status-display',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './status-display.component.html',
    styleUrl: './status-display.component.scss',
    animations: [collapseExpandAnimation],
})
export class StatusDisplayComponent implements OnInit {
    isCollapsed : boolean = false;
    robotPoses: { [key: string]: RobotPose[] } = {};

    constructor(
        private robotService: RobotCommunicationService,
        private robotManagementService: RobotManagementService,
    ) {}

    ngOnInit(): void {
        this.robotService.onRobotPositions().subscribe((robotPose: RobotPose) => {
            if (robotPose.topic) {
                const { x, y } = robotPose.position;
                this.robotPoses[robotPose.topic] = [{
                    ...robotPose,
                    position: {
                        ...robotPose.position,
                        x: parseFloat(x.toFixed(2)),
                        y: parseFloat(y.toFixed(2))
                    }
                }];
            }
        });
      }

    get robot1() {
        return this.robotManagementService.robot1;
    }

    get robot2() {
        return this.robotManagementService.robot2;
    }

    toggleCollapse() {
        this.isCollapsed = !this.isCollapsed;
    }

    identifyRobot(target: RobotId) {
        this.robotService.identifyRobot(target);
    }
}
