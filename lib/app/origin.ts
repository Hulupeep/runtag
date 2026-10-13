// APP-001: tag URLs are printed onto stickers, so they only ever use the canonical origin.
export const TAG_ORIGIN = 'https://runtag.vercel.app'

export function tagUrl(id: string): string {
  return `${TAG_ORIGIN}/t/${id}`
}
