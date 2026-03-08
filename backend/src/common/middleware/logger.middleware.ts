import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('Request');

  use(req: Request, res: Response, next: NextFunction): void {
    const { ip, method, originalUrl } = req;
    res.on('finish', () => {
      this.logger.verbose(`${method} ${originalUrl} ${res.statusCode} - ${ip}`);
    });
    next();
  }
}
