/** A calm, practical estimate based on a 200 word-per-minute reading pace. */
export function estimateReadingTime(content: string): string {
  const plain = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_>#~]/g, " ");
  const words = plain.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu)?.length ?? 0;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}
