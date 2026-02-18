import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Observable, switchMap } from 'rxjs';

export class RestResponseInterceptor<
  T extends object,
> implements NestInterceptor<any, T> {
  constructor(private readonly dto: new () => T) {}

  intercept(_context: ExecutionContext, next: CallHandler<any>): Observable<T> {
    return next.handle().pipe(
      switchMap(async (data) => {
        const tranformedData = plainToInstance(
          this.dto,
          instanceToPlain(data),
          { excludeExtraneousValues: true },
        );
        const errors = await validate(tranformedData);
        if (errors.length > 1) {
          throw new BadRequestException({
            message: 'Response validation failed.',
            errors,
          });
        }
        return tranformedData;
      }),
    );
  }
}
