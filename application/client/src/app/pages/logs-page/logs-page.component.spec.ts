import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ElementRef } from '@angular/core';
import { LogsPageComponent } from './logs-page.component';
import { MissionService } from '@app/services/mission/mission.service';
import { ThemeService } from '@app/services/theme/theme.service';
import { FormsModule } from '@angular/forms';
import { LogsDisplayComponent } from '@app/components/logs-display/logs-display.component';
import { MapDisplayComponent } from '@app/components/map-display/map-display.component';
import { MissionType } from '@common/enums/MissionType';

describe('LogsPageComponent', () => {
    let component: LogsPageComponent;
    let fixture: ComponentFixture<LogsPageComponent>;
    let missionServiceMock: any;
    let themeServiceMock: any;

    beforeEach(async () => {
        missionServiceMock = {
            getMissionLogs: jasmine.createSpy('getMissionLogs'),
            handleMissionLogs: jasmine.createSpy('handleMissionLogs').and.returnValue(Promise.resolve()),
            missions: [
                {
                    id: '2023-01-01',
                    logs: [
                        { source: 'source1', log_type: 'type1', date: '2023-01-01', message: 'message1' },
                        { source: 'source2', log_type: 'type2', date: '2023-01-02', message: 'message2' },
                    ],
                    map: [],
                    robots: ['robot1'],
                    missionType: MissionType.PHYSICAL_ROBOTS,
                    missionDuration: '1h',
                    traveledDistance: 100,
                },
                {
                    id: '2023-01-02',
                    logs: [
                        { source: 'source3', log_type: 'type3', date: '2023-01-03', message: 'message3' },
                    ],
                    map: [],
                    robots: ['robot2'],
                    missionType: MissionType.GAZEBO_SIMULATION,
                    missionDuration: '2h',
                    traveledDistance: 200,
                },
            ],
        };

        themeServiceMock = {
            toggleTheme: jasmine.createSpy('toggleTheme'),
        };

        await TestBed.configureTestingModule({
            imports: [FormsModule, LogsDisplayComponent, MapDisplayComponent],
            providers: [
                { provide: MissionService, useValue: missionServiceMock },
                { provide: ThemeService, useValue: themeServiceMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(LogsPageComponent);
        component = fixture.componentInstance;
        component.logTerminal = new ElementRef(document.createElement('div'));
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call getMissionLogs and loadMissionLogs on ngOnInit', () => {
        spyOn(component, 'loadMissionLogs');
        component.ngOnInit();
        expect(missionServiceMock.getMissionLogs).toHaveBeenCalled();
        expect(component.loadMissionLogs).toHaveBeenCalled();
    });

    it('should toggle theme', () => {
        component.toggleTheme();
        expect(themeServiceMock.toggleTheme).toHaveBeenCalled();
    });

    it('should sort missions by date in ascending order', () => {
        component.sortOption = 'date';
        component.isAscending = true;
        component.sort();
        expect(component.missions[0].id).toBe('2023-01-01');
        expect(component.missions[1].id).toBe('2023-01-02');
    });

    it('should sort missions by date in descending order', () => {
        component.sortOption = 'date';
        component.isAscending = false;
        component.sort();
        expect(component.missions[0].id).toBe('2023-01-02');
        expect(component.missions[1].id).toBe('2023-01-01');
    });

    it('should sort missions by duration in ascending order', () => {
        component.sortOption = 'duration';
        component.isAscending = true;
        component.sort();
        expect(component.missions[0].missionDuration).toBe('1h');
        expect(component.missions[1].missionDuration).toBe('2h');
    });

    it('should sort missions by duration in descending order', () => {
        component.sortOption = 'duration';
        component.isAscending = false;
        component.sort();
        expect(component.missions[0].missionDuration).toBe('1h');
        expect(component.missions[1].missionDuration).toBe('2h');
    });

    it('should sort missions by distance in ascending order', () => {
        component.sortOption = 'distance';
        component.isAscending = true;
        component.sort();
        expect(component.missions[0].traveledDistance).toBe(100);
        expect(component.missions[1].traveledDistance).toBe(200);
    });

    it('should sort missions by distance in descending order', () => {
        component.sortOption = 'distance';
        component.isAscending = false;
        component.sort();
        expect(component.missions[0].traveledDistance).toBe(200);
        expect(component.missions[1].traveledDistance).toBe(100);
    });

    it('should filter missions by both types', () => {
        component.selectedType = 'both';
        component.typeChange();
        expect(component.missions.length).toBe(2);
    });

    it('should filter missions by physical type', () => {
        component.selectedType = 'physical';
        component.typeChange();
        expect(component.missions.length).toBe(1);
        expect(component.missions[0].missionType).toBe('Physical Robots');
    });

    it('should filter missions by simulation type', () => {
        component.selectedType = 'simulation';
        component.typeChange();
        expect(component.missions.length).toBe(1);
        expect(component.missions[0].missionType).toBe('Gazebo Simulation');
    });

    it('should load mission logs', () => {
        component.loadMissionLogs();
        expect(component.missions.length).toBe(2);
    });

    it('should set sort option', () => {
        component.sortOption = 'date';
        expect(component.sortOption).toBe('date');
    });

    it('should set selected type', () => {
        component.selectedType = 'physical';
        expect(component.selectedType).toBe('physical');
    });

    it('should convert duration to seconds', () => {
        expect(component.convertDurationToSeconds('1 hour, 2 minutes, 3 seconds')).toBe(3723);
        expect(component.convertDurationToSeconds('2 hours, 0 minutes, 0 seconds')).toBe(7200);
        expect(component.convertDurationToSeconds('0 hours, 30 minutes, 0 seconds')).toBe(1800);
        expect(component.convertDurationToSeconds('')).toBe(0);
        expect(component.convertDurationToSeconds('invalid')).toBe(0);
    });

    it('should toggle sort order', () => {
        component.isAscending = true;
        component.toggleSortOrder();
        expect(component.isAscending).toBe(false);
        expect(component.sortOrder).toBe('desc');

        component.toggleSortOrder();
        expect(component.isAscending).toBe(true);
        expect(component.sortOrder).toBe('asc');
    });

    // it('should add a log to the terminal', () => {
    //     const testLog = 'Test log entry';
    //     component.addLogToTerminal(testLog, true);

    //     const logElements = component.logTerminal.nativeElement.getElementsByTagName('p');
    //     expect(logElements.length).toBe(1);
    //     expect(logElements[0].textContent).toBe(testLog);
    //     expect(logElements[0].style.fontWeight).toBe('bold');

    //     component.addLogToTerminal(testLog, false);
    //     expect(logElements.length).toBe(2);
    //     expect(logElements[1].textContent).toBe(testLog);
    //     expect(logElements[1].style.marginLeft).toBe('20px');
    // });
});