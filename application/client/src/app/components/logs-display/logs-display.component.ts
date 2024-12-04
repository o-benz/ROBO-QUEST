import { Component, AfterViewInit, ViewChild, ElementRef, OnInit, OnDestroy, Input } from '@angular/core';
import { RobotCommunicationService } from '@app/services/robot-communication/robot-communication.service';
import { collapseExpandAnimation } from 'src/assets/CollapseExpand';
import { LogsService } from '@app/services/logs/logs.service';
import { Subscription } from 'rxjs';
import { Mission } from '@common/interfaces/Mission';

@Component({
    selector: 'app-logs-display',
    standalone: true,
    imports: [],
    templateUrl: './logs-display.component.html',
    styleUrl: './logs-display.component.scss',
    animations: [collapseExpandAnimation],
})
export class LogsDisplayComponent implements OnInit, OnDestroy, AfterViewInit {
    private clearLogsSubscription: Subscription;
    @Input()mission: Mission;
    @ViewChild('logTerminal') logTerminal!: ElementRef;

    isCollapsed : boolean = true;

    constructor(
        private robotCommunicationService: RobotCommunicationService,
        private logsService: LogsService,
    ) {}

    ngOnInit() {
        this.clearLogsSubscription = this.logsService.clearLogsEvent.subscribe(() => {
            this.clearLogs();
        });
    }

    ngAfterViewInit() {
        this.robotCommunicationService.onLog().subscribe((log) => {
            this.addLogToTerminal(log);
        });
        if(this.mission){
            for (const log of this.mission.logs) {
                this.addLogToTerminal(JSON.stringify(log));
            }
        }
    }

    toggleCollapse() {
        this.isCollapsed = !this.isCollapsed;
    }

    addLogToTerminal(log: string) {
        const logElement = document.createElement('p');
        logElement.textContent = log;
        this.logTerminal.nativeElement.appendChild(logElement);
        this.logTerminal.nativeElement.scrollTop = this.logTerminal.nativeElement.scrollHeight;
    }

    clearLogs() {
        while (this.logTerminal.nativeElement.firstChild) {
            this.logTerminal.nativeElement.removeChild(this.logTerminal.nativeElement.firstChild);
        }
    }

    ngOnDestroy() {
        if (this.clearLogsSubscription) {
            this.clearLogsSubscription.unsubscribe();
        }
    }
}
