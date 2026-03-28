import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class RegisterDto {
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
}
