import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserAuthService } from './user-auth.service';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root'
})
export class MovieVoteService {
  private voteCountsSubject = new BehaviorSubject<Record<string, number>>({});
  public voteCounts$ = this.voteCountsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: UserAuthService,
    private socketService: SocketService
  ) {
    this.initializeRealTimeUpdates();
  }

  private initializeRealTimeUpdates(): void {
    this.socketService.onVoteUpdated().subscribe(update => {
      const currentCounts = this.voteCountsSubject.value;
      this.voteCountsSubject.next({
        ...currentCounts,
        [update.movieId]: update.voteCount
      });
    });
  }

  submitVote(movieId: string, vote: 'up' | 'down'): Observable<any> {
    if (!this.authService.isLoggedIn()) return of({ error: 'User not logged in' });

    return this.http.post('/api/votes', { movieId, vote }).pipe(
      catchError(error => {
        console.error('Error submitting vote', error);
        return of({ error: 'Failed to submit vote' });
      })
    );
  }

  getAllMovieVoteCounts(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>('/api/votes/all/counts').pipe(
      catchError(error => {
        console.error('Error fetching all vote counts:', error);
        return of({});
      })
    );
  }
}
