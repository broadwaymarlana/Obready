import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MessageSquare, Plus, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Case, Annotation } from "@shared/schema";

export default function AnnotationsPage() {
  const { toast } = useToast();
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [newAnnotation, setNewAnnotation] = useState({
    targetType: "case",
    content: "",
    author: "",
  });

  const { data: cases, isLoading: casesLoading } = useQuery<Case[]>({
    queryKey: ["/api/cases"],
  });

  const { data: annotations, isLoading: annotationsLoading } = useQuery<Annotation[]>({
    queryKey: ["/api/annotations", selectedCaseId],
    queryFn: async () => {
      if (!selectedCaseId) return [];
      const response = await fetch(`/api/annotations/${selectedCaseId}`);
      if (!response.ok) throw new Error("Failed to fetch annotations");
      return response.json();
    },
    enabled: !!selectedCaseId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      caseId: string;
      targetType: string;
      content: string;
      author: string;
    }) => {
      const response = await apiRequest("POST", "/api/annotations", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/annotations", selectedCaseId] });
      toast({
        title: "Annotation added",
        description: "Your note has been saved successfully.",
      });
      setNewAnnotation({ targetType: "case", content: "", author: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add annotation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/annotations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/annotations", selectedCaseId] });
      toast({
        title: "Annotation deleted",
        description: "The note has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete annotation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId || !newAnnotation.content.trim()) return;

    createMutation.mutate({
      caseId: selectedCaseId,
      targetType: newAnnotation.targetType,
      content: newAnnotation.content.trim(),
      author: newAnnotation.author.trim() || "Anonymous",
    });
  };

  const targetTypeLabels: Record<string, string> = {
    case: "General Case Note",
    witness: "Witness Strategy",
    evidence: "Evidence Analysis",
    weakness: "Weakness Exploitation",
    timeline: "Timeline Observation",
    motion: "Motion Strategy",
  };

  if (casesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">
          Team Annotations & Strategy Notes
        </h1>
        <p className="text-muted-foreground mt-1">
          Collaborate with your team by adding notes, strategies, and observations to cases
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Case
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
            <SelectTrigger data-testid="select-case">
              <SelectValue placeholder="Select a case to view annotations" />
            </SelectTrigger>
            <SelectContent>
              {cases?.map((caseItem) => (
                <SelectItem key={caseItem.id} value={caseItem.id}>
                  {caseItem.name}
                  {caseItem.caseNumber && ` - #${caseItem.caseNumber}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedCaseId && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Annotation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="author">Your Name</Label>
                    <Input
                      id="author"
                      placeholder="Enter your name"
                      value={newAnnotation.author}
                      onChange={(e) =>
                        setNewAnnotation({ ...newAnnotation, author: e.target.value })
                      }
                      data-testid="input-author"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Annotation Type</Label>
                    <Select
                      value={newAnnotation.targetType}
                      onValueChange={(value) =>
                        setNewAnnotation({ ...newAnnotation, targetType: value })
                      }
                    >
                      <SelectTrigger data-testid="select-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="case">General Case Note</SelectItem>
                        <SelectItem value="witness">Witness Strategy</SelectItem>
                        <SelectItem value="evidence">Evidence Analysis</SelectItem>
                        <SelectItem value="weakness">Weakness Exploitation</SelectItem>
                        <SelectItem value="timeline">Timeline Observation</SelectItem>
                        <SelectItem value="motion">Motion Strategy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Note Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Enter your strategy note, observation, or annotation..."
                    value={newAnnotation.content}
                    onChange={(e) =>
                      setNewAnnotation({ ...newAnnotation, content: e.target.value })
                    }
                    rows={4}
                    data-testid="input-content"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!newAnnotation.content.trim() || createMutation.isPending}
                  data-testid="button-add-annotation"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Add Annotation
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Annotations ({annotations?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {annotationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : annotations && annotations.length > 0 ? (
                <div className="space-y-4">
                  {annotations.map((annotation) => (
                    <div
                      key={annotation.id}
                      className="p-4 rounded-md border space-y-2"
                      data-testid={`annotation-${annotation.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {targetTypeLabels[annotation.targetType] || annotation.targetType}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            by {annotation.author || "Anonymous"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(annotation.createdAt).toLocaleDateString()}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(annotation.id)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${annotation.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{annotation.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  No annotations yet. Add your first note above.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
