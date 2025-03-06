import {Component, ElementRef, OnInit, OnDestroy, ViewChild, AfterViewInit} from '@angular/core';
import { MovieService } from '../movie.service';
import { Movie } from '../models/movie.model';
import { CommonModule } from '@angular/common';
import confetti from 'canvas-confetti';
import { MatButtonModule } from '@angular/material/button';
import { MovieVoteService } from '../movie-vote.service';
import { UserAuthService } from '../user-auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-movies',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './movies.component.html',
  styleUrls: ['./movies.component.css']
})
export class MoviesComponent implements OnInit, OnDestroy, AfterViewInit {
  letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  allMovies: Movie[] = [];
  filteredMovies: Movie[] = [];
  voteCounts: { [key: string]: number } = {};
  recentlyUpdated: { [key: string]: boolean } = {};
  private votesSubscription?: Subscription;
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
    this.movieService.getMovies$().subscribe(movies => {
      this.allMovies = movies;
      this.filteredMovies = movies;
      this.loadAllVotes();
    });

    this.votesSubscription = this.movieVoteService.voteCounts$.subscribe(counts => {
      const updatedMovies = Object.keys(counts).filter(movieId => this.voteCounts[movieId] !== counts[movieId]);
      this.voteCounts = counts;
      updatedMovies.forEach(movieId => {
        this.recentlyUpdated[movieId] = true;
        setTimeout(() => this.recentlyUpdated[movieId] = false, 2250);
      });
    });
  }

  ngOnDestroy(): void {
    this.votesSubscription?.unsubscribe();
  }

  ngAfterViewInit(): void {
    this.confettiInstance = confetti.create(this.confettiCanvas.nativeElement, { resize: true, useWorker: true });
  }

  filterByLetter(letter: string): void {
    this.filteredMovies = this.allMovies.filter(movie => this.getSortTitle(movie.Series_Title).toLowerCase().startsWith(letter.toLowerCase()));
  }

  private getSortTitle(title: string): string {
    return title.toLowerCase().startsWith('the ') ? title.substring(4).trim() : title;
  }

  vote(movieId: string): void {
    if (!this.authService.isLoggedIn()) {
      alert('Please log in to vote');
      return;
    }
    this.movieVoteService.submitVote(movieId, 'up').subscribe({ error: error => console.error('Error voting:', error) });
  }

  clearVotes(): void {
    this.voteCounts = {};
    localStorage.removeItem('voteCounts');
  }

  celebrateTopMovie(): void {
    if (!this.filteredMovies.length) return;
    this.movieVoteService.getAllMovieVoteCounts().subscribe(counts => {
      let maxVotes = 0;
      let best: Movie | null = null;
      this.filteredMovies.forEach(movie => {
        const votes = counts[movie.Series_Title] || 0;
        if (votes > maxVotes) {
          maxVotes = votes;
          best = movie;
        }
      });
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
      this.confettiInstance({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
      this.confettiInstance({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  closeCelebration() {
    this.showCelebration = false;
  }

  loadAllVotes(): void {
    this.movieVoteService.getAllMovieVoteCounts().subscribe(voteCounts => this.voteCounts = voteCounts);
  }
}
