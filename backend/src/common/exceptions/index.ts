import { HttpException, HttpStatus } from '@nestjs/common';

export class ValidationException extends HttpException {
  constructor(message: string, statusCode: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(
      {
        statusCode,
        message,
      },
      statusCode,
    );
  }
}

export class ResourceNotFoundException extends HttpException {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, HttpStatus.NOT_FOUND);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message: string = 'Unauthorized') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message: string = 'Forbidden') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

export class ConflictException extends HttpException {
  constructor(message: string = 'Conflict') {
    super(message, HttpStatus.CONFLICT);
  }
}
