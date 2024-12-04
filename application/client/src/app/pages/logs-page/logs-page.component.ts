import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MissionService } from '@app/services/mission/mission.service';
import { ThemeService } from '@app/services/theme/theme.service';
import { Mission } from '@common/interfaces/Mission';
import { LogsDisplayComponent } from "@app/components/logs-display/logs-display.component";
import { MapDisplayComponent } from "../../components/map-display/map-display.component";
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-logs-page',
    standalone: true,
    imports: [LogsDisplayComponent, MapDisplayComponent, FormsModule],
    templateUrl: './logs-page.component.html',
    styleUrl: './logs-page.component.scss',
})
export class LogsPageComponent implements OnInit {
    sortOption: string;
    selectedType: string;
    @ViewChild('logTerminal') logTerminal!: ElementRef;
    missions: Mission[] = [];
    mission: Mission;
    isAscending = true;
    sortOrder = 'asc';

    constructor(
        private themeService: ThemeService,
        public missionService: MissionService,
    ) {}

    ngOnInit() {
        this.missionService.getMissionLogs();
        this.loadMissionLogs();
    }

    async loadMissionLogs() {
        await this.missionService.handleMissionLogs();
        this.missions = this.missionService.missions;
    }

    sort() {
        switch (this.sortOption) {
            case 'date':
                this.missions.sort((a, b) => {
                    const dateA = new Date(a.id).getTime();
                    const dateB = new Date(b.id).getTime();
                    return this.isAscending ? dateA - dateB : dateB - dateA;
                });
                break;
            case 'duration':
                this.missions.sort((a, b) => {
                    const durationA = this.convertDurationToSeconds(a.missionDuration);
                    const durationB = this.convertDurationToSeconds(b.missionDuration);
                    return this.isAscending ? durationA - durationB : durationB - durationA;
                });
                break;
            case 'distance':
                this.missions.sort((a, b) => {
                    const distanceA = a.traveledDistance;
                    const distanceB = b.traveledDistance;
                    return this.isAscending ? distanceA - distanceB : distanceB - distanceA;
                });
                break;
        }
    }

    typeChange() {
        switch (this.selectedType) {
            case 'both':
                this.missions = [...this.missionService.missions];
                break;
            case 'physical':
                this.missions = this.missionService.missions.filter(mission => mission.missionType == 'Physical Robots');
                break;
            case 'simulation':
                this.missions = this.missionService.missions.filter(mission => mission.missionType == 'Gazebo Simulation');
                break;
        }
    }

    convertDurationToSeconds(duration: string): number {
        if (!duration) return 0;
        const timeParts = duration.match(/(\d+)\s*hours?,\s*(\d+)\s*minutes?,\s*(\d+)\s*seconds?/);
        if (!timeParts) return 0;
        const hours = parseInt(timeParts[1], 10);
        const minutes = parseInt(timeParts[2], 10);
        const seconds = parseInt(timeParts[3], 10);
        return (hours * 3600) + (minutes * 60) + seconds;
    }

    toggleSortOrder(): void {
        this.isAscending = !this.isAscending;
        this.sortOrder = this.isAscending ? 'asc' : 'desc';
        this.sort();
    }

    addLogToTerminal(log: string, isMainLine: boolean) {
        const logElement = document.createElement('p');
        logElement.textContent = log;
        if (isMainLine) {
            logElement.style.fontWeight = 'bold';
        } else {
            logElement.style.marginLeft = '20px';
        }
        this.logTerminal.nativeElement.appendChild(logElement);
        this.logTerminal.nativeElement.scrollTop = this.logTerminal.nativeElement.scrollHeight;
    }

    toggleTheme() {
        this.themeService.toggleTheme();
    }
}
