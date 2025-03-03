// movies.component.ts
import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import { MovieService } from '../movie.service';
import { Movie } from '../models/movie.model';
import { CommonModule } from '@angular/common';
import confetti from 'canvas-confetti';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-movies',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  template: `
    <h2>Movies</h2>

    <!-- Letter Picker -->
    <div class="letters">
      <button mat-flat-button *ngFor="let letter of letters" (click)="filterByLetter(letter)">
        {{ letter }}
      </button>
    </div>

    <button mat-flat-button color="primary" (click)="celebrateTopMovie()">Celebrate Top Movie</button>
    <button mat-flat-button color="accent" (click)="clearVotes()">Clear Votes</button>

    <!-- Movies Grid -->
    <div class="movies-grid">
      <div class="movie-card" *ngFor="let movie of filteredMovies">
        <h3>{{ movie.Series_Title }}</h3>
        <img [src]="movie.Poster_Link" alt="Poster" />
        <p>Votes: {{ voteCounts[movie.Series_Title] || 0 }}</p>
        <button (click)="vote(movie.Series_Title)">Vote</button>
      </div>
    </div>

    <!-- Celebration overlay -->
    <div class="celebration-overlay" *ngIf="showCelebration">
      <div class="celebration-content">
        <h2>Congratulations to {{ topMovie?.Series_Title }}!</h2>
        <p>It has {{ topMovie ? (voteCounts[topMovie.Series_Title] || 0) : 0 }} votes.</p>
        <button (click)="closeCelebration()">Close</button>
      </div>
    </div>

    <!-- Confetti canvas (placed after the overlay so it renders on top) -->
    <canvas #confettiCanvas class="confetti-canvas"></canvas>
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
      display: flex;
      flex-direction: column;
      align-items: center;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 0.5rem;
    }

    /* Force titles to occupy a uniform space */
    .movie-card h3 {
      min-height: 2.5em;  /* adjust as needed */
      margin: 0.5rem 0;
      text-align: center;
    }

    .movie-card img {
      width: 100%;
      height: auto;
      object-fit: cover;
      border-radius: 4px;
      margin-bottom: 0.5rem;
    }

    /* Celebration overlay: full-screen blur + modal */
    .celebration-overlay {
      position: fixed;
      inset: 0; /* top:0; left:0; right:0; bottom:0; */
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999; /* on top of everything */
    }

    /* Full-screen overlay styling for celebration */
    .celebration-overlay {
      position: fixed;
      inset: 0; /* shorthand for top, right, bottom, left = 0 */
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    .celebration-content {
      background: #fff;
      padding: 2rem;
      border-radius: 8px;
      text-align: center;
    }

    .confetti-canvas {
      position: fixed;
      pointer-events: none;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10000; /* Higher than the overlay */
    }
  `]
})
export class MoviesComponent implements OnInit {
  letters: string[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  allMovies: Movie[] = [];
  filteredMovies: Movie[] = [];
  voteCounts: { [key: string]: number } = {};

  // For the celebration overlay
  showCelebration = false;
  topMovie: Movie | null = null;

  @ViewChild('confettiCanvas') confettiCanvas!: ElementRef<HTMLCanvasElement>;
  private confettiInstance: any;

  constructor(private movieService: MovieService) {}

  ngOnInit(): void {
    // Subscribe to movies from the service
    this.movieService.getMovies$().subscribe((movies) => {
      this.allMovies = movies;
      this.filteredMovies = movies; // default shows all
    });
    const storedVotes = localStorage.getItem('voteCounts');
    this.voteCounts = storedVotes ? JSON.parse(storedVotes) : {};
  }

  ngAfterViewInit(): void {
    // Create a confetti instance using the dedicated canvas element
    this.confettiInstance = confetti.create(this.confettiCanvas.nativeElement, {
      resize: true,
      useWorker: true,
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

  vote(movieTitle: string) {
    if (this.voteCounts[movieTitle]) {
      this.voteCounts[movieTitle]++;
    } else {
      this.voteCounts[movieTitle] = 1;
    }
    localStorage.setItem('voteCounts', JSON.stringify(this.voteCounts));
  }

  clearVotes(): void {
    this.voteCounts = {};
    localStorage.removeItem('voteCounts');
  }

  celebrateTopMovie(): void {
    if (!this.filteredMovies.length) return;

    let maxVotes = 0;
    let best: Movie | null = null;
    for (const movie of this.filteredMovies) {
      const votes = this.voteCounts[movie.Series_Title] || 0;
      if (votes > maxVotes) {
        maxVotes = votes;
        best = movie;
      }
    }

    if (best) {
      this.topMovie = best;
      this.showCelebration = true;
      this.launchConfetti();
    } else {
      alert('No votes yet!');
    }
  }

  launchConfetti(): void {
    const duration = 3000;
    const end = Date.now() + duration;
    const frame = () => {
      this.confettiInstance({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      this.confettiInstance({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    requestAnimationFrame(frame);
  }

  closeCelebration() {
    this.showCelebration = false;
  }
}
