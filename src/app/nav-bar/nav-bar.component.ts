// nav-bar.component.ts
import { Component, OnInit } from '@angular/core';
import { TopicService } from '../topic.service';
import { Router } from '@angular/router';
import {MatToolbar} from '@angular/material/toolbar';
import {MatButton} from '@angular/material/button';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-nav-bar',
  template : `
    <mat-toolbar color="primary">
      <span>Integrations Sprints</span>
      <span class="spacer"></span>
      <button mat-button (click)="navigateToHome()">Home</button>
      <button mat-button (click)="navigateToMovies()">Movies</button>
      <div *ngFor="let topic of topics">

            <button mat-button (click)="navigateTo(topic)">{{ topic }}</button>

      </div>
    </mat-toolbar>

  `,
  imports: [
    MatToolbar,
    MatButton,
    CommonModule
  ],
  styles: [`
    .spacer {
      flex: 1 1 auto;
    }
  `],
})
export class NavBarComponent implements OnInit {
  topics: string[] = [];

  constructor(private topicService: TopicService, private router: Router) { }

  ngOnInit(): void {
    // Subscribe to the topics observable so that the nav menu updates when new topics are added.
    this.topicService.getTopics$().subscribe(topics => {
      this.topics = topics;
    });
  }

  navigateTo(topic: string): void {
    this.router.navigate(['/topic', topic]);
  }

  navigateToHome(): void {
    this.router.navigate(['/']);  // Assuming '/' is the route for the topic entry page
  }

  navigateToMovies(): void {
    this.router.navigate(['/movies']);
  }
}
