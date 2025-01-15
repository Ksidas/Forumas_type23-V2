import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, Trash2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Question, Answer } from '@/lib/types';
import { Button } from '@/components/ui/Button';

export function QuestionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [newAnswer, setNewAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<Record<string, 'like' | 'dislike'>>({});

  useEffect(() => {
    loadQuestionAndAnswers();
    loadUserVotes();
  }, [id]);

  async function loadQuestionAndAnswers() {
    try {
      setLoading(true);
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .select('*')
        .eq('id', id)
        .single();

      if (questionError) throw questionError;

      const { data: answers, error: answersError } = await supabase
        .from('answers')
        .select('*')
        .eq('question_id', id)
        .order('created_at', { ascending: true });

      if (answersError) throw answersError;

      setQuestion(question);
      setAnswers(answers || []);
    } catch (error) {
      console.error('Error loading question:', error);
      setError('Failed to load question');
    } finally {
      setLoading(false);
    }
  }

  async function loadUserVotes() {
    try {
      const { data: votes } = await supabase
        .from('votes')
        .select('*')
        .eq('question_id', id);

      const voteMap = (votes || []).reduce((acc, vote) => ({
        ...acc,
        [vote.answer_id]: vote.vote_type,
      }), {});

      setUserVotes(voteMap);
    } catch (error) {
      console.error('Error loading votes:', error);
    }
  }

  async function handleSubmitAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (!newAnswer.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('answers').insert([
        {
          content: newAnswer,
          question_id: id,
        },
      ]);

      if (error) throw error;

      setNewAnswer('');
      loadQuestionAndAnswers();
    } catch (error) {
      console.error('Error submitting answer:', error);
      setError('Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVote(answerId: string, voteType: 'like' | 'dislike') {
    try {
      const currentVote = userVotes[answerId];
      
      if (currentVote === voteType) {
        // Remove vote
        await supabase
          .from('votes')
          .delete()
          .eq('answer_id', answerId);
      } else {
        // Upsert vote
        await supabase
          .from('votes')
          .upsert({
            answer_id: answerId,
            vote_type: voteType,
          });
      }

      loadQuestionAndAnswers();
      loadUserVotes();
    } catch (error) {
      console.error('Error voting:', error);
    }
  }

  async function handleDeleteAnswer(answerId: string) {
    try {
      const { error } = await supabase
        .from('answers')
        .delete()
        .eq('id', answerId);

      if (error) throw error;
      loadQuestionAndAnswers();
    } catch (error) {
      console.error('Error deleting answer:', error);
    }
  }

  async function handleDeleteQuestion() {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      navigate('/');
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error || !question) {
    return <div className="text-center py-8 text-red-600">{error || 'Question not found'}</div>;
  }

  const session = supabase.auth.getSession();
  const isQuestionOwner = session?.user?.id === question.user_id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Questions
      </button>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex justify-between items-start">
          <h1 className="text-2xl font-bold mb-4">{question.title}</h1>
          {isQuestionOwner && (
            <Button
              variant="secondary"
              onClick={handleDeleteQuestion}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
        <p className="text-gray-700 mb-4">{question.content}</p>
        <div className="text-sm text-gray-500">
          Posted on {new Date(question.created_at).toLocaleDateString()}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
        </h2>

        <div className="space-y-6">
          {answers.map((answer) => (
            <div
              key={answer.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <p className="text-gray-700 mb-4">{answer.content}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleVote(answer.id, 'like')}
                    className={`flex items-center gap-1 ${
                      userVotes[answer.id] === 'like'
                        ? 'text-green-600'
                        : 'text-gray-500 hover:text-green-600'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>{answer.likes}</span>
                  </button>
                  <button
                    onClick={() => handleVote(answer.id, 'dislike')}
                    className={`flex items-center gap-1 ${
                      userVotes[answer.id] === 'dislike'
                        ? 'text-red-600'
                        : 'text-gray-500 hover:text-red-600'
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                    <span>{answer.dislikes}</span>
                  </button>
                </div>
                {session?.user?.id === answer.user_id && (
                  <Button
                    variant="secondary"
                    onClick={() => handleDeleteAnswer(answer.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Your Answer</h3>
        <form onSubmit={handleSubmitAnswer}>
          <textarea
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 mb-4"
            placeholder="Write your answer here..."
            required
          />
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Posting...' : 'Post Answer'}
          </Button>
        </form>
      </div>
    </div>
  );
}