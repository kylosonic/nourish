import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, Matches } from 'class-validator';

export class JoinCoupleDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string'
      ? value.trim().toUpperCase().replace(/[\s-]/g, '')
      : value,
  )
  @Matches(/^[A-Z2-9]{8}$/, {
    message: 'Enter the 8-character couple code.',
  })
  code!: string;
}

export class UpdateCoupleSharingDto {
  @IsOptional()
  @IsBoolean()
  shareCycle?: boolean;

  @IsOptional()
  @IsBoolean()
  shareCheckIns?: boolean;

  @IsOptional()
  @IsBoolean()
  shareFoodStreak?: boolean;
}
