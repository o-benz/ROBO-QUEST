import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
    let service: ThemeService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ThemeService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should toggle theme from dark to light', () => {
        if (service.getCurrentTheme()== 'dark') {
            service.toggleTheme();
            expect(service.getCurrentTheme()).toBe('light');
            expect(document.documentElement.getAttribute('data')).toBe('light');
        } else if (service.getCurrentTheme()== 'light') {
            service.toggleTheme();
            expect(service.getCurrentTheme()).toBe('dark');
            expect(document.documentElement.getAttribute('data')).toBe('dark');
        }
    });

    it('should toggle theme from light to dark', () => {
        if (service.getCurrentTheme()== 'dark') {
            service.toggleTheme();
            service.toggleTheme();
            expect(service.getCurrentTheme()).toBe('dark');
            expect(document.documentElement.getAttribute('data')).toBe('dark');
        } else if (service.getCurrentTheme()== 'light') {
            service.toggleTheme();
            service.toggleTheme();
            expect(service.getCurrentTheme()).toBe('light');
            expect(document.documentElement.getAttribute('data')).toBe('light');
        }
    });
});
