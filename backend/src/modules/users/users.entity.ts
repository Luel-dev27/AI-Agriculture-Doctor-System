export class UserEntity {
  id!: number;
  name!: string;
  email!: string;
  passwordHash!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
