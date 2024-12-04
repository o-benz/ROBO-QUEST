import { of, Subject } from 'rxjs';
import { HttpClientModule } from '@angular/common/http';
import { ThemeService } from '@app/services/theme/theme.service';
import { ControlPanelComponent } from '@app/components/control-panel/control-panel.component';
import { StatusDisplayComponent } from '@app/components/status-display/status-display.component';
import { MapDisplayComponent } from '@app/components/map-display/map-display.component';
import { LogsDisplayComponent } from '@app/components/logs-display/logs-display.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MainPageComponent } from './main-page.component';
import { CodeEditorComponent } from '@app/components/code-editor/code-editor.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';

describe('MainPageComponent', () => {
    let component: MainPageComponent;
    let fixture: ComponentFixture<MainPageComponent>;
    let themeService: jasmine.SpyObj<ThemeService>;

    beforeEach(async () => {
        const themeServiceSpy = jasmine.createSpyObj('ThemeService', ['toggleTheme', 'getCurrentTheme']);
        themeServiceSpy.getCurrentTheme.and.returnValue('dark');
        themeServiceSpy.themeChanged = new Subject();

        const codeEditorComponentMock = {
            someObservable$: of([]), // Mock the observable property
            themeChanged: themeServiceSpy.themeChanged.asObservable()
        };

        await TestBed.configureTestingModule({
            imports: [
                HttpClientModule,
                BrowserAnimationsModule,
                ControlPanelComponent,
                StatusDisplayComponent,
                MapDisplayComponent,
                LogsDisplayComponent,
            ],
            providers: [
                { provide: ThemeService, useValue: themeServiceSpy },
                { provide: CodeEditorComponent, useValue: codeEditorComponentMock } // Provide the mock
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MainPageComponent);
        component = fixture.componentInstance;
        themeService = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call toggleTheme on ThemeService when toggleTheme is called', () => {
        component.toggleTheme();
        expect(themeService.toggleTheme).toHaveBeenCalled();
    });
});