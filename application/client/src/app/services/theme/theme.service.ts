import { Theme } from '@acrodata/code-editor';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ThemeService {
    private isDarkMode: boolean;
    private themeSubject = new BehaviorSubject<Theme>(this.getCurrentTheme());
    themeChanged = this.themeSubject.asObservable();

    constructor() {
        this.isDarkMode = localStorage.getItem('isDarkMode') === 'true';
        const theme = this.getCurrentTheme();
        document.documentElement.setAttribute('data', theme);
        this.themeSubject.next(theme);
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('isDarkMode', this.isDarkMode.toString());
        const theme = this.getCurrentTheme();
        document.documentElement.setAttribute('data', theme);
        this.themeSubject.next(theme);
    }

    getCurrentTheme() {
        return this.isDarkMode ? 'dark' : 'light';
    }
}