/*
  # Forum Initial Schema Setup

  1. Tables
    - questions
      - id (uuid, primary key)
      - title (text)
      - content (text)
      - user_id (uuid, references auth.users)
      - created_at (timestamp)
      - is_answered (boolean)
      
    - answers
      - id (uuid, primary key)
      - content (text)
      - question_id (uuid, references questions)
      - user_id (uuid, references auth.users)
      - created_at (timestamp)
      - likes (integer)
      - dislikes (integer)

  2. Security
    - Enable RLS on all tables
    - Add policies for CRUD operations
*/

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_answered boolean DEFAULT false
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Questions policies
CREATE POLICY "Anyone can view questions"
  ON questions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create questions"
  ON questions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own questions"
  ON questions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Answers table
CREATE TABLE IF NOT EXISTS answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  question_id uuid REFERENCES questions ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  likes integer DEFAULT 0,
  dislikes integer DEFAULT 0
);

ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Answers policies
CREATE POLICY "Anyone can view answers"
  ON answers
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create answers"
  ON answers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own answers"
  ON answers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Votes table for tracking user votes on answers
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id uuid REFERENCES answers ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users NOT NULL,
  vote_type text CHECK (vote_type IN ('like', 'dislike')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(answer_id, user_id)
);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can vote"
  ON votes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);