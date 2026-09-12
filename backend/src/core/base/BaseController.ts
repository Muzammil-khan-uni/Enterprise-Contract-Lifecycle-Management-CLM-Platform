import { Request } from 'express';

export abstract class BaseController {
  protected getRequestUser(req: Request) {
    
    return (req as Request & { user?: unknown }).user;
  }
}
