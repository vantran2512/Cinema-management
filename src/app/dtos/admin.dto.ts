import { IsEmail, IsString, IsEnum } from 'class-validator'
import { AdminRole } from '@shared/constants'

export class CreateAdminDto {
  @IsEmail()
  email: string

  @IsString()
  fullName: string

  @IsEnum(AdminRole)
  role: AdminRole
}

export class UpdateAdminDto {
  @IsString()
  fullName: string

  @IsEnum(AdminRole)
  role: AdminRole
}
