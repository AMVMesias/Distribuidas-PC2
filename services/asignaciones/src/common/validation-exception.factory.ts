import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

export function validationExceptionFactory(errors: ValidationError[]) {
  return new BadRequestException({
    message: 'Solicitud inválida',
    validationErrors: flattenValidationErrors(errors),
  });
}

function flattenValidationErrors(errors: ValidationError[], parentPath = ''): Record<string, string> {
  return errors.reduce<Record<string, string>>((acc, error) => {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;

    if (error.constraints) {
      acc[path] = Object.values(error.constraints)[0];
    }

    if (error.children?.length) {
      Object.assign(acc, flattenValidationErrors(error.children, path));
    }

    return acc;
  }, {});
}
