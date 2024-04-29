import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ValidationException } from './validation.exception';

@Catch(ValidationException)
export class ValidationFilter implements ExceptionFilter {
  catch(exception: ValidationException, host: ArgumentsHost): any {
    const ctx = host.switchToHttp(),
      response = ctx.getResponse();

    return response.status(400).json({
      error: 'Bad Request',
      type: 'Validation Errors',
      totals: exception.validationErrors.length,
      statusCode: 400,
      validationErrors: exception.validationErrors,
    });
  }
}
