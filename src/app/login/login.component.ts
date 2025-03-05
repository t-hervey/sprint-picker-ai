import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserAuthService } from '../user-auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private authService: UserAuthService, private router: Router) {}

  onLogin() {
    this.authService.signIn(this.username, this.password).subscribe({
      next: (res: any) => {
        // Login is successful; navigate to home or topics page
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.errorMessage = 'Invalid username or password.';
      },
    });
  }
}
