import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CodeEditorComponent } from './code-editor.component';
import { SocketHandlerService } from '@app/services/socket-handler/socket-handler.service';
import { MissionService } from '@app/services/mission/mission.service';
import { ThemeService } from '@app/services/theme/theme.service';
import { of } from 'rxjs';
import { FileName } from '@app/enums/FileName';
import { RobotCommand } from '@common/enums/RobotCommand';

describe('CodeEditorComponent', () => {
  let component: CodeEditorComponent;
  let fixture: ComponentFixture<CodeEditorComponent>;
  let socketService: jasmine.SpyObj<SocketHandlerService>;
  let missionService: jasmine.SpyObj<MissionService>;
  let themeService: jasmine.SpyObj<ThemeService>;

  beforeEach(async () => {
    const socketServiceSpy = jasmine.createSpyObj('SocketHandlerService', ['connect', 'on', 'send']);
    const missionServiceSpy = jasmine.createSpyObj('MissionService', ['getFileName', 'setInitialCode', 'setFileName', 'setNewCode']);
    const themeServiceSpy = jasmine.createSpyObj('ThemeService', ['getCurrentTheme', 'themeChanged']);

    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule],
      providers: [
        { provide: SocketHandlerService, useValue: socketServiceSpy },
        { provide: MissionService, useValue: missionServiceSpy },
        { provide: ThemeService, useValue: themeServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodeEditorComponent);
    component = fixture.componentInstance;
    socketService = TestBed.inject(SocketHandlerService) as jasmine.SpyObj<SocketHandlerService>;
    missionService = TestBed.inject(MissionService) as jasmine.SpyObj<MissionService>;
    themeService = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;

    missionService.getFileName.and.callFake(() => {
      return component.selectedOption === 'physical' ? FileName.Physical : FileName.Simulation;
    });

    themeService.themeChanged = of('light') as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should connect to socket on init', () => {
    expect(socketService.connect).toHaveBeenCalled();
  });

  it('should load code file on init', () => {
    expect(socketService.send).toHaveBeenCalledWith(RobotCommand.GetCodeFile, missionService.getFileName());
  });

  it('should toggle collapse state', () => {
    component.isCollapsed = true;
    component.toggleCollapse();
    expect(component.isCollapsed).toBeFalse();
    component.toggleCollapse();
    expect(component.isCollapsed).toBeTrue();
  });

  it('should change option and load corresponding file', () => {
    component.onOptionChange('simulation');
    expect(component.selectedOption).toBe('simulation');
    expect(missionService.setFileName).toHaveBeenCalledWith(FileName.Simulation);
    expect(socketService.send).toHaveBeenCalledWith(RobotCommand.GetCodeFile, FileName.Simulation);
  });

  it('should update value on editor change', () => {
    const newValue = 'new code';
    component.onEditorChange(newValue);
    expect(component.value).toBe(newValue);
    expect(missionService.setNewCode).toHaveBeenCalledWith(newValue);
  });

  it('should set fileName to Physical when option is physical', () => {
    component.onOptionChange('physical');
    expect(missionService.setFileName).toHaveBeenCalledWith(FileName.Physical);
    expect(socketService.send).toHaveBeenCalledWith(RobotCommand.GetCodeFile, FileName.Physical);
  });
  
  it('should set fileName to Simulation when option is not physical', () => {
    component.onOptionChange('simulation');
    expect(missionService.setFileName).toHaveBeenCalledWith(FileName.Simulation);
    expect(socketService.send).toHaveBeenCalledWith(RobotCommand.GetCodeFile, FileName.Simulation);
  });

  it('should handle Ctrl+F keydown event', () => {
    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'f' });
    spyOn(event, 'preventDefault');
    const closeButton = document.createElement('button');
    closeButton.setAttribute('name', 'close');
    closeButton.setAttribute('aria-label', 'close');
    document.body.appendChild(closeButton);
    spyOn(closeButton, 'click');

    component.handleCtrlF(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(closeButton.click).toHaveBeenCalled();

    document.body.removeChild(closeButton);
  });
});
