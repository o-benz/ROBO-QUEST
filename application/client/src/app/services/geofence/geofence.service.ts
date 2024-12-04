import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GeofenceCoord } from '@common/types/GeofenceCoord';

@Injectable({
  providedIn: 'root'
})
export class GeofenceService {
  private geofenceSubject = new BehaviorSubject<GeofenceCoord | null>(null);
  geofence$ = this.geofenceSubject.asObservable();

  setGeofence(coords: GeofenceCoord) {
    this.geofenceSubject.next(coords);
  }

  clearGeofence() {
    this.geofenceSubject.next(null);
  }
}