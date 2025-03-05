import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TopicService } from '../topic.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Post {
  url: string;
}

@Component({
  selector: 'app-topic-page',
  templateUrl: './topic-page.component.html',
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
    this.route.paramMap.subscribe(params => {
      const topic = params.get('name') || 'Default';
      this.topicName = topic;
      this.topicService.getPosts(topic).subscribe(posts => {
        this.posts = posts;
      });
    });
  }

  addPost() {
    if (this.newPostUrl.trim()) {
      this.topicService.addPost(this.topicName, { url: this.newPostUrl }).subscribe(() => {
        this.topicService.getPosts(this.topicName).subscribe(posts => {
          this.posts = posts;
        });
      });
      this.newPostUrl = '';
    }
  }

  handleImageError(event: any) {
    // Optionally, set a default image or handle errors here
    event.target.src = 'assets/default-placeholder.png';
  }
}
