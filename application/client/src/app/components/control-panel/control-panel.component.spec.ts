import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ControlPanelComponent } from './control-panel.component';
import { RobotCommunicationService } from '@app/services/robot-communication/robot-communication.service';
import { LogsService } from '@app/services/logs/logs.service';
import { MissionService } from '@app/services/mission/mission.service';
import { GeofenceService } from '@app/services/geofence/geofence.service';
import { of } from 'rxjs';
import { MissionType } from '@app/enums/MissionType';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RobotId } from '@common/enums/RobotId';
import { GeofenceCoord } from '@common/types/GeofenceCoord';

describe('ControlPanelComponent', () => {
    let component: ControlPanelComponent;
    let fixture: ComponentFixture<ControlPanelComponent>;
    let robotServiceMock: any;
    let logsServiceMock: any;
    let missionServiceMock: any;
    let geofenceServiceMock: any;
  
    beforeEach(async () => {
      robotServiceMock = {
        onConnectionStatus: jasmine.createSpy('onConnectionStatus').and.returnValue(of(true)),
        startMissionRobot: jasmine.createSpy('startMissionRobot'),
        startMissionGazebo: jasmine.createSpy('startMissionGazebo'),
        endMissionRobot: jasmine.createSpy('endMissionRobot'),
        endMissionGazebo: jasmine.createSpy('endMissionGazebo'),
        identifyRobot: jasmine.createSpy('identifyRobot'),
        returnToBase: jasmine.createSpy('returnToBase'),
        updateControllerCode: jasmine.createSpy('updateControllerCode'),
        setGeofence: jasmine.createSpy('setGeofence'),
        notifyRobotsToCommunicate: jasmine.createSpy('notifyRobotsToCommunicate')
      };
  
      logsServiceMock = {
        triggerClearLogs: jasmine.createSpy('triggerClearLogs')
      };
  
      missionServiceMock = {
        setMissionType: jasmine.createSpy('setMissionType'),
        getMissionType: jasmine.createSpy('getMissionType').and.returnValue(MissionType.Physical),
        getIsMissionActive: jasmine.createSpy('getIsMissionActive').and.returnValue(false),
        setIsMissionActive: jasmine.createSpy('setIsMissionActive'),
        getNewCode: jasmine.createSpy('getNewCode').and.returnValue('newCode'),
        getFileName: jasmine.createSpy('getFileName').and.returnValue('fileName'),
        setInitialCode: jasmine.createSpy('setInitialCode'),
        getIsCodeChanged: jasmine.createSpy('getIsCodeChanged').and.returnValue(false)
      };
  
      geofenceServiceMock = {
        clearGeofence: jasmine.createSpy('clearGeofence')
      };
  
      await TestBed.configureTestingModule({
        imports: [BrowserAnimationsModule],
        providers: [
          { provide: RobotCommunicationService, useValue: robotServiceMock },
          { provide: LogsService, useValue: logsServiceMock },
          { provide: MissionService, useValue: missionServiceMock },
          { provide: GeofenceService, useValue: geofenceServiceMock }
        ]
      }).compileComponents();
    });
  
    beforeEach(() => {
      fixture = TestBed.createComponent(ControlPanelComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });
  
    it('should create', () => {
      expect(component).toBeTruthy();
    });
  
    it('should start physical mission', () => {
      component.onPhysicalMissionStart();
      expect(robotServiceMock.startMissionRobot).toHaveBeenCalled();
      expect(missionServiceMock.setMissionType).toHaveBeenCalledWith(MissionType.Physical);
      expect(missionServiceMock.setIsMissionActive).toHaveBeenCalledWith(true);
      expect(logsServiceMock.triggerClearLogs).toHaveBeenCalled();
    });
  
    it('should stop simulation mission', () => {
      missionServiceMock.getMissionType.and.returnValue(MissionType.Simulation);
      component.stopMission();
      expect(robotServiceMock.endMissionGazebo).toHaveBeenCalled();
      expect(missionServiceMock.setIsMissionActive).toHaveBeenCalledWith(false);
    });
  
    it('should verify socket connection', () => {
      component['socketConnected'] = true;
      expect(component.verifySocketConnection()).toBeTrue();
    });
  
    it('should identify robot if socket is connected', () => {
      component['socketConnected'] = true;
      component.identifyRobot(RobotId.robot1);
      expect(robotServiceMock.identifyRobot).toHaveBeenCalledWith(RobotId.robot1);
    });
  
    it('should stop mission based on mission type', () => {
      missionServiceMock.getMissionType.and.returnValue(MissionType.Physical);
      component.stopMission();
      expect(robotServiceMock.endMissionRobot).toHaveBeenCalled();
      expect(missionServiceMock.setIsMissionActive).toHaveBeenCalledWith(false);
    });
  
    it('should toggle collapse state', () => {
      component.isCollapsed = false;
      component.toggleCollapse();
      expect(component.isCollapsed).toBeTrue();
    });
  
    it('should handle key down event and close popup on Escape key', () => {
      component.showPopup = true;
      component.showGeoPopup = true;
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.handleKeyDown(event);
      expect(component.showPopup).toBeFalse();
      expect(component.showGeoPopup).toBeFalse();
    });
  
    it('should initialize and subscribe to connection status', () => {
      component.ngOnInit();
      expect(robotServiceMock.onConnectionStatus).toHaveBeenCalled();
    });
  
    it('should start mission and show popup if socket is connected', () => {
      component['socketConnected'] = true;
      component.startMission();
      expect(component.showPopup).toBeTrue();
    });
  
    it('should handle error when updating software', () => {
      spyOn(console, 'error');
      robotServiceMock.updateControllerCode.and.throwError('Error updating software');
      component.updateSoftware();
      expect(console.error).toHaveBeenCalledWith('Error identifying robot', jasmine.any(Error));
    });
  
    it('should return false when socket is not connected', () => {
      component['socketConnected'] = false;
      expect(component.verifySocketConnection()).toBeFalse();
    });
  
    // it('should unsubscribe from all subscriptions on destroy', () => {
    //   const subscriptionMock = {
    //     unsubscribe: jasmine.createSpy('unsubscribe'),
    //     closed: false,
    //     _finalizers: null,
    //     add: jasmine.createSpy('add'),
    //     remove: jasmine.createSpy('remove'),
    //     _hasParent: false,
    //     _addParent: jasmine.createSpy('_addParent'),
    //     _removeParent: jasmine.createSpy('_removeParent')
    //   };
    //   component['subscriptions'] = [subscriptionMock];
    //   component.ngOnDestroy();
    //   expect(subscriptionMock.unsubscribe).toHaveBeenCalled();
    // });
  
    it('should cancel mission and hide popup', () => {
      component.showPopup = true;
      component.showGeoPopup = true;
      component.onCancel();
      expect(component.showPopup).toBeFalse();
      expect(component.showGeoPopup).toBeFalse();
    });
  
    it('should start simulation mission', () => {
      component.onSimulationMissionStart();
      expect(robotServiceMock.startMissionGazebo).toHaveBeenCalled();
      expect(missionServiceMock.setMissionType).toHaveBeenCalledWith(MissionType.Simulation);
      expect(missionServiceMock.setIsMissionActive).toHaveBeenCalledWith(true);
      expect(logsServiceMock.triggerClearLogs).toHaveBeenCalled();
    });
  
    it('should update software if socket is connected', () => {
      component['socketConnected'] = true;
      component.updateSoftware();
      expect(robotServiceMock.updateControllerCode).toHaveBeenCalledWith('newCode', 'fileName');
      expect(missionServiceMock.setInitialCode).toHaveBeenCalledWith('newCode');
    });
  
    it('should return home if socket is connected', () => {
      component['socketConnected'] = true;
      component.returnHome();
      expect(robotServiceMock.returnToBase).toHaveBeenCalled();
      expect(missionServiceMock.setIsMissionActive).toHaveBeenCalledWith(false);
    });

    it('should show geofence popup if socket is connected', () => {
        component['socketConnected'] = true;
        component.geofence();
        expect(component.showGeoPopup).toBeTrue();
        expect(document.body.classList.contains('no-scroll')).toBeTrue();
    });

    it('should show geofence popup if socket is connected', () => {
        const coords: GeofenceCoord = {
            x_max: 1,
            x_min: 0,
            y_min: 0,
            y_max: 0
        };
        component.showGeoPopup = true;
        document.body.classList.add('no-scroll');
        
        component.handleGeofence(coords);
        
        expect(component.showGeoPopup).toBeFalse();
        expect(document.body.classList.contains('no-scroll')).toBeFalse();
        expect(robotServiceMock.setGeofence).toHaveBeenCalledWith(coords);
    });

    it('should initiate P2P if socket is connected', () => {
        component['socketConnected'] = true;
        component.initiateP2P();
        expect(robotServiceMock.notifyRobotsToCommunicate).toHaveBeenCalled();
    });

    it('should return true when mission is active and type is Simulation', () => {
        missionServiceMock.getIsMissionActive.and.returnValue(true);
        missionServiceMock.getMissionType.and.returnValue(MissionType.Simulation);
        expect(component.isMissionSim()).toBeTrue();
    });
    
    it('should return false when mission is not active', () => {
        missionServiceMock.getIsMissionActive.and.returnValue(false);
        missionServiceMock.getMissionType.and.returnValue(MissionType.Simulation);
        expect(component.isMissionSim()).toBeFalse();
    });
    
    it('should return false when mission type is not Simulation', () => {
        missionServiceMock.getIsMissionActive.and.returnValue(true);
        missionServiceMock.getMissionType.and.returnValue(MissionType.Physical);
        expect(component.isMissionSim()).toBeFalse();
    });
});
