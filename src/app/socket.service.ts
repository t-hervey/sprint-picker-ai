// src/app/socket.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;

  constructor() {
    // Connect to the server
    this.socket = io(environment.apiUrl || 'http://localhost:3000');
  }

  connect(): void {
    if (this.socket.disconnected) {
      this.socket.connect();
    }
  }

  disconnect(): void {
    this.socket.disconnect();
  }

  // Listen for vote updates
  onVoteUpdated(): Observable<{movieId: string, voteCount: number}> {
    return new Observable(observer => {
      this.socket.on('vote-updated', (data) => {
        observer.next(data);
      });

      return () => {
        this.socket.off('vote-updated');
      };
    });
  }
}
