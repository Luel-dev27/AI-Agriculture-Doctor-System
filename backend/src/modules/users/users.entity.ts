export class UserEntity {
  id!: number;
  name!: string;
  email!: string;
  role!: 'farmer' | 'agronomist' | 'admin';
  passwordHash!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
