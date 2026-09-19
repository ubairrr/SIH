// STUB — RED phase. Real implementation lands in the GREEN commit.
export const ALLOWED_MIME_BY_TYPE: Record<string, string[]> = {};

export type DetectAndValidateResult = {
  ok: boolean;
  detectedMime: string | null;
};

export async function detectAndValidate(
  _buffer: Buffer,
  _typeKey: string,
): Promise<DetectAndValidateResult> {
  throw new Error("not implemented");
}
