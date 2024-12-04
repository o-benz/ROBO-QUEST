import { Injectable } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SocketHandlerService {
    socket: Socket;

    isSocketAlive() {
        return this.socket && this.socket.connected;
    }

    connect() {
        this.socket = io(environment.serverUrlRoot, { transports: ['websocket'], upgrade: false });
    }

    disconnect() {
        this.socket.disconnect();
    }

    on<T>(event: string, action: (data: T) => void): void {
        this.socket.on(event, action);
    }

    // Any is required to simulate Function type in tests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    send<T>(event: string, data?: T, callback?: (param: any) => any): void {
        this.socket.emit(event, ...[data, callback].filter((x) => x));
    }
}
