import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import e, { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let exceptionName = 'InternalServerError';
    let stack = '';
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseContent = exception.getResponse();
      console.log(responseContent);

      if (typeof responseContent === 'object' && responseContent !== null) {
        // If it's the class-validator default array error response, extract it cleanly
        const message = (responseContent as any).error;
        exceptionName = Array.isArray(message) ? message.join(', ') : String(message);
      } else {
        exceptionName = String(responseContent);
      }
      stack = exception.stack || '';
    } else if (exception instanceof Error) {
      console.log(exception);
      let customMessage = 'CUSTOM_MESSAGE_EXCEPTION';
      if (exception.message.includes('this.prisma.user.findUnique()')) {
        customMessage = 'UserNotFoundException';
      }
      exceptionName = customMessage || exception.name || exception.constructor.name;
      stack = exception.stack || '';
    } else {
      exceptionName = String(exception);
    }

    // Append to api_error_logs.txt
    if (stack) {
      const logMessage = `[${new Date().toISOString()}] ${request.method} ${request.url}\n${stack}\n\n`;
      try {
        fs.appendFileSync(path.join(process.cwd(), 'api_error_logs.txt'), logMessage);
      } catch (err) {
        console.error('Failed to write exception to log file', err);
      }
    }

    response.status(status).json({
      statusCode: String(status),
      exceptionName: exceptionName,
      path: request.url,
      date: new Date().toISOString(),
    });
  }
}
