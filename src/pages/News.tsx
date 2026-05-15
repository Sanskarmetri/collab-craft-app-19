import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Newspaper, BookOpen, Star, Tag, Brain, Loader2, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Article {
  headline: string;
  summary: string;
  category: string;
  keyTerms: string[];
  relevantPaper: string;
  importance: 'high' | 'medium';
}

const newspapers = [
  {
    id: 'the_hindu',
    name: 'The Hindu',
    description: 'India\'s most trusted source for UPSC current affairs',
    color: 'from-blue-600 to-blue-800',
    icon: '📰',
  },
  {
    id: 'indian_express',
    name: 'The Indian Express',
    description: 'In-depth analysis and editorials for IAS preparation',
    color: 'from-red-600 to-red-800',
    icon: '📄',
  },
];

const categoryColors: Record<string, string> = {
  Polity: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  IR: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Economy: 'bg-green-500/20 text-green-400 border-green-500/30',
  Science: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  Environment: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Social: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Security: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function News() {
  const navigate = useNavigate();
  const [selectedPaper, setSelectedPaper] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [date, setDate] = useState('');
  const { toast } = useToast();

  const fetchNews = async (newspaperId: string) => {
    setSelectedPaper(newspaperId);
    setLoading(true);
    setArticles([]);

    try {
      const { data, error } = await supabase.functions.invoke('fetch-upsc-news', {
        body: { newspaper: newspaperId },
      });

      if (error) throw error;
      setArticles(data.articles || []);
      setDate(data.date || '');
    } catch (err: any) {
      console.error('Error fetching news:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch news. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateNewsQuiz = async () => {
    if (articles.length === 0) return;
    setQuizLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-news-quiz', {
        body: { articles, numberOfQuestions: 10 },
      });
      if (error) throw error;
      toast({ title: 'Quiz Ready!', description: `${data.totalQuestions} questions generated from today's news.` });
      navigate('/quiz', { state: { newsQuizAttempt: data } });
    } catch (err: any) {
      console.error('Error generating news quiz:', err);
      toast({ title: 'Error', description: 'Failed to generate quiz. Please try again.', variant: 'destructive' });
    } finally {
      setQuizLoading(false);
    }
  };
  const paperInfo = newspapers.find((p) => p.id === selectedPaper);



  return (
    <AppLayout>
      <div className="space-y-6">
        {!selectedPaper ? (
          <>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Newspaper className="h-8 w-8 text-primary" />
                UPSC Daily News
              </h1>
              <p className="text-muted-foreground mt-1">
                AI-curated UPSC-relevant news from top newspapers
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {newspapers.map((paper) => (
                <Card
                  key={paper.id}
                  className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] overflow-hidden group"
                  onClick={() => fetchNews(paper.id)}
                >
                  <div className={`h-2 bg-gradient-to-r ${paper.color}`} />
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{paper.icon}</span>
                      <div>
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {paper.name}
                        </CardTitle>
                        <CardDescription>{paper.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Read Today's UPSC News
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-muted-foreground">
                <p className="text-sm">
                  💡 News is AI-curated and focused on UPSC-relevant topics including Polity,
                  Economy, IR, Science, Environment, and more. Updated daily.
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setSelectedPaper(null)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    {paperInfo?.icon} {paperInfo?.name}
                  </h1>
                  {date && (
                    <p className="text-sm text-muted-foreground">{date} — UPSC Relevant News</p>
                  )}
                </div>
              </div>
              {articles.length > 0 && !loading && (
                <Button onClick={generateNewsQuiz} disabled={quizLoading} className="shrink-0">
                  {quizLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Brain className="mr-2 h-4 w-4" />
                  )}
                  {quizLoading ? 'Generating...' : 'Quiz from News'}
                </Button>
              )}
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/4 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6 mt-2" />
                      <Skeleton className="h-4 w-2/3 mt-2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : articles.length > 0 ? (
              <div className="space-y-4">
                {articles.map((article, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div
                      className={`h-1 ${
                        article.importance === 'high'
                          ? 'bg-yellow-500'
                          : 'bg-muted-foreground/30'
                      }`}
                    />
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base leading-snug">
                          {article.importance === 'high' && (
                            <Star className="inline h-4 w-4 text-yellow-500 mr-1 -mt-0.5" />
                          )}
                          {article.headline}
                        </CardTitle>
                      </div>
                      <div className="flex gap-2 flex-wrap mt-1">
                        <Badge
                          variant="outline"
                          className={categoryColors[article.category] || ''}
                        >
                          {article.category}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {article.relevantPaper}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {article.summary}
                      </p>
                      <div className="flex items-center gap-1 flex-wrap">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        {article.keyTerms?.map((term, j) => (
                          <Badge key={j} variant="outline" className="text-xs">
                            {term}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No articles found. Please try again.
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
