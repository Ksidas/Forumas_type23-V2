/*
  # Fix Questions RLS Policies

  1. Changes
    - Drop existing policies
    - Create new, more permissive policies for questions table
  2. Security
    - Allow authenticated users to insert with any user_id
    - Allow public read access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view questions" ON questions;
DROP POLICY IF EXISTS "Authenticated users can create questions" ON questions;
DROP POLICY IF EXISTS "Users can delete their own questions" ON questions;

-- Create new policies
CREATE POLICY "Anyone can view questions"
  ON questions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create questions"
  ON questions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can delete their own questions"
  ON questions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);