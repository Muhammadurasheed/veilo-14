import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Expert } from '@/types';
import { AdminApi, ExpertApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Shield,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

const ExpertVerificationFixed = () => {
  const { toast } = useToast();
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [verificationLevel, setVerificationLevel] = useState<'blue' | 'gold' | 'platinum'>('blue');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Mock pending experts with complete Expert interface
  const mockPendingExperts: Expert[] = [
    {
      id: 'expert-1',
      userId: 'user-1',
      name: 'Dr. Emma Harris',
      email: 'emma.harris@example.com',
      avatarUrl: '/experts/expert-1.jpg',
      specialization: 'Mental Health',
      bio: 'Licensed therapist with 10+ years experience in anxiety and depression treatment.',
      verificationLevel: 'blue',
      verified: false,
      pricingModel: 'fixed',
      pricingDetails: '$120/session',
      rating: 0,
      testimonials: [],
      topicsHelped: ['Anxiety', 'Depression'],
      accountStatus: 'pending',
      totalSessions: 0,
      completedSessions: 0,
      createdAt: new Date().toISOString(),
      profileViews: 0,
      profileViewsThisMonth: 0,
      followersCount: 0,
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'expert-2',
      userId: 'user-2',
      name: 'Dr. Michael Chen',
      email: 'michael.chen@example.com',
      avatarUrl: '/experts/expert-2.jpg',
      specialization: 'Life Coaching',
      bio: 'Certified life coach specializing in career transitions and personal development.',
      verificationLevel: 'blue',
      verified: false,
      pricingModel: 'donation',
      pricingDetails: 'Pay what you feel is fair',
      rating: 0,
      testimonials: [],
      topicsHelped: ['Career', 'Personal Growth'],
      accountStatus: 'pending',
      totalSessions: 0,
      completedSessions: 0,
      createdAt: new Date().toISOString(),
      profileViews: 0,
      profileViewsThisMonth: 0,
      followersCount: 0,
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'expert-3',
      userId: 'user-3',
      name: 'Dr. Sarah Williams',
      email: 'sarah.williams@example.com',
      avatarUrl: '/experts/expert-3.jpg',
      specialization: 'Relationship Counseling',
      bio: 'Marriage and family therapist helping couples and families improve communication.',
      verificationLevel: 'blue',
      verified: false,
      pricingModel: 'fixed',
      pricingDetails: '$150/session',
      rating: 0,
      testimonials: [],
      topicsHelped: ['Relationships', 'Family Issues'],
      accountStatus: 'pending',
      totalSessions: 0,
      completedSessions: 0,
      createdAt: new Date().toISOString(),
      profileViews: 0,
      profileViewsThisMonth: 0,
      followersCount: 0,
      lastUpdated: new Date().toISOString()
    }
  ];

  // Real API query for pending experts with fallback to mock data
  const { 
    data: pendingExperts = mockPendingExperts, 
    isLoading, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: ['pendingExperts'],
    queryFn: async () => {
      try {
        const response = await AdminApi.getPendingExperts();
        return response.data || mockPendingExperts;
      } catch (error) {
        console.log('Using mock data due to API error:', error);
        return mockPendingExperts;
      }
    },
  });

  const handleExpertReview = (expert: Expert) => {
    setSelectedExpert(expert);
    setVerificationLevel('blue');
    setIsDialogOpen(true);
  };

  const handleApproval = async (action: 'approved' | 'rejected') => {
    if (!selectedExpert) return;
    
    setIsSubmitting(true);
    
    try {
      // Call the real API to verify the expert
      const response = await AdminApi.verifyExpert(selectedExpert.id, {
        verificationLevel: action === 'approved' ? verificationLevel : 'blue',
        status: action,
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update expert status');
      }
      
      // Refetch the data to get updated list
      refetch();
      
      toast({
        title: `Expert ${action === 'approved' ? 'approved' : 'rejected'}`,
        description: `${selectedExpert.name} has been ${action === 'approved' ? 'approved' : 'rejected'}.`,
        variant: action === 'approved' ? 'default' : 'destructive',
      });
      
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Action failed',
        description: error instanceof Error ? error.message : 'Failed to update expert status',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVerificationIcon = (level: string) => {
    switch (level) {
      case 'platinum':
        return <ShieldAlert className="h-5 w-5 text-purple-600" />;
      case 'gold':
        return <ShieldCheck className="h-5 w-5 text-yellow-600" />;
      case 'blue':
        return <Shield className="h-5 w-5 text-blue-600" />;
      default:
        return <Shield className="h-5 w-5 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading experts...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Expert Verification</h1>
        <p className="text-muted-foreground">Review and verify expert applications</p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">Pending Review ({pendingExperts.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingExperts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                <p className="text-muted-foreground">No pending expert applications to review.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingExperts.map((expert) => (
                <Card key={expert.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <img
                        src={expert.avatarUrl || '/avatars/avatar-1.svg'}
                        alt={expert.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <CardTitle className="text-lg">{expert.name}</CardTitle>
                        <CardDescription>{expert.specialization}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                      {expert.bio}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {expert.topicsHelped?.slice(0, 3).map((topic, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Pricing: {expert.pricingModel}</span>
                      <span>Applied: {new Date(expert.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => handleExpertReview(expert)}
                      className="w-full"
                    >
                      Review Application
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Approved experts will be shown here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Rejected experts will be shown here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Expert Application</DialogTitle>
            <DialogDescription>
              Review and verify {selectedExpert?.name}'s application
            </DialogDescription>
          </DialogHeader>

          {selectedExpert && (
            <div className="space-y-6">
              {/* Expert Info */}
              <div className="flex items-center space-x-4">
                <img
                  src={selectedExpert.avatarUrl || '/avatars/avatar-1.svg'}
                  alt={selectedExpert.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-xl font-semibold">{selectedExpert.name}</h3>
                  <p className="text-muted-foreground">{selectedExpert.specialization}</p>
                  <p className="text-sm text-muted-foreground">{selectedExpert.email}</p>
                </div>
              </div>

              {/* Bio */}
              <div>
                <h4 className="font-semibold mb-2">Professional Bio</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedExpert.bio}
                </p>
              </div>

              {/* Topics */}
              <div>
                <h4 className="font-semibold mb-2">Areas of Expertise</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedExpert.topicsHelped?.map((topic, index) => (
                    <Badge key={index} variant="outline">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h4 className="font-semibold mb-2">Pricing Model</h4>
                <p className="text-sm">
                  <span className="capitalize">{selectedExpert.pricingModel}</span> - {selectedExpert.pricingDetails}
                </p>
              </div>

              {/* Verification Level Selection */}
              <div>
                <h4 className="font-semibold mb-3">Verification Level</h4>
                <RadioGroup value={verificationLevel} onValueChange={(value: any) => setVerificationLevel(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="blue" id="blue" />
                    <Label htmlFor="blue" className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span>Blue Verification</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="gold" id="gold" />
                    <Label htmlFor="gold" className="flex items-center space-x-2">
                      <ShieldCheck className="h-4 w-4 text-yellow-600" />
                      <span>Gold Verification</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="platinum" id="platinum" />
                    <Label htmlFor="platinum" className="flex items-center space-x-2">
                      <ShieldAlert className="h-4 w-4 text-purple-600" />
                      <span>Platinum Verification</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          <DialogFooter className="flex space-x-2">
            <DialogClose asChild>
              <Button variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={() => handleApproval('rejected')}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              Reject
            </Button>
            <Button 
              onClick={() => handleApproval('approved')}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpertVerificationFixed;