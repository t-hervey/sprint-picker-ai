// nav-bar.component.ts
import { Component, OnInit } from '@angular/core';
import { TopicService } from '../topic.service';
import { Router } from '@angular/router';
import {MatToolbar, MatToolbarModule} from '@angular/material/toolbar';
import {MatButton, MatButtonModule} from '@angular/material/button';
import {CommonModule} from '@angular/common';
import { MatMenuModule, MatMenuTrigger} from '@angular/material/menu';
import { MatIconModule} from '@angular/material/icon';
import { LoginComponent } from '../login/login.component';
import {MatDialog} from '@angular/material/dialog';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  templateUrl: './nav-bar.component.html',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    CommonModule,
    MatMenuModule,
    MatIconModule,
    MatMenuTrigger
  ],
  styles: [`
    .spacer {
      flex: 1 1 auto;
    }
  `],
})
export class NavBarComponent implements OnInit {
  topics: string[] = [];

  constructor(private topicService: TopicService, private router: Router, private dialog: MatDialog) { }

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

  openLoginDialog(): void {
    this.dialog.open(LoginComponent, {
      width: '300px'
    });
  }
}
