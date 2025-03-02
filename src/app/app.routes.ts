import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CreateTopicComponent } from './create-topic/create-topic.component';
import { TopicPageComponent } from './topic-page/topic-page.component';
import {MoviesComponent} from './movies/movies.component';

export const routes: Routes = [
  { path: '', component: CreateTopicComponent },
  { path: 'topic/:name', component: TopicPageComponent },
  { path: 'movies', component: MoviesComponent },
  { path: '**', redirectTo: '' } // fallback
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
