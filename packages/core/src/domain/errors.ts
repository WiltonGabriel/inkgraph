export type InkGraphErrorCode =
  | "not_found"
  | "conflict"
  | "validation"
  | "ambiguous"
  | "canon_violation"
  | "unauthorized";

export class InkGraphError extends Error {
  public readonly code: InkGraphErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: InkGraphErrorCode,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "InkGraphError";
    this.code = code;
    this.details = details;
  }
}
