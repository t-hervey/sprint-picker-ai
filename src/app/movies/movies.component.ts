// movies.component.ts
import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MovieService } from '../movie.service';
import { Movie } from '../models/movie.model';
import { CommonModule } from '@angular/common';
import confetti from 'canvas-confetti';
import { MatButtonModule } from '@angular/material/button';
import {MovieVoteService} from '../movie-vote.service';
import { UserAuthService } from '../user-auth.service';
import {Subscription} from 'rxjs';

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

  private votesSubscription?: Subscription;

  // For the celebration overlay
  showCelebration = false;
  topMovie: Movie | null = null;

  @ViewChild('confettiCanvas') confettiCanvas!: ElementRef<HTMLCanvasElement>;
  private confettiInstance: any;

  constructor(
    private movieService: MovieService,
    private movieVoteService: MovieVoteService,
    private authService: UserAuthService
  ) {}

  ngOnInit(): void {
    this.movieService.getMovies$().subscribe((movies) => {
      this.allMovies = movies;
      this.filteredMovies = movies;

      // Load all votes at once
      this.loadAllVotes();
    });

    // Subscribe to real-time vote count updates
    this.votesSubscription = this.movieVoteService.voteCounts$.subscribe(counts => {
      this.voteCounts = counts;
    });
  }

  ngOnDestroy(): void {
    // Clean up subscription when component is destroyed
    if (this.votesSubscription) {
      this.votesSubscription.unsubscribe();
    }
  }

  updateVoteCounts(): void {
    this.loadAllVotes();
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

  vote(movieId: string): void {
    if (!this.authService.isLoggedIn()) {
      alert('Please log in to vote');
      return;
    }

    // Just submit the vote - updates will come through socket
    this.movieVoteService.submitVote(movieId, 'up').subscribe({
      error: error => console.error('Error voting:', error)
    });
  }

  clearVotes(): void {
    this.voteCounts = {};
    localStorage.removeItem('voteCounts');
  }

  celebrateTopMovie(): void {
    if (!this.filteredMovies.length) return;

    // Use the direct counts from movie_votes collection
    this.movieVoteService.getAllMovieVoteCounts().subscribe(counts => {
      let maxVotes = 0;
      let best: Movie | null = null;

      for (const movie of this.filteredMovies) {
        const votes = counts[movie.Series_Title] || 0;
        if (votes > maxVotes) {
          maxVotes = votes;
          best = movie;
        }
      }

      if (best && maxVotes > 0) {
        this.topMovie = best;
        this.showCelebration = true;
        this.launchConfetti();
      } else {
        alert('No votes yet!');
      }
    });
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

  loadAllVotes(): void {
    this.movieVoteService.getAllMovieVoteCounts().subscribe(voteCounts => {
      this.voteCounts = voteCounts;
    });
  }
}
