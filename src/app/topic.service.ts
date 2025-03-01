// topic.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Post {
  url: string;
}

const LOCAL_STORAGE_KEY = 'topicAppTopics';

@Injectable({
  providedIn: 'root'
})
export class TopicService {
  private topics: { [key: string]: Post[] } = {};
  private topicsSubject: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

  constructor() {
    // Attempt to load topics from local storage
    const storedTopics = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedTopics) {
      try {
        this.topics = JSON.parse(storedTopics);
      } catch (e) {
        console.error('Error parsing topics from local storage', e);
        this.topics = {};
      }
    }
    this.updateTopics();
  }

  // Update the BehaviorSubject and local storage
  private updateTopics(): void {
    const topicKeys = Object.keys(this.topics);
    this.topicsSubject.next(topicKeys);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.topics));
  }

  // Returns an observable for the list of topics
  getTopics$(): Observable<string[]> {
    return this.topicsSubject.asObservable();
  }

  // Synchronous getter (if needed)
  getTopics(): string[] {
    return Object.keys(this.topics);
  }

  // Create a new topic if it doesn't exist
  addTopic(topic: string): void {
    if (!this.topics[topic]) {
      this.topics[topic] = [];
      this.updateTopics();
    }
  }

  // Retrieve posts for a topic, creating the topic if necessary
  getPosts(topic: string): Post[] {
    if (!this.topics[topic]) {
      this.topics[topic] = [];
      this.updateTopics();
    }
    return this.topics[topic];
  }

  // Add a post to a topic (and update persistence)
  addPost(topic: string, post: Post): void {
    if (!this.topics[topic]) {
      this.topics[topic] = [];
    }
    this.topics[topic].push(post);
    this.updateTopics();
  }
}
