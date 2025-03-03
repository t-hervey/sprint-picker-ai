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
  templateUrl: './movies.component.html',
  styleUrls: ['./movies.component.css']
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
