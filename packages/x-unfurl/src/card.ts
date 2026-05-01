export interface XStatusCard {
  kind: 'x_status'
  url: string
  id: string
  text: string
  authorScreenName: string
  authorName: string
  authorAvatarUrl: string | null
  authorVerified: boolean
  replies: number
  retweets: number
  likes: number
  bookmarks: number
  quotes: number
  views: number | null
  createdAt: string | null
}

export function isXCardKind(s: string | null | undefined): boolean {
  return s === 'x_status'
}
