import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserAuthService } from '../user-auth.service';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {MatDialogRef} from '@angular/material/dialog';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [
    FormsModule,
    CommonModule
  ]
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private authService: UserAuthService, private router: Router, private dialogRef: MatDialogRef<LoginComponent>) {}

  onLogin() {
    this.authService.signIn(this.username, this.password).subscribe({
      next: (res: any) => {
        // On successful login, close the dialog and navigate home
        this.dialogRef.close();
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.errorMessage = 'Invalid username or password.';
      },
    });
  }
}
