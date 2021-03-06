/* eslint-disable @typescript-eslint/ban-types */

export function composeMiddleware<R>(context: R): R;
export function composeMiddleware<A, R>(
  f1: (context: A) => R,
): (context: A) => R;
export function composeMiddleware<A, B, R>(
  f1: (next: (context: B) => R, context: A) => B,
  f2: (context: B) => R,
): (context: A) => R;
export function composeMiddleware<A, B, C, R>(
  f1: (next: (context: B) => C, context: A) => B,
  f2: (next: (context: C) => R, context: B) => C,
  f3: (context: C) => R,
): (context: A) => R;
export function composeMiddleware<A, B, C, D, R>(
  f1: (next: (context: B) => C, context: A) => B,
  f2: (next: (context: C) => D, context: B) => C,
  f3: (next: (context: D) => R, context: C) => D,
  f4: (context: D) => R,
): (context: A) => R;
export function composeMiddleware<R>(
  ...middlewares: Function[]
): (context: unknown) => R;
export function composeMiddleware(...middlewares: Function[]): unknown {
  if (middlewares.length === 1) {
    return middlewares[0];
  }

  return middlewares.reduceRight((composed, next) => (ctx: unknown) => next(composed, ctx));
}

export const combineMiddleware = <A, B, T extends Function[], R extends unknown>(
  ...middleware: T
) => (
  next: (context: B) => R,
  context: A,
): R => composeMiddleware<R>(...middleware, next)(context);

export const branch = <C, R extends unknown, M1 extends Function, M2 extends Function>(
  predicate: (context: C) => boolean | Promise<boolean>,
  middleware1: M1,
  middleware2?: M2,
) => async (next: (context: C) => R, context: C): Promise<R> => {
  if (await predicate(context)) {
    return middleware1(next, context);
  }

  if (middleware2) {
    return middleware2(next, context);
  }

  return next(context);
};
