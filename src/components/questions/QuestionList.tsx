import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquarePlus, MessageSquare, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Question } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { CreateQuestionDialog } from './CreateQuestionDialog';

export function QuestionList() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filter, setFilter] = useState<'all' | 'answered' | 'unanswered'>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestions();
  }, [filter]);

  async function loadQuestions() {
    try {
      setLoading(true);
      let query = supabase.from('questions').select('*').order('created_at', { ascending: false });
      
      if (filter === 'answered') {
        query = query.eq('is_answered', true);
      } else if (filter === 'unanswered') {
        query = query.eq('is_answered', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'secondary'}
            onClick={() => setFilter('all')}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            All Questions
          </Button>
          <Button
            variant={filter === 'answered' ? 'primary' : 'secondary'}
            onClick={() => setFilter('answered')}
          >
            <Check className="w-4 h-4 mr-2" />
            Answered
          </Button>
          <Button
            variant={filter === 'unanswered' ? 'primary' : 'secondary'}
            onClick={() => setFilter('unanswered')}
          >
            <X className="w-4 h-4 mr-2" />
            Unanswered
          </Button>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <MessageSquarePlus className="w-4 h-4 mr-2" />
          Ask Question
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading questions...</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No questions found. Be the first to ask one!
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <div
              key={question.id}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-blue-500 transition-colors"
            >
              <h3 className="text-xl font-semibold mb-2">
                <Link to={`/question/${question.id}`} className="hover:text-blue-600">
                  {question.title}
                </Link>
              </h3>
              <p className="text-gray-600 mb-4 line-clamp-2">{question.content}</p>
              <div className="flex items-center text-sm text-gray-500">
                <span className="flex items-center">
                  {question.is_answered ? (
                    <Check className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <X className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  {question.is_answered ? 'Answered' : 'Unanswered'}
                </span>
                <span className="mx-2">•</span>
                <span>{new Date(question.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateQuestionDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onQuestionCreated={loadQuestions}
      />
    </div>
  );
}