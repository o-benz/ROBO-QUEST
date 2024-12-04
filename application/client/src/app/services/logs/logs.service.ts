import { Injectable, EventEmitter } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class LogsService {
    clearLogsEvent: EventEmitter<void> = new EventEmitter();

    constructor() {}

    triggerClearLogs() {
        this.clearLogsEvent.emit();
    }
}
