import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, X, MapPin, Play, Grid, Layers } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ProfileType {
  id: string;
  name: string;
  age: number;
  location: string;
  bio: string;
  interests: string[];
  profile_picture_url: string;
  intro_video_url: string;
}

const Discover = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<ProfileType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'swipe' | 'grid'>('grid');

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      // Fetch fake profiles for testing
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_fake_profile', true)
        .limit(10);

      if (error) {
        console.error('Error fetching profiles:', error);
        return;
      }

      setProfiles(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (profileId: string) => {
    if (!user) return;

    try {
      // Create a match
      const { error } = await supabase
        .from('matches')
        .insert({
          user_id: user.id,
          matched_profile_id: profileId
        });

      if (error) {
        console.error('Error creating match:', error);
      } else {
        const profile = profiles.find(p => p.id === profileId);
        toast({
          title: "It's a match! 💖",
          description: `You matched with ${profile?.name}!`
        });
      }
    } catch (error) {
      console.error('Error:', error);
    }

    if (viewMode === 'swipe') {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePass = (profileId: string) => {
    if (viewMode === 'swipe') {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleSwipe = async (liked: boolean) => {
    const currentProfile = profiles[currentIndex];
    if (!currentProfile || !user) return;

    if (liked) {
      await handleLike(currentProfile.id);
    } else {
      handlePass(currentProfile.id);
    }
  };

  const GridView = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {profiles.map((profile) => (
        <Card key={profile.id} className="hover:shadow-lg transition-shadow cursor-pointer">
          <div className="aspect-[3/4] bg-gradient-to-br from-pink-100 to-purple-100 rounded-t-lg overflow-hidden relative">
            {profile.profile_picture_url ? (
              <img 
                src={profile.profile_picture_url} 
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Heart className="h-12 w-12 text-pink-400" />
              </div>
            )}
            {/* Play button for video */}
            {profile.intro_video_url && (
              <Button
                size="sm"
                className="absolute top-2 right-2 rounded-full bg-black/50 hover:bg-black/70"
              >
                <Play className="h-3 w-3" />
              </Button>
            )}
          </div>
          <CardContent className="p-4">
            <h3 className="font-bold text-lg truncate">{profile.name}, {profile.age}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1 truncate mb-2">
              <MapPin className="h-3 w-3" />
              {profile.location || 'Location not specified'}
            </p>
            {profile.interests && profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {profile.interests.slice(0, 2).map((interest, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">{interest}</Badge>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={() => handlePass(profile.id)}
                variant="outline"
                size="sm"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => handleLike(profile.id)}
                size="sm"
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const SwipeView = () => {
    const currentProfile = profiles[currentIndex];
    
    if (!currentProfile) {
      return (
        <div className="text-center py-8">
          <Heart className="h-16 w-16 text-pink-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No more profiles</h3>
          <p className="text-muted-foreground">Check back later for new matches!</p>
        </div>
      );
    }

    return (
      <div className="max-w-md mx-auto">
        <Card className="relative overflow-hidden shadow-2xl">
          <div className="aspect-[4/5] relative">
            {currentProfile.profile_picture_url ? (
              <img
                src={currentProfile.profile_picture_url}
                alt={currentProfile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">
                <Heart className="h-24 w-24 text-white/50" />
              </div>
            )}
            
            {/* Video Play Button */}
            {currentProfile.intro_video_url && (
              <Button
                size="sm"
                className="absolute top-4 right-4 rounded-full bg-black/50 hover:bg-black/70"
              >
                <Play className="h-4 w-4" />
              </Button>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Profile Info */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h2 className="text-2xl font-bold mb-1">
                {currentProfile.name}, {currentProfile.age}
              </h2>
              {currentProfile.location && (
                <div className="flex items-center gap-1 mb-3">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{currentProfile.location}</span>
                </div>
              )}
              {currentProfile.bio && (
                <p className="text-sm opacity-90 mb-3">{currentProfile.bio}</p>
              )}
              {currentProfile.interests?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {currentProfile.interests.slice(0, 3).map((interest, index) => (
                    <Badge key={index} variant="secondary" className="bg-white/20 text-white border-white/30">
                      {interest}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-8 mt-8">
          <Button
            size="lg"
            variant="outline"
            className="w-16 h-16 rounded-full border-2 border-red-300 hover:bg-red-50 hover:border-red-400"
            onClick={() => handleSwipe(false)}
          >
            <X className="h-8 w-8 text-red-500" />
          </Button>
          <Button
            size="lg"
            className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            onClick={() => handleSwipe(true)}
          >
            <Heart className="h-8 w-8" />
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-12 w-12 text-pink-500 animate-pulse mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Finding your matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Discover
          </h1>
          <p className="text-muted-foreground">Find your perfect match</p>
          
          {/* View Toggle */}
          <div className="flex justify-center mt-4">
            <div className="bg-white rounded-lg p-1 shadow-sm">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="mr-1"
              >
                <Grid className="h-4 w-4 mr-1" />
                Grid
              </Button>
              <Button
                variant={viewMode === 'swipe' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('swipe')}
              >
                <Layers className="h-4 w-4 mr-1" />
                Swipe
              </Button>
            </div>
          </div>
        </div>

        {profiles.length === 0 ? (
          <Card className="text-center py-8 max-w-md mx-auto">
            <CardContent>
              <Heart className="h-16 w-16 text-pink-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No profiles available</h3>
              <p className="text-muted-foreground">Check back later for new matches!</p>
            </CardContent>
          </Card>
        ) : (
          viewMode === 'grid' ? <GridView /> : <SwipeView />
        )}
      </div>
    </div>
  );
};

export default Discover;