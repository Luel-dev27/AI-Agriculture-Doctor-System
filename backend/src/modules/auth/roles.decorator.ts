import { SetMetadata } from '@nestjs/common';
import { UserEntity } from '../users/users.entity';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: UserEntity['role'][]) =>
  SetMetadata(ROLES_KEY, roles);
