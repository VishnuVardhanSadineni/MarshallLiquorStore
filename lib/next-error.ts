// Server actions signal redirects and notFound() by throwing errors with
// a special `digest` string. When you `await` an action from a client
// transition, those errors propagate as rejected promises. Re-throw them
// so Next.js's own runtime can handle the navigation.

export function isRedirectError(err: unknown): boolean {
  return (
    !!err &&
    typeof err === "object" &&
    "digest" in err &&
    typeof (err as { digest: unknown }).digest === "string" &&
    (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export function isNotFoundError(err: unknown): boolean {
  return (
    !!err &&
    typeof err === "object" &&
    "digest" in err &&
    (err as { digest: unknown }).digest === "NEXT_NOT_FOUND"
  );
}

export function isNextControlFlowError(err: unknown): boolean {
  return isRedirectError(err) || isNotFoundError(err);
}
