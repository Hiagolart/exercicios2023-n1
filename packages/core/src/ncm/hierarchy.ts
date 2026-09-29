/**
 * Resolve o pai de cada código como o maior prefixo próprio existente no conjunto.
 *
 * Usar o prefixo existente (e não um comprimento fixo) evita supor que todos os
 * níveis intermediários estejam presentes na fonte: por exemplo, uma subposição
 * de 6 dígitos sem desdobramento de 5 dígitos aponta diretamente para a posição.
 */
export function resolveParents(codes: Iterable<string>): Map<string, string | null> {
  const known = new Set(codes);
  const parents = new Map<string, string | null>();
  for (const code of known) {
    let parent: string | null = null;
    for (let len = code.length - 1; len >= 2; len--) {
      const prefix = code.slice(0, len);
      if (known.has(prefix)) {
        parent = prefix;
        break;
      }
    }
    parents.set(code, parent);
  }
  return parents;
}
