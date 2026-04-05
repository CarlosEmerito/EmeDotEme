// Aquí puedes definir tipos y interfaces relacionados con artículos para mantener el código organizado.

export interface ArticleDTO {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content: string;
  imageUrl?: string;
  author: string;
  published: boolean;
  isOriginal: boolean;
  tags: string[];
  sentiment: string;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}
