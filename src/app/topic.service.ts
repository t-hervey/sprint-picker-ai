// src/app/topic.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Post {
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class TopicService {
  private topicsSubject: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  private apiBaseUrl = '/api/topics';

  constructor(private http: HttpClient) {
    this.loadTopics();
  }

  // Load topics from the backend API
  private loadTopics(): void {
    this.http.get<string[]>(this.apiBaseUrl)
      .subscribe(topicKeys => this.topicsSubject.next(topicKeys));
  }

  // Returns an observable for the list of topics
  getTopics$(): Observable<string[]> {
    return this.topicsSubject.asObservable();
  }

  // Synchronous getter - note: this may be outdated until next load
  getTopics(): string[] {
    return this.topicsSubject.value;
  }

  // Create a new topic if it doesn't exist
  addTopic(topic: string): Observable<any> {
    return this.http.post(this.apiBaseUrl, { topic })
      .pipe(tap(() => this.loadTopics()));
  }

  // Retrieve posts for a topic
  getPosts(topic: string): Observable<Post[]> {
    const url = `${this.apiBaseUrl}/${encodeURIComponent(topic)}/posts`;
    return this.http.get<Post[]>(url);
  }

  // Add a post to a topic
  addPost(topic: string, post: Post): Observable<any> {
    const url = `${this.apiBaseUrl}/${encodeURIComponent(topic)}/posts`;
    return this.http.post(url, post);
  }
}
