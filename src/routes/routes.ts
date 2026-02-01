/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import { fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AuthController } from './../controllers/auth.controller';
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';
import jwt from 'jsonwebtoken';

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
  'Record_string.unknown_': {
    dataType: 'refAlias',
    type: {
      dataType: 'nestedObjectLiteral',
      nestedProperties: {},
      additionalProperties: { dataType: 'any' },
      validators: {},
    },
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  SendCodeResponse: {
    dataType: 'refObject',
    properties: {
      success: { dataType: 'enum', enums: [true], required: true },
      data: { ref: 'Record_string.unknown_' },
      message: { dataType: 'string', required: true },
    },
    additionalProperties: true,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  ErrorResponse: {
    dataType: 'refObject',
    properties: {
      success: { dataType: 'enum', enums: [false], required: true },
      message: { dataType: 'string', required: true },
    },
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  IUserDTO: {
    dataType: 'refObject',
    properties: {
      role: { dataType: 'string', required: true },
      name: { dataType: 'string', required: true },
      email: { dataType: 'string', required: true },
      isNewUser: { dataType: 'boolean', required: true },
      isPremium: { dataType: 'boolean' },
      premiumPlan: {
        dataType: 'union',
        subSchemas: [
          { dataType: 'enum', enums: ['basic'] },
          { dataType: 'enum', enums: ['premium'] },
          { dataType: 'enum', enums: ['enterprise'] },
        ],
      },
      subscriptionActive: { dataType: 'boolean' },
      id: { dataType: 'string', required: true },
    },
    additionalProperties: true,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  VerifyCodeResponse: {
    dataType: 'refObject',
    properties: {
      success: { dataType: 'enum', enums: [true], required: true },
      data: { ref: 'IUserDTO', required: true },
      message: { dataType: 'string', required: true },
    },
    additionalProperties: true,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  IsAuthenticatedResponse: {
    dataType: 'refObject',
    properties: {
      success: { dataType: 'boolean', required: true },
      data: { ref: 'IUserDTO', required: true },
      message: { dataType: 'string', required: true },
    },
    additionalProperties: true,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  LogoutResponse: {
    dataType: 'refObject',
    properties: {
      success: { dataType: 'enum', enums: [true], required: true },
      message: { dataType: 'string', required: true },
    },
    additionalProperties: true,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {
  noImplicitAdditionalProperties: 'ignore',
  bodyCoercion: true,
});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

export function RegisterRoutes(app: Router) {
  // ###########################################################################################################
  //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
  //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
  // ###########################################################################################################

  const argsAuthController_sendEmailCode: Record<string, TsoaRoute.ParameterSchema> = {
    requestBody: {
      in: 'body',
      name: 'requestBody',
      required: true,
      dataType: 'nestedObjectLiteral',
      nestedProperties: {
        role: {
          dataType: 'union',
          subSchemas: [
            { dataType: 'enum', enums: ['guest'] },
            { dataType: 'enum', enums: ['host'] },
          ],
          required: true,
        },
        email: { dataType: 'string', required: true },
      },
    },
  };
  app.post(
    '/api/auth/send-code',
    ...fetchMiddlewares<RequestHandler>(AuthController),
    ...fetchMiddlewares<RequestHandler>(AuthController.prototype.sendEmailCode),

    async function AuthController_sendEmailCode(
      request: ExRequest,
      response: ExResponse,
      next: any
    ) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsAuthController_sendEmailCode,
          request,
          response,
        });

        const controller = new AuthController();

        await templateService.apiHandler({
          methodName: 'sendEmailCode',
          controller,
          response,
          next,
          validatedArgs,
          successStatus: 200,
        });
      } catch (err) {
        return next(err);
      }
    }
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  const argsAuthController_verifyEmailCode: Record<string, TsoaRoute.ParameterSchema> = {
    body: {
      in: 'body',
      name: 'body',
      required: true,
      dataType: 'nestedObjectLiteral',
      nestedProperties: {
        role: {
          dataType: 'union',
          subSchemas: [
            { dataType: 'enum', enums: ['guest'] },
            { dataType: 'enum', enums: ['host'] },
          ],
          required: true,
        },
        code: { dataType: 'string', required: true },
        email: { dataType: 'string', required: true },
      },
    },
  };
  app.post(
    '/api/auth/verify-code',
    ...fetchMiddlewares<RequestHandler>(AuthController),
    ...fetchMiddlewares<RequestHandler>(AuthController.prototype.verifyEmailCode),

    async function AuthController_verifyEmailCode(
      request: ExRequest,
      response: ExResponse,
      next: any
    ) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsAuthController_verifyEmailCode,
          request,
          response,
        });

        const controller = new AuthController();

        await templateService.apiHandler({
          methodName: 'verifyEmailCode',
          controller,
          response,
          next,
          validatedArgs,
          successStatus: 200,
        });
      } catch (err) {
        return next(err);
      }
    }
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  const argsAuthController_isAuthenticated: Record<string, TsoaRoute.ParameterSchema> = {
    req: { in: 'request', name: 'req', required: true, dataType: 'object' },
  };
  app.post(
    '/api/auth/is-authenticated',
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares<RequestHandler>(AuthController),
    ...fetchMiddlewares<RequestHandler>(AuthController.prototype.isAuthenticated),

    async function AuthController_isAuthenticated(
      request: ExRequest,
      response: ExResponse,
      next: any
    ) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsAuthController_isAuthenticated,
          request,
          response,
        });

        const controller = new AuthController();

        await templateService.apiHandler({
          methodName: 'isAuthenticated',
          controller,
          response,
          next,
          validatedArgs,
          successStatus: 200,
        });
      } catch (err) {
        return next(err);
      }
    }
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  const argsAuthController_logout: Record<string, TsoaRoute.ParameterSchema> = {
    req: { in: 'request', name: 'req', required: true, dataType: 'object' },
  };
  app.post(
    '/api/auth/logout',
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares<RequestHandler>(AuthController),
    ...fetchMiddlewares<RequestHandler>(AuthController.prototype.logout),

    async function AuthController_logout(request: ExRequest, response: ExResponse, next: any) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsAuthController_logout,
          request,
          response,
        });

        const controller = new AuthController();

        await templateService.apiHandler({
          methodName: 'logout',
          controller,
          response,
          next,
          validatedArgs,
          successStatus: 200,
        });
      } catch (err) {
        return next(err);
      }
    }
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

  function authenticateMiddleware(security: TsoaRoute.Security[] = []) {
    return async function runAuthenticationMiddleware(request: any, response: any, next: any) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      // keep track of failed auth attempts so we can hand back the most
      // recent one.  This behavior was previously existing so preserving it
      // here
      const failedAttempts: any[] = [];
      const pushAndRethrow = (error: any) => {
        failedAttempts.push(error);
        throw error;
      };

      const secMethodOrPromises: Promise<any>[] = [];
      for (const secMethod of security) {
        if (Object.keys(secMethod).length > 1) {
          const secMethodAndPromises: Promise<any>[] = [];

          for (const name in secMethod) {
            secMethodAndPromises.push(
              expressAuthenticationRecasted(request, name, secMethod[name], response).catch(
                pushAndRethrow
              )
            );
          }

          // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

          secMethodOrPromises.push(
            Promise.all(secMethodAndPromises).then(users => {
              return users[0];
            })
          );
        } else {
          for (const name in secMethod) {
            secMethodOrPromises.push(
              expressAuthenticationRecasted(request, name, secMethod[name], response).catch(
                pushAndRethrow
              )
            );
          }
        }
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      try {
        request['user'] = await Promise.race(secMethodOrPromises);

        // Response was sent in middleware, abort
        if (response.writableEnded) {
          return;
        }

        next();
      } catch (err) {
        // Show most recent error as response
        const error = failedAttempts.pop();
        error.status = error.status || 401;

        // Response was sent in middleware, abort
        if (response.writableEnded) {
          return;
        }
        next(error);
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    };
  }

  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

async function expressAuthenticationRecasted(
  request: any,
  name: string,
  scopes: string[],
  response: any
): Promise<any> {
  // Example implementation for JWT authentication
  if (name === 'jwt') {
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('No authorization token provided');
      (error as any).status = 401;
      throw error;
    }
    const token = authHeader.split(' ')[1];
    // Replace with your JWT verification logic
    try {
      // Use your JWT secret or public key here
      const secret = process.env.JWT_SECRET || 'your_jwt_secret';
      const user = jwt.verify(token, secret);
      // Optionally check scopes/roles here
      return user;
    } catch (err) {
      (err as any).status = 401;
      throw err;
    }
  }
  // If other auth methods are needed, implement them here
  const error = new Error(`Unknown authentication method: ${name}`);
  (error as any).status = 401;
  throw error;
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
