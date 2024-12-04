import { TestBed } from '@angular/core/testing';
import { GeofenceService } from './geofence.service';
import { GeofenceCoord } from '@common/types/GeofenceCoord';

describe('GeofenceService', () => {
  let service: GeofenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeofenceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set geofence coordinates', () => {
    const coords: GeofenceCoord = {
      x_min: 10,
      x_max: 20,
      y_min: 1,
      y_max: 2
      };
    service.setGeofence(coords);
    service.geofence$.subscribe(value => {
      expect(value).toEqual(coords);
    });
  });

  it('should clear geofence coordinates', () => {
    service.clearGeofence();
    service.geofence$.subscribe(value => {
      expect(value).toBeNull();
    });
  });
});