// movie.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import * as Papa from 'papaparse';
import { Movie } from './models/movie.model';

@Injectable({
  providedIn: 'root'
})
export class MovieService {
  private movies: Movie[] = [];
  private moviesSubject = new BehaviorSubject<Movie[]>([]);

  constructor(private http: HttpClient) {
    this.loadMovies();
  }

  private loadMovies(): void {
    this.http.get('assets/movies.csv', { responseType: 'text' }).subscribe({
      next: (csvData: string) => {
        Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          complete: (result: { data: Movie[]; }) => {
            // result.data is an array of objects matching your CSV headers.
            // Cast the parsed data to Movie[] (ensure CSV headers match Movie keys)
            this.movies = result.data as Movie[];
            this.moviesSubject.next(this.movies);
          },
          error: (error: any) => {
            console.error('Error parsing CSV:', error);
          }
        });
      },
      error: (err) => {
        console.error('Error loading CSV:', err);
      }
    });
  }

  // Returns an observable for the parsed movies.
  getMovies$(): Observable<Movie[]> {
    return this.moviesSubject.asObservable();
  }
}
