export interface Category {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Wine {
  id: string;
  name: string;
  category_id: string;
  region: string;
  altitude: string;
  score: string;
  vintage: string;
  description: string;
  rationale: string;
  winemaker: string;
  color: string;
  image_url: string | null;
  sort_order: number;
  created_at: string;
  // Joined
  category?: Category;
}
