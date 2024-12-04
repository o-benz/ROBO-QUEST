import { RobotId } from '@common/enums/RobotId';
import { RobotState } from '@common/enums/RobotState';
import { Robot } from './robot';

describe('Robot', () => {
    let robot: Robot;
    const id = RobotId.robot1;
    const initialName = 'TestBot';
    const initialStatus = RobotState.WAITING;
    const initialBattery = 100;
    const initialPosition = { x: 0, y: 0 };
    const initialOrientation = 0.0;

    beforeEach(() => {
        robot = new Robot(id, initialName, initialStatus, initialBattery, initialPosition, initialOrientation);
    });

    it('should create an instance of Robot', () => {
        expect(robot).toBeTruthy();
    });

    it('should get the id', () => {
        expect(robot.id).toBe(id);
    });

    it('should get the name', () => {
        expect(robot.name).toBe(initialName);
    });

    it('should set the name', () => {
        const newName = 'NewBot';
        robot.name = newName;
        expect(robot.name).toBe(newName);
    });

    it('should get the status', () => {
        expect(robot.status).toBe(initialStatus);
    });

    it('should set the status', () => {
        const newStatus = 'EN MISSION';
        robot.status = newStatus;
        expect(robot.status).toBe(newStatus);
    });

    it('should get the battery', () => {
        expect(robot.battery).toBe(initialBattery);
    });

    it('should set the battery', () => {
        const newBattery = 80;
        robot.battery = newBattery;
        expect(robot.battery).toBe(newBattery);
    });

    it('should get the position', () => {
        expect(robot.position).toEqual(initialPosition);
    });

    it('should get the orientation', () => {
        expect(robot.orientation).toEqual(initialOrientation);
    });

    it('should set the position', () => {
        const newOrientation = 180.0;
        robot.orientation = newOrientation;
        expect(robot.orientation).toEqual(newOrientation);
    });

    it('should set the position', () => {
        const newPosition = { x: 10, y: 10 };
        robot.position = newPosition;
        expect(robot.position).toEqual(newPosition);
    });
});
