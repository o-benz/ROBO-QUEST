import { TestBed } from '@angular/core/testing';

import { LogsService } from './logs.service';

describe('LogsService', () => {
    let service: LogsService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(LogsService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should emit clearLogsEvent when triggerClearLogs is called', () => {
        spyOn(service.clearLogsEvent, 'emit');
        service.triggerClearLogs();
        expect(service.clearLogsEvent.emit).toHaveBeenCalled();
    });
});
