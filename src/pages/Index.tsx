import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Users, MessageCircle, Star } from 'lucide-react';
import { createFakeProfiles } from '@/utils/createFakeProfiles';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    matches: 0,
    messages: 0,
    credits: 0
  });

  useEffect(() => {
    if (user) {
      fetchStats();
      createFakeProfiles(); // Create fake profiles on first load
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      // Fetch matches count
      const { count: matchesCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Fetch messages count
      const { data: matches } = await supabase
        .from('matches')
        .select('id')
        .eq('user_id', user?.id);

      let messagesCount = 0;
      if (matches) {
        const matchIds = matches.map(m => m.id);
        if (matchIds.length > 0) {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .in('match_id', matchIds);
          messagesCount = count || 0;
        }
      }

      // Fetch credits
      const { data: creditsData } = await supabase
        .from('credits')
        .select('balance')
        .eq('user_id', user?.id)
        .single();

      setStats({
        matches: matchesCount || 0,
        messages: messagesCount,
        credits: creditsData?.balance || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_fake_profile', true)
        .limit(5);
      
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full">
              <Heart className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Welcome to Soulmate Whispers
          </h1>
          <p className="text-muted-foreground">
            Find your perfect match and start meaningful conversations
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="h-5 w-5" />
                Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.credits}</div>
              <p className="text-pink-100">messages remaining</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-blue-600" />
                Matches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.matches}</div>
              <p className="text-muted-foreground">connections made</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageCircle className="h-5 w-5 text-green-600" />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.messages}</div>
              <p className="text-muted-foreground">conversations started</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-6 w-6 text-yellow-500" />
                Discover New Matches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Explore profiles and find your perfect soulmate
              </p>
              <Button 
                onClick={() => navigate('/discover')}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                Start Discovering
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-6 w-6 text-blue-500" />
                Continue Conversations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Chat with your matches and build connections
              </p>
              <Button 
                onClick={() => navigate('/messages')}
                variant="outline" 
                className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                Open Messages
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Featured Profiles */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-6 w-6 text-yellow-500" />
              Featured Profiles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {profiles.map((profile) => (
                <div 
                  key={profile.id}
                  className="bg-white rounded-lg p-4 shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="aspect-square bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg mb-3 overflow-hidden">
                    {profile.profile_picture_url ? (
                      <img 
                        src={profile.profile_picture_url} 
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Heart className="h-8 w-8 text-pink-400" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm text-center truncate">{profile.name}</h4>
                  <p className="text-xs text-muted-foreground text-center">{profile.age}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Welcome Message */}
        {stats.matches === 0 && (
          <Card className="mt-8 border-dashed">
            <CardContent className="text-center py-8">
              <Heart className="h-16 w-16 text-pink-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Ready to find love?</h3>
              <p className="text-muted-foreground mb-4">
                Complete your profile and start discovering amazing people around you!
              </p>
              <Button 
                onClick={() => navigate('/profile')}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                Complete Profile
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
