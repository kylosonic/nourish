import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/** POST /v1/auth/otp — ask for a sign-in code. */
export class RequestOtpDto {
  /** Any accepted spelling; the server normalizes it (AUTH-01). */
  @IsString()
  @MinLength(9)
  @MaxLength(24)
  phone!: string;
}

/** POST /v1/auth/otp/verify — exchange a code for a session. */
export class VerifyOtpDto {
  @IsString()
  @MinLength(9)
  @MaxLength(24)
  phone!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code!: string;
}

/** POST /v1/auth/refresh and /v1/auth/logout. */
export class RefreshTokenDto {
  @IsString()
  @MinLength(20)
  @MaxLength(200)
  refreshToken!: string;
}

/** POST /v1/auth/email/register */
export class RegisterEmailDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayName?: string;
}

/** POST /v1/auth/email/login */
export class LoginEmailDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

/** POST /v1/auth/google */
export class GoogleAuthDto {
  @IsString()
  @MinLength(100)
  @MaxLength(8192)
  idToken!: string;
}

/** POST /v1/auth/firebase — exchange Firebase's phone-auth ID token. */
export class FirebaseAuthDto {
  @IsString()
  @MinLength(100)
  @MaxLength(8192)
  idToken!: string;
}

/** POST /v1/auth/email-otp/request */
export class RequestEmailOtpDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

/** POST /v1/auth/email-otp/verify */
export class VerifyEmailOtpDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code!: string;
}

/** PATCH /v1/account/consent */
export class UpdateConsentDto {
  @IsOptional()
  @IsBoolean()
  healthDataProcessing?: boolean;

  @IsOptional()
  @IsBoolean()
  aiImprovement?: boolean;

  @IsOptional()
  @IsBoolean()
  analytics?: boolean;
}

/** POST /v1/account-deletion-requests */
export class RequestWebDeletionDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(9)
  @MaxLength(24)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
