/** Error codes exposed in the v1 error envelope (blueprint §8). */
export enum ErrorCode {
  FOOD_NOT_FOUND = 'FOOD_NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL = 'INTERNAL',
}
