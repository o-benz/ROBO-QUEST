import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GeofencePopupComponent } from './geofence-popup.component';
import { GeofenceService } from '@app/services/geofence/geofence.service';
import { GeofenceCoord } from '@common/types/GeofenceCoord';

describe('GeofencePopupComponent', () => {
  let component: GeofencePopupComponent;
  let fixture: ComponentFixture<GeofencePopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeofencePopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeofencePopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
describe('GeofencePopupComponent', () => {
  let component: GeofencePopupComponent;
  let fixture: ComponentFixture<GeofencePopupComponent>;
  let geofenceService: GeofenceService;

  beforeEach(async () => {
    geofenceService = jasmine.createSpyObj('GeofenceService', ['setGeofence']);

    await TestBed.configureTestingModule({
      imports: [GeofencePopupComponent],
      providers: [{ provide: GeofenceService, useValue: geofenceService }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeofencePopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit geofence coordinates on onGeofence', () => {
    spyOn(component.geofence, 'emit');

    component.x_min = 10;
    component.y_min = 20;
    component.x_max = 30;
    component.y_max = 40;

    const expectedCoords: GeofenceCoord = {
      x_min: 10,
      y_min: 20,
      x_max: 30,
      y_max: 40,
    };

    component.onGeofence();

    expect(geofenceService.setGeofence).toHaveBeenCalledWith(expectedCoords);
    expect(component.geofence.emit).toHaveBeenCalledWith(expectedCoords);
  });

  it('should emit cancelMission on onCancel', () => {
    spyOn(component.cancelMission, 'emit');

    component.onCancel();

    expect(component.cancelMission.emit).toHaveBeenCalled();
  });
});
