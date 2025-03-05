// src/app/models/user.model.ts
export interface User {
  _id: string;
  username: string;
  // Password is excluded from the model when returning to the client
}
