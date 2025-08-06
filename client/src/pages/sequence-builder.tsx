import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Zap, 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  BarChart3, 
  Users, 
  Mail, 
  Phone, 
  MessageSquare,
  Calendar,
  Target,
  TrendingUp,
  Eye,
  MousePointer,
  UserCheck,
  DollarSign,
  Bot,
  Wand2
} from "lucide-react";
import type { Sequence, SequenceStep, SequenceEnrollment, SequenceAnalytics } from "@shared/schema";

const sequenceFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.enum(["draft", "active", "paused", "archived"]).default("draft"),
  automation: z.number().min(0).max(100).default(100),
  unenrollCriteria: z.string().optional(),
  settings: z.string().optional(),
});

const stepFormSchema = z.object({
  type: z.enum(["email", "task", "call", "linkedin_message"]),
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
  delayDays: z.number().min(0).default(1),
  delayHours: z.number().min(0).max(23).default(0),
  delayMinutes: z.number().min(0).max(59).default(0),
  position: z.number().min(1),
  settings: z.string().optional(),
});

export default function SequenceBuilder() {
  const [selectedSequence, setSelectedSequence] = useState<Sequence | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showStepDialog, setShowStepDialog] = useState(false);
  const [editingStep, setEditingStep] = useState<SequenceStep | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch sequences
  const { data: sequences, isLoading: sequencesLoading } = useQuery({
    queryKey: ["/api/sequences"],
  });

  // Fetch steps for selected sequence
  const { data: steps } = useQuery({
    queryKey: ["/api/sequences", selectedSequence?.id, "steps"],
    enabled: !!selectedSequence?.id,
  });

  // Fetch enrollments for selected sequence
  const { data: enrollments } = useQuery({
    queryKey: ["/api/sequence-enrollments"],
    enabled: !!selectedSequence?.id,
  });

  // Fetch analytics for selected sequence
  const { data: analytics } = useQuery({
    queryKey: ["/api/sequences", selectedSequence?.id, "analytics"],
    enabled: !!selectedSequence?.id,
  });

  // Mutations
  const createSequenceMutation = useMutation({
    mutationFn: (data: z.infer<typeof sequenceFormSchema>) =>
      apiRequest("/api/sequences", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sequences"] });
      setShowCreateDialog(false);
      toast({
        title: "Success",
        description: "Sequence created successfully",
      });
    },
  });

  const updateSequenceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Sequence> }) =>
      apiRequest(`/api/sequences/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sequences"] });
      toast({
        title: "Success",
        description: "Sequence updated successfully",
      });
    },
  });

  const deleteSequenceMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/sequences/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sequences"] });
      setSelectedSequence(null);
      toast({
        title: "Success",
        description: "Sequence deleted successfully",
      });
    },
  });

  const createStepMutation = useMutation({
    mutationFn: (data: z.infer<typeof stepFormSchema>) =>
      apiRequest(`/api/sequences/${selectedSequence?.id}/steps`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sequences", selectedSequence?.id, "steps"] });
      setShowStepDialog(false);
      setEditingStep(null);
      toast({
        title: "Success",
        description: "Step created successfully",
      });
    },
  });

  // Forms
  const sequenceForm = useForm<z.infer<typeof sequenceFormSchema>>({
    resolver: zodResolver(sequenceFormSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "draft",
      automation: 100,
    },
  });

  const stepForm = useForm<z.infer<typeof stepFormSchema>>({
    resolver: zodResolver(stepFormSchema),
    defaultValues: {
      type: "email",
      title: "",
      content: "",
      delayDays: 1,
      delayHours: 0,
      delayMinutes: 0,
      position: 1,
    },
  });

  const onCreateSequence = (data: z.infer<typeof sequenceFormSchema>) => {
    createSequenceMutation.mutate(data);
  };

  const onCreateStep = (data: z.infer<typeof stepFormSchema>) => {
    createStepMutation.mutate(data);
  };

  const toggleSequenceStatus = (sequence: Sequence) => {
    const newStatus = sequence.status === "active" ? "paused" : "active";
    updateSequenceMutation.mutate({
      id: sequence.id,
      data: { status: newStatus },
    });
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case "email": return <Mail className="h-4 w-4" />;
      case "task": return <Target className="h-4 w-4" />;
      case "call": return <Phone className="h-4 w-4" />;
      case "linkedin_message": return <MessageSquare className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "paused": return "bg-yellow-100 text-yellow-800";
      case "draft": return "bg-gray-100 text-gray-800";
      case "archived": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Mock analytics data for demo
  const mockAnalytics = {
    totalEnrollments: 156,
    openRate: 68.5,
    meetingRate: 12.8,
    interactionRate: 24.3,
    salesClosureRate: 8.7,
    performance: [
      { date: "2024-01-01", sent: 45, opened: 32, clicked: 12, meetings: 5 },
      { date: "2024-01-02", sent: 52, opened: 38, clicked: 15, meetings: 7 },
      { date: "2024-01-03", sent: 48, opened: 35, clicked: 14, meetings: 6 },
      { date: "2024-01-04", sent: 41, opened: 29, clicked: 11, meetings: 4 },
      { date: "2024-01-05", sent: 55, opened: 42, clicked: 18, meetings: 8 },
    ]
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sequence Builder</h1>
              <p className="text-gray-600">Create and manage automated sales sequences</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Sequence
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Sequence</DialogTitle>
                </DialogHeader>
                <Form {...sequenceForm}>
                  <form onSubmit={sequenceForm.handleSubmit(onCreateSequence)} className="space-y-4">
                    <FormField
                      control={sequenceForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sequence Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., New Client Outreach" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={sequenceForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Describe the purpose of this sequence..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={sequenceForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="paused">Paused</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={sequenceForm.control}
                        name="automation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Automation Level (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                max="100" 
                                {...field} 
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createSequenceMutation.isPending}>
                        {createSequenceMutation.isPending ? "Creating..." : "Create Sequence"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            <Button variant="outline">
              <Bot className="mr-2 h-4 w-4" />
              AI Suggestions
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Sequences List */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Sequences</h2>
              <Badge variant="secondary">{sequences?.length || 0}</Badge>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sequencesLoading ? (
              <div className="p-4">
                <div className="animate-pulse space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {sequences?.map((sequence: Sequence) => (
                  <Card 
                    key={sequence.id}
                    className={`cursor-pointer transition-all ${
                      selectedSequence?.id === sequence.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedSequence(sequence)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 truncate">{sequence.name}</h3>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{sequence.description}</p>
                          <div className="flex items-center mt-2 space-x-2">
                            <Badge className={getStatusColor(sequence.status)}>
                              {sequence.status}
                            </Badge>
                            <span className="text-xs text-gray-500">{sequence.totalSteps} steps</span>
                          </div>
                        </div>
                        <div className="ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSequenceStatus(sequence);
                            }}
                          >
                            {sequence.status === "active" ? 
                              <Pause className="h-4 w-4" /> : 
                              <Play className="h-4 w-4" />
                            }
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {sequences?.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Zap className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>No sequences yet</p>
                    <p className="text-sm">Create your first sequence to get started</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedSequence ? (
            <>
              {/* Sequence Header */}
              <div className="bg-white border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedSequence.name}</h2>
                    <p className="text-gray-600 mt-1">{selectedSequence.description}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(selectedSequence.status)}>
                      {selectedSequence.status}
                    </Badge>
                    <span className="text-sm text-gray-500">{selectedSequence.automation}% automated</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        stepForm.reset({
                          type: "email",
                          title: "",
                          content: "",
                          delayDays: 1,
                          delayHours: 0,
                          delayMinutes: 0,
                          position: (steps?.length || 0) + 1,
                        });
                        setEditingStep(null);
                        setShowStepDialog(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Step
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteSequenceMutation.mutate(selectedSequence.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>

              {/* Analytics Cards */}
              <div className="bg-white border-b border-gray-200 p-6">
                <div className="grid grid-cols-5 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Enrolled</p>
                          <p className="text-2xl font-bold text-gray-900">{mockAnalytics.totalEnrollments}</p>
                        </div>
                        <Users className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Open Rate</p>
                          <p className="text-2xl font-bold text-green-600">{mockAnalytics.openRate}%</p>
                        </div>
                        <Eye className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Meeting Rate</p>
                          <p className="text-2xl font-bold text-purple-600">{mockAnalytics.meetingRate}%</p>
                        </div>
                        <Calendar className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Interaction Rate</p>
                          <p className="text-2xl font-bold text-orange-600">{mockAnalytics.interactionRate}%</p>
                        </div>
                        <MousePointer className="h-8 w-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Closure Rate</p>
                          <p className="text-2xl font-bold text-red-600">{mockAnalytics.salesClosureRate}%</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-red-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Sequence Steps */}
              <div className="flex-1 overflow-auto p-6">
                <div className="max-w-4xl mx-auto">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Sequence Steps</h3>
                  {steps && steps.length > 0 ? (
                    <div className="space-y-4">
                      {steps.map((step: SequenceStep, index: number) => (
                        <Card key={step.id} className="relative">
                          <CardContent className="p-6">
                            <div className="flex items-start space-x-4">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                {getStepIcon(step.type)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-gray-900">{step.title}</h4>
                                  <div className="flex items-center space-x-2">
                                    <Badge variant="outline" className="capitalize">
                                      {step.type.replace('_', ' ')}
                                    </Badge>
                                    <Button variant="ghost" size="sm">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-gray-600 mt-1">{step.content}</p>
                                <div className="flex items-center mt-3 space-x-4 text-sm text-gray-500">
                                  <span>Position: {step.position}</span>
                                  <span>
                                    Delay: {step.delayDays}d {step.delayHours}h {step.delayMinutes}m
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                          {index < steps.length - 1 && (
                            <div className="absolute left-9 -bottom-2 w-0.5 h-6 bg-gray-200"></div>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Target className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No steps yet</h4>
                      <p className="text-gray-600 mb-4">Add your first step to begin building the sequence</p>
                      <Button
                        onClick={() => {
                          stepForm.reset({
                            type: "email",
                            title: "",
                            content: "",
                            delayDays: 1,
                            delayHours: 0,
                            delayMinutes: 0,
                            position: 1,
                          });
                          setEditingStep(null);
                          setShowStepDialog(true);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Step
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Zap className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a sequence</h3>
                <p className="text-gray-600">Choose a sequence from the sidebar to view and edit its steps</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Step Dialog */}
      <Dialog open={showStepDialog} onOpenChange={setShowStepDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingStep ? "Edit Step" : "Add New Step"}</DialogTitle>
          </DialogHeader>
          <Form {...stepForm}>
            <form onSubmit={stepForm.handleSubmit(onCreateStep)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={stepForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Step Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="task">Task</SelectItem>
                          <SelectItem value="call">Call</SelectItem>
                          <SelectItem value="linkedin_message">LinkedIn Message</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={stepForm.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          {...field} 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={stepForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Step Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Initial Outreach Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={stepForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter the email content, task description, or call script..."
                        rows={6}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <FormLabel>Delay After Previous Step</FormLabel>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <FormField
                    control={stepForm.control}
                    name="delayDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Days</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={stepForm.control}
                    name="delayHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Hours</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="23" 
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={stepForm.control}
                    name="delayMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Minutes</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="59" 
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowStepDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createStepMutation.isPending}>
                  {createStepMutation.isPending ? "Adding..." : editingStep ? "Update Step" : "Add Step"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}