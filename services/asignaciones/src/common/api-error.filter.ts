import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

type ErrorResponseBody = {
  statusCode?: number;
  error?: string;
  message?: string | string[];
  validationErrors?: Record<string, string>;
};

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<{ url?: string }>();
    const response = ctx.getResponse<{
      status: (statusCode: number) => { json: (body: unknown) => void };
    }>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const body = exception instanceof HttpException
      ? this.normalizeHttpException(exception)
      : {
          error: 'Internal Server Error',
          message: 'Error interno del servidor',
          validationErrors: null,
        };

    response.status(status).json({
      timestamp: new Date().toISOString(),
      status,
      error: body.error ?? this.reasonPhrase(status),
      message: body.message,
      path: request.url ?? '',
      validationErrors: body.validationErrors ?? null,
    });
  }

  private normalizeHttpException(exception: HttpException) {
    const response = exception.getResponse();

    if (typeof response === 'string') {
      return {
        error: this.reasonPhrase(exception.getStatus()),
        message: response,
        validationErrors: null,
      };
    }

    const body = response as ErrorResponseBody;
    const message = Array.isArray(body.message)
      ? body.message.join('; ')
      : body.message ?? exception.message;

    return {
      error: body.error ?? this.reasonPhrase(exception.getStatus()),
      message,
      validationErrors: body.validationErrors ?? null,
    };
  }

  private reasonPhrase(status: number) {
    const phrase = HttpStatus[status];
    if (!phrase) return 'Error';

    return phrase
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
