// create-topic.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-create-topic',
  templateUrl: './create-topic.component.html',
  imports: [
    FormsModule
  ]
})
export class CreateTopicComponent {
  topicName = '';

  constructor(private router: Router) {}

  createTopic() {
    // Navigate to the topic page with the given name
    if(this.topicName.trim()){
      this.router.navigate(['/topic', this.topicName]);
    }
  }
}
