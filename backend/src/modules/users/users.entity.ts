export class UserEntity {
  id!: number;
  name!: string;
  email!: string;
  role!: 'farmer' | 'agronomist' | 'admin';
  passwordHash!: string;
  sessionVersion!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
