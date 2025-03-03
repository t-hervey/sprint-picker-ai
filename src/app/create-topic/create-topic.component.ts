// create-topic.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {FormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'app-create-topic',
  standalone: true,
  templateUrl: './create-topic.component.html',
  styleUrls: ['./create-topic.component.css'],
  imports: [
    FormsModule,
    MatInputModule,
    MatButtonModule,
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
