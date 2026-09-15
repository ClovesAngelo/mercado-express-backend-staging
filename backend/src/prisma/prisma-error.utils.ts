import { ConflictException, NotFoundException } from '@nestjs/common';

/**
 * Extrai o código de erro do Prisma de forma compatível com os mocks usados
 * nos testes (que lançam objetos simples `{ code: 'P2002' }`).
 */
export function getPrismaErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

/** Verifica se o erro é um PrismaClientKnownRequestError com o código informado. */
export function isPrismaError(error: unknown, code: string): boolean {
  return getPrismaErrorCode(error) === code;
}

/**
 * Reconverte erros conhecidos do Prisma em HttpException adequadas:
 * - P2025 (registro não encontrado) -> NotFoundException (404)
 * - P2002 (violação de unicidade)    -> ConflictException (409)
 * Qualquer outro erro é relançado inalterado.
 */
export function rethrowPrismaError(
  error: unknown,
  options: { notFoundMessage?: string; conflictMessage?: string },
): never {
  if (options.notFoundMessage && isPrismaError(error, 'P2025')) {
    throw new NotFoundException(options.notFoundMessage);
  }
  if (options.conflictMessage && isPrismaError(error, 'P2002')) {
    throw new ConflictException(options.conflictMessage);
  }
  if (error instanceof Error) throw error;
  throw new Error(String(error));
}
