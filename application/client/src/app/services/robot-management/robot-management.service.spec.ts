import { TestBed } from '@angular/core/testing';

import { RobotManagementService } from './robot-management.service';

describe('RobotManagementService', () => {
    let service: RobotManagementService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(RobotManagementService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
