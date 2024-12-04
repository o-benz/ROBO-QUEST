import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RobotManagementService } from '@app/services/robot-management/robot-management.service';
import { RobotCommunicationService } from '@app/services/robot-communication/robot-communication.service';
import { Robot } from '@app/classes/robot/robot';
import { RobotId } from '@common/enums/RobotId';
import { RobotState } from '@common/enums/RobotState';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StatusDisplayComponent } from './status-display.component';

describe('StatusDisplayComponent', () => {
    let component: StatusDisplayComponent;
    let robotCommunicationService: jasmine.SpyObj<RobotCommunicationService>;
    let robotManagementService: jasmine.SpyObj<RobotManagementService>;

    beforeEach(() => {
        const robotCommunicationSpy = jasmine.createSpyObj('RobotCommunicationService', ['identifyRobot', 'onRobotPositions']);
        const robotManagementSpy = jasmine.createSpyObj('RobotManagementService', [], {
            robot1: { id: '1', name: 'Robot 1', status: RobotState.WAITING, battery: 100, position: { x: 0, y: 0 }, orientation: 0.0 } as Robot,
            robot2: { id: '2', name: 'Robot 2', status: RobotState.WAITING, battery: 100, position: { x: 0, y: 0 }, orientation: 0.0 } as Robot,
        });

        TestBed.configureTestingModule({
            imports: [BrowserAnimationsModule],
            providers: [
                { provide: RobotCommunicationService, useValue: robotCommunicationSpy },
                { provide: RobotManagementService, useValue: robotManagementSpy },
            ],
        }).compileComponents();

        const fixture = TestBed.createComponent(StatusDisplayComponent);
        component = fixture.componentInstance;
        robotCommunicationService = TestBed.inject(RobotCommunicationService) as jasmine.SpyObj<RobotCommunicationService>;
        robotManagementService = TestBed.inject(RobotManagementService) as jasmine.SpyObj<RobotManagementService>;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call identifyRobot on RobotCommunicationService with correct robot id', () => {
        const robot: Robot = new Robot(RobotId.robot1, 'Robot 1', RobotState.WAITING, 100, { x: 0, y: 0 }, 0.0);
        component.identifyRobot(robot.id);
        expect(robotCommunicationService.identifyRobot).toHaveBeenCalledWith(robot.id);
    });

    it('should return robot1 from RobotManagementService', () => {
        expect(component.robot1).toEqual(robotManagementService.robot1);
    });

    it('should return robot2 from RobotManagementService', () => {
        expect(component.robot2).toEqual(robotManagementService.robot2);
    });

    it('should toggle collapse state', () => {
        component.isCollapsed = false;
        component.toggleCollapse();
        expect(component.isCollapsed).toBeTrue();
    });

    it('should update robotPoses with the correct topic and position', () => {
        const robotPose = {
            position: { x: 1, y: 1, z: 1 },
            orientation: { x: 1, y: 1, z: 1, w: 1 },
            topic: 'robot1',
        };

        robotCommunicationService.onRobotPositions.and.returnValue(of(robotPose));

        component.robotPoses = {};
        component.ngOnInit();

        expect(component.robotPoses['robot1']).toEqual([{
            ...robotPose,
            position: {
                ...robotPose.position,
                x: parseFloat(robotPose.position.x.toFixed(2)),
                y: parseFloat(robotPose.position.y.toFixed(2))
            }
        }]);
    });
});