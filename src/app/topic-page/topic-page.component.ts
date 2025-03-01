// topic-page.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TopicService } from '../topic.service';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';

interface Post {
  url: string;
}

@Component({
  selector: 'app-topic-page',
  templateUrl : './topic-page.component.html',
  imports: [
    FormsModule, CommonModule
  ],
  styleUrls: ['./topic-page.component.css']
})
export class TopicPageComponent implements OnInit {
  topicName: string = '';
  newPostUrl = '';
  posts: Post[] = [];

  constructor(private route: ActivatedRoute, private topicService: TopicService) { }

  ngOnInit() {
    this.topicName = this.route.snapshot.paramMap.get('name') || 'Default';
    this.posts = this.topicService.getPosts(this.topicName);
  }

  addPost() {
    if (this.newPostUrl.trim()) {
      this.topicService.addPost(this.topicName, { url: this.newPostUrl });
      this.posts = this.topicService.getPosts(this.topicName);
      this.newPostUrl = '';
    }
  }

  handleImageError(event: any) {
    // Optionally, set a default image or handle errors here
    event.target.src = 'assets/default-placeholder.png';
  }
}
