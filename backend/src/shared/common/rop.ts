// ROP (Railway Oriented Programming) - Result Type
export type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

export type ResultAsync<T, E = Error> = Promise<Result<T, E>>;

// Helper functions for ROP
export const ok = <T, E = Error>(value: T): Result<T, E> =>
  ({ success: true, value }) as Result<T, E>;
export const err = <T = never, E = Error>(error: E): Result<T, E> =>
  ({ success: false, error }) as Result<T, E>;

// Railway combinators
export const map =
  <T, U, E>(f: (value: T) => U) =>
  (result: Result<T, E>): Result<U, E> =>
    result.success ? ok<U, E>(f(result.value)) : result;

export const flatMap =
  <T, U, E>(f: (value: T) => Result<U, E>) =>
  (result: Result<T, E>): Result<U, E> =>
    result.success ? f(result.value) : result;

export const mapAsync =
  <T, U, E>(f: (value: T) => Promise<U>) =>
  async (result: Result<T, E>): Promise<Result<U, E>> => {
    if (result.success) {
      try {
        return ok<U, E>(await f(result.value));
      } catch (e) {
        return err<U, E>(e as E);
      }
    }
    return result;
  };

export const flatMapAsync =
  <T, U, E>(f: (value: T) => Promise<Result<U, E>>) =>
  async (result: Result<T, E>): Promise<Result<U, E>> => {
    if (result.success) {
      return f(result.value);
    }
    return result;
  };

// Combine multiple results
export const combine = <T, E>(results: Result<T, E>[]): Result<T[], E> => {
  const values: T[] = [];
  for (const result of results) {
    if (!result.success) return result;
    values.push(result.value);
  }
  return ok<T[], E>(values);
};

// Match for handling results
export const match =
  <T, E, U>(onSuccess: (value: T) => U, onError: (error: E) => U) =>
  (result: Result<T, E>): U =>
    result.success ? onSuccess(result.value) : onError(result.error);
