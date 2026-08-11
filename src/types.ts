export interface Post {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  tag: string;
  cover_url: string;
  seo_title: string;
  seo_description: string;
  published: number;
  created_at: string;
  updated_at: string;
}

export type PostInput = Pick<
  Post,
  "slug" | "title" | "excerpt" | "content" | "tag" | "cover_url" | "seo_title" | "seo_description" | "published"
>;

export interface CaseStudy {
  id: number;
  slug: string;
  title: string;
  summary: string;
  problem: string;
  solution: string;
  result: string;
  stack: string;
  metric: string;
  published: number;
  created_at: string;
  updated_at: string;
}

export type CaseInput = Pick<
  CaseStudy,
  "slug" | "title" | "summary" | "problem" | "solution" | "result" | "stack" | "metric" | "published"
>;

export interface BackupInfo {
  name: string;
  size: number;
  created_at: string;
}
