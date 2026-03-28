import { IsEmail, IsIn, IsString, Length, Matches } from 'class-validator';

export class CreateStaffUserDto {
  @IsString()
  @Length(2, 80)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Length(8, 128)
  @Matches(/[A-Za-z]/, {
    message: 'Password must include at least one letter.',
  })
  @Matches(/\d/, {
    message: 'Password must include at least one number.',
  })
  password!: string;

  @IsString()
  @IsIn(['agronomist', 'admin'])
  role!: 'agronomist' | 'admin';
}
