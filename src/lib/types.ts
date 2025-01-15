export interface Question {
  id: string;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  is_answered: boolean;
}

export interface Answer {
  id: string;
  content: string;
  question_id: string;
  user_id: string;
  created_at: string;
  likes: number;
  dislikes: number;
}