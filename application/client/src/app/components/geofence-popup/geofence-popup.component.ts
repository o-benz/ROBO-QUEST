import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeofenceCoord } from '@common/types/GeofenceCoord';
import { GeofenceService } from '@app/services/geofence/geofence.service';

@Component({
    selector: 'app-geofence-popup',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './geofence-popup.component.html',
    styleUrl: './geofence-popup.component.scss',
})
export class GeofencePopupComponent {
    @Output() geofence = new EventEmitter<GeofenceCoord>();
    @Output() cancelMission = new EventEmitter<void>();

    x_min: number = 0;
    y_min: number = 0;
    x_max: number = 0;
    y_max: number = 0;

    constructor(private geofenceService: GeofenceService) {}

    onGeofence() {
        const coords: GeofenceCoord = {
            x_min: this.x_min,
            y_min: this.y_min,
            x_max: this.x_max,
            y_max: this.y_max,
        };
        this.geofenceService.setGeofence(coords);
        this.geofence.emit(coords);
    }

    onCancel() {
        this.cancelMission.emit();
    }
}
