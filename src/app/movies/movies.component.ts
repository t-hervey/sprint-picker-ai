// movies.component.ts
import { Component, OnInit } from '@angular/core';
import { MovieService } from '../movie.service';
import { Movie } from '../models/movie.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-movies',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Movies</h2>

    <!-- Letter Picker -->
    <div class="letters">
      <button *ngFor="let letter of letters" (click)="filterByLetter(letter)">
        {{ letter }}
      </button>
    </div>

    <!-- Movies Grid -->
    <div class="movies-grid">
      <div class="movie-card" *ngFor="let movie of filteredMovies">
        <img [src]="movie.Poster_Link" alt="Poster" />
        <p>{{ movie.Series_Title }}</p>
      </div>
    </div>
  `,
  styles: [`
    .letters {
      margin-bottom: 1rem;
    }
    .letters button {
      margin-right: 0.5rem;
    }
    .movies-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 1rem;
    }
    .movie-card {
      border: 1px solid #ccc;
      padding: 0.5rem;
      text-align: center;
      border-radius: 4px;
    }
    .movie-card img {
      width: 100%;
      height: auto;
      border-radius: 4px;
    }
  `]
})
export class MoviesComponent implements OnInit {
  letters: string[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  allMovies: Movie[] = [];
  filteredMovies: Movie[] = [];

  constructor(private movieService: MovieService) {}

  ngOnInit(): void {
    // Subscribe to movies from the service
    this.movieService.getMovies$().subscribe((movies) => {
      this.allMovies = movies;
      this.filteredMovies = movies; // default shows all
    });
  }

  filterByLetter(letter: string): void {
    this.filteredMovies = this.allMovies.filter(movie => {
      const sortTitle = this.getSortTitle(movie.Series_Title);
      return sortTitle.toLowerCase().startsWith(letter.toLowerCase());
    });
  }

  // If a title starts with "The ", ignore "The" when filtering
  private getSortTitle(title: string): string {
    const lower = title.toLowerCase();
    if (lower.startsWith('the ')) {
      // Remove "The "
      return title.substring(4).trim();
    }
    return title;
  }
}
