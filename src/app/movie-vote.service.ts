// src/app/movie-vote.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { UserAuthService } from './user-auth.service';

interface VoteCount {
  upVotes: number;
  downVotes: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class MovieVoteService {
  private voteCountsSubject = new BehaviorSubject<Record<string, VoteCount>>({});
  public voteCounts$ = this.voteCountsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: UserAuthService
  ) {}

  loadVotes(movieId: string): Observable<VoteCount> {
    return this.http.get<VoteCount>(`/api/votes/${movieId}`).pipe(
      tap(votes => {
        const currentCounts = this.voteCountsSubject.value;
        this.voteCountsSubject.next({
          ...currentCounts,
          [movieId]: votes
        });
      }),
      catchError(() => {
        return of({ upVotes: 0, downVotes: 0, total: 0 });
      })
    );
  }

  getUserVote(movieId: string): Observable<string | null> {
    if (!this.authService.isLoggedIn()) {
      return of(null);
    }

    return this.http.get<{hasVoted: boolean, vote?: string}>(`/api/votes/${movieId}/user`).pipe(
      map(result => result.hasVoted ? result.vote! : null),
      catchError(() => of(null))
    );
  }

  submitVote(movieId: string, vote: 'up' | 'down'): Observable<any> {
    if (!this.authService.isLoggedIn()) {
      return of({ error: 'User not logged in' });
    }

    return this.http.post('/api/votes', { movieId, vote }).pipe(
      catchError(error => {
        console.error('Error submitting vote', error);
        return of({ error: 'Failed to submit vote' });
      })
    );
  }

  getVoteTotals(movieId: string): Observable<number> {
    return this.voteCounts$.pipe(
      map(counts => {
        if (counts[movieId]) {
          return counts[movieId].total;
        }
        return 0; // Simply return 0 if no votes exist
      })
    );
  }

  // Add to movie-vote.service.ts
  getVoteCountsForMovies(movieIds: string[]): Observable<Record<string, number>> {
    return new Observable<Record<string, number>>(observer => {
      const voteTotals: Record<string, number> = {};
      let completed = 0;

      // If no movies to check, return empty object
      if (movieIds.length === 0) {
        observer.next({});
        observer.complete();
        return;
      }

      // Get votes for each movie
      movieIds.forEach(movieId => {
        this.getVoteTotals(movieId).subscribe({
          next: total => {
            voteTotals[movieId] = total;
            completed++;

            if (completed === movieIds.length) {
              observer.next(voteTotals);
              observer.complete();
            }
          },
          error: err => {
            voteTotals[movieId] = 0;
            completed++;

            if (completed === movieIds.length) {
              observer.next(voteTotals);
              observer.complete();
            }
          }
        });
      });
    });
  }

  // Add to MovieVoteService
  getAllMovieVotes(): Observable<Record<string, VoteCount>> {
    return this.http.get<Record<string, VoteCount>>('/api/votes/all').pipe(
      tap(allVotes => {
        // Update the voteCountsSubject with all votes at once
        this.voteCountsSubject.next(allVotes);
      }),
      catchError(error => {
        console.error('Error fetching all votes:', error);
        return of({});
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

  getVoteCount(movieId: string): Observable<number> {
    return this.http.get<{voteCount: number}>(`/api/votes/${movieId}/count`).pipe(
      map(response => response.voteCount),
      catchError(() => {
        return of(0);
      })
    );
  }
}
