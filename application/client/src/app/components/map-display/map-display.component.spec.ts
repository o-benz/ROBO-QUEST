import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MapDisplayComponent } from './map-display.component';

describe('MapDisplayComponent', () => {
    let component: MapDisplayComponent;
    let fixture: ComponentFixture<MapDisplayComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [BrowserAnimationsModule],
        }).compileComponents();

        fixture = TestBed.createComponent(MapDisplayComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should toggle collapse state', () => {
        component.isCollapsed = false;
        component.toggleCollapse();
        expect(component.isCollapsed).toBeTrue();
    });
});