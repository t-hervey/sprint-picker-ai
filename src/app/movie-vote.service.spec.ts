import { TestBed } from '@angular/core/testing';

import { MovieVoteService } from './movie-vote.service';

describe('MovieVoteService', () => {
  let service: MovieVoteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MovieVoteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
