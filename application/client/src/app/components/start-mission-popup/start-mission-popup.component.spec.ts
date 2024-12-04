import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RobotManagementService } from '@app/services/robot-management/robot-management.service';
import { Robot } from '@app/classes/robot/robot';
import { RobotId } from '@common/enums/RobotId';
import { RobotState } from '@common/enums/RobotState';
import { StartMissionPopupComponent } from './start-mission-popup.component';

describe('StartMissionPopupComponent', () => {
    let component: StartMissionPopupComponent;
    let fixture: ComponentFixture<StartMissionPopupComponent>;
    let robotManagementService: RobotManagementService;

    beforeEach(async () => {
        const robotManagementServiceMock = {
            robot1: new Robot(RobotId.robot1, 'Robot1', RobotState.WAITING, 100, { x: 0, y: 0 }, 0.0),
            robot2: new Robot(RobotId.robot2, 'Robot2', RobotState.WAITING, 100, { x: 0, y: 0 }, 0.0),
        };

        await TestBed.configureTestingModule({
            imports: [FormsModule],
            providers: [{ provide: RobotManagementService, useValue: robotManagementServiceMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(StartMissionPopupComponent);
        component = fixture.componentInstance;
        robotManagementService = TestBed.inject(RobotManagementService);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have default robot positions and orientations', () => {
        expect(component.robot1X).toBe(0);
        expect(component.robot1Y).toBe(0);
        expect(component.robot1Orientation).toBe(0.0);
        expect(component.robot2X).toBe(0);
        expect(component.robot2Y).toBe(0);
        expect(component.robot2Orientation).toBe(0.0);
    });

    it('should get robot1 from RobotManagementService', () => {
        expect(component.robot1).toBe(robotManagementService.robot1);
    });

    it('should get robot2 from RobotManagementService', () => {
        expect(component.robot2).toBe(robotManagementService.robot2);
    });

    it('should emit startSimulationMission event with updated robot positions and orientations when simulation is selected', () => {
        spyOn(component.startSimulationMission, 'emit');

        component.robot1X = 10;
        component.robot1Y = 20;
        component.robot1Orientation = 90.0;
        component.robot2X = 30;
        component.robot2Y = 40;
        component.robot2Orientation = 180.0;
        component.selectedOption = 'simulation';

        component.onStartMission();

        expect(component.robot1.position).toEqual({ x: 10, y: 20 });
        expect(component.robot1.orientation).toBe(90.0);
        expect(component.robot2.position).toEqual({ x: 30, y: 40 });
        expect(component.robot2.orientation).toBe(180.0);
        expect(component.startSimulationMission.emit).toHaveBeenCalled();
    });

    it('should emit startPhysicalMission event with updated robot positions and orientations when physical is selected', () => {
        spyOn(component.startPhysicalMission, 'emit');

        component.robot1X = 10;
        component.robot1Y = 20;
        component.robot1Orientation = 90.0;
        component.robot2X = 30;
        component.robot2Y = 40;
        component.robot2Orientation = 180.0;
        component.selectedOption = 'physical';

        component.onStartMission();

        expect(component.robot1.position).toEqual({ x: 10, y: 20 });
        expect(component.robot1.orientation).toBe(90.0);
        expect(component.robot2.position).toEqual({ x: 30, y: 40 });
        expect(component.robot2.orientation).toBe(180.0);
        expect(component.startPhysicalMission.emit).toHaveBeenCalled();
    });

    it('should emit cancelMission event when onCancel is called', () => {
        spyOn(component.cancelMission, 'emit');

        component.onCancel();

        expect(component.cancelMission.emit).toHaveBeenCalled();
    });
});
