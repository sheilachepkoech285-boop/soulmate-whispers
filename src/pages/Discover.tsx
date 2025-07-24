import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, X, MapPin, Play } from 'lucide-react';
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

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  const fetchProfiles = async () => {
    try {
      // Get current user's seeking preference
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('seeking_gender')
        .eq('user_id', user?.id)
        .single();

      if (!currentUserProfile?.seeking_gender) {
        setLoading(false);
        return;
      }

      // Fetch profiles matching user's preference, excluding their own profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('gender', currentUserProfile.seeking_gender)
        .neq('user_id', user?.id)
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

  const handleSwipe = async (liked: boolean) => {
    const currentProfile = profiles[currentIndex];
    if (!currentProfile || !user) return;

    if (liked) {
      try {
        // Create a match
        const { error } = await supabase
          .from('matches')
          .insert({
            user_id: user.id,
            matched_profile_id: currentProfile.id
          });

        if (error) {
          console.error('Error creating match:', error);
        } else {
          toast({
            title: "It's a match! 💖",
            description: `You matched with ${currentProfile.name}!`
          });
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }

    // Move to next profile
    setCurrentIndex(prev => prev + 1);
  };

  const currentProfile = profiles[currentIndex];

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

  if (!currentProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-12 w-12 text-pink-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No more profiles</h2>
          <p className="text-muted-foreground">Check back later for new matches!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Discover
          </h1>
          <p className="text-muted-foreground">Find your perfect match</p>
        </div>

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
    </div>
  );
};

export default Discover;