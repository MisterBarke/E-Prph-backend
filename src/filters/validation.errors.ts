import { ValidationError } from 'class-validator';
import { ValidationException } from './validation.exception';

export function validationError(errors: ValidationError[]) {
  const messages = errors.map((error) => {
    let message = '';
    for (const fieldError in error.constraints) {
      message = message + error.constraints[fieldError] + ', ';
    }
    return {
      [error.property]: error.value + ' : ' + message,
    };
  });
  return new ValidationException(messages);
}
