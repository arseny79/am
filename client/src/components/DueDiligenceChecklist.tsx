/**
 * Due Diligence Checklist Component
 * Comprehensive checklist with Q&A threads for deal due diligence
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  MessageSquare, 
  FileText, 
  AlertCircle,
  Send,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface DueDiligenceChecklistProps {
  dealId: number;
}

export function DueDiligenceChecklist({ dealId }: DueDiligenceChecklistProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [questionText, setQuestionText] = useState('');
  const [answerText, setAnswerText] = useState('');
  
  const { data: items, isLoading, refetch } = trpc.dueDiligence.getItems.useQuery({ dealId });
  const { data: progress } = trpc.dueDiligence.getProgress.useQuery({ dealId });
  const { data: questions } = trpc.dueDiligence.getDealQuestions.useQuery({ dealId });
  
  const updateStatusMutation = trpc.dueDiligence.updateItemStatus.useMutation({
    onSuccess: () => {
      toast.success('Status updated');
      refetch();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
  
  const askQuestionMutation = trpc.dueDiligence.askQuestion.useMutation({
    onSuccess: () => {
      toast.success('Question posted');
      setQuestionText('');
      refetch();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
  
  const answerQuestionMutation = trpc.dueDiligence.answerQuestion.useMutation({
    onSuccess: () => {
      toast.success('Answer posted');
      setAnswerText('');
      refetch();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
  
  const initializeMutation = trpc.dueDiligence.initializeChecklist.useMutation({
    onSuccess: () => {
      toast.success('Checklist initialized');
      refetch();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Initialize checklist if empty
  if (!items || items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Due Diligence Checklist</CardTitle>
          <CardDescription>
            Initialize the due diligence checklist to track required documents and information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => initializeMutation.mutate({ dealId })}
            disabled={initializeMutation.isPending}
          >
            {initializeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Initialize Checklist (50 Items)
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Group items by category
  const categories = Array.from(new Set(items.map(item => item.category)));
  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.category === selectedCategory);
  
  // Get status icon and color
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle2, color: 'text-green-500', label: 'Completed' };
      case 'in_progress':
        return { icon: Clock, color: 'text-blue-500', label: 'In Progress' };
      case 'requested':
        return { icon: AlertCircle, color: 'text-yellow-500', label: 'Requested' };
      case 'waived':
        return { icon: Circle, color: 'text-gray-400', label: 'Waived' };
      default:
        return { icon: Circle, color: 'text-gray-300', label: 'Pending' };
    }
  };
  
  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Get item questions
  const getItemQuestions = (itemId: number) => {
    return questions?.filter(q => q.itemId === itemId) || [];
  };
  
  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Due Diligence Progress</CardTitle>
          <CardDescription>
            Track completion of required documents and information requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span className="font-semibold">{progress?.completed || 0} / {progress?.total || 0}</span>
              </div>
              <Progress value={progress?.percentage || 0} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Required Items</span>
                <span className="font-semibold">{progress?.requiredCompleted || 0} / {progress?.required || 0}</span>
              </div>
              <Progress value={progress?.requiredPercentage || 0} className="h-2" />
            </div>
            
            {/* Category breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {Object.entries(progress?.byCategory || {}).map(([category, stats]: [string, any]) => (
                <div key={category} className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground capitalize">{category}</div>
                  <div className="text-lg font-semibold">{stats.completed}/{stats.total}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Checklist Items */}
      <Card>
        <CardHeader>
          <CardTitle>Checklist Items</CardTitle>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              {categories.map(category => (
                <TabsTrigger key={category} value={category} className="capitalize">
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {filteredItems.map((item) => {
              const statusDisplay = getStatusDisplay(item.status);
              const StatusIcon = statusDisplay.icon;
              const itemQuestions = getItemQuestions(item.id);
              
              return (
                <AccordionItem key={item.id} value={`item-${item.id}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 w-full">
                      <StatusIcon className={`w-5 h-5 ${statusDisplay.color}`} />
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.itemName}</span>
                          {item.required && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                          <Badge className={`${getPriorityColor(item.priority)} text-white text-xs`}>
                            {item.priority}
                          </Badge>
                        </div>
                      </div>
                      {itemQuestions.length > 0 && (
                        <Badge variant="outline" className="gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {itemQuestions.length}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      
                      {/* Status actions */}
                      <div className="flex flex-wrap gap-2">
                        {item.status !== 'completed' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatusMutation.mutate({
                                itemId: item.id,
                                status: 'in_progress',
                              })}
                            >
                              Mark In Progress
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => updateStatusMutation.mutate({
                                itemId: item.id,
                                status: 'completed',
                              })}
                            >
                              Mark Complete
                            </Button>
                          </>
                        )}
                        {item.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate({
                              itemId: item.id,
                              status: 'in_progress',
                            })}
                          >
                            Reopen
                          </Button>
                        )}
                        {!item.required && item.status !== 'waived' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateStatusMutation.mutate({
                              itemId: item.id,
                              status: 'waived',
                            })}
                          >
                            Waive
                          </Button>
                        )}
                      </div>
                      
                      {/* Q&A Section */}
                      <div className="border-t pt-4">
                        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Questions & Answers ({itemQuestions.length})
                        </h4>
                        
                        {itemQuestions.length > 0 && (
                          <div className="space-y-3 mb-4">
                            {itemQuestions.map(q => (
                              <div key={q.id} className="bg-muted p-3 rounded-lg space-y-2">
                                <div>
                                  <div className="text-sm font-medium">Q: {q.question}</div>
                                  <div className="text-xs text-muted-foreground">
                                    Asked {new Date(q.askedAt).toLocaleDateString()}
                                  </div>
                                </div>
                                {q.answer ? (
                                  <div className="pl-4 border-l-2 border-primary">
                                    <div className="text-sm">A: {q.answer}</div>
                                    <div className="text-xs text-muted-foreground">
                                      Answered {q.answeredAt && new Date(q.answeredAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="pl-4">
                                    <Textarea
                                      placeholder="Type your answer..."
                                      value={answerText}
                                      onChange={(e) => setAnswerText(e.target.value)}
                                      rows={2}
                                      className="mb-2"
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        answerQuestionMutation.mutate({
                                          questionId: q.id,
                                          answer: answerText,
                                        });
                                      }}
                                      disabled={!answerText.trim() || answerQuestionMutation.isPending}
                                    >
                                      <Send className="w-3 h-3 mr-1" />
                                      Post Answer
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Ask new question */}
                        <div>
                          <Textarea
                            placeholder="Ask a question about this item..."
                            value={questionText}
                            onChange={(e) => setQuestionText(e.target.value)}
                            rows={2}
                            className="mb-2"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              askQuestionMutation.mutate({
                                itemId: item.id,
                                question: questionText,
                              });
                            }}
                            disabled={!questionText.trim() || askQuestionMutation.isPending}
                          >
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Ask Question
                          </Button>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
