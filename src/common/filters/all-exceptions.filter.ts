import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
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
    let message = '';
    let stack = '';
    if (exception instanceof HttpException) {
      message = exception.toString();
      status = exception.getStatus();
      const responseContent = exception.getResponse();
      console.log(responseContent);

      const constructorName = exception.constructor.name;
      if (constructorName === 'ThemeNotFoundException') {
        exceptionName = 'ThemeNotFoundException';
      } else if (typeof responseContent === 'object' && responseContent !== null) {
        const errorMsg = (responseContent as any).message;
        const messages = Array.isArray(errorMsg) ? errorMsg : [String(errorMsg)];
        const hasThemeError = messages.some((msg) => msg && msg.includes('theme must be one of the following values'));

        if (hasThemeError) {
          exceptionName = 'ThemeNotFoundException';
          status = HttpStatus.NOT_FOUND;
        } else {
          const responseString = (responseContent as any).error;
          const responseMessage = (responseContent as any).message;
          exceptionName = Array.isArray(responseString) ? responseString.join(', ') : String(responseString);
          message = Array.isArray(responseMessage) ? responseMessage.join(', ') : String(responseMessage);
        }
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
      message = exception.toString();
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
      message: message,
      path: request.url,
      date: new Date().toISOString(),
    });
  }
}
