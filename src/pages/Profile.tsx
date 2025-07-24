import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Camera, MapPin, Heart, User } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    gender: '',
    seeking_gender: '',
    location: '',
    bio: '',
    interests: [] as string[],
    profile_picture_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchCredits();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile({
          name: data.name || '',
          age: data.age?.toString() || '',
          gender: data.gender || '',
          seeking_gender: data.seeking_gender || '',
          location: data.location || '',
          bio: data.bio || '',
          interests: data.interests || [],
          profile_picture_url: data.profile_picture_url || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchCredits = async () => {
    try {
      const { data, error } = await supabase
        .from('credits')
        .select('balance')
        .eq('user_id', user?.id)
        .single();

      if (data) {
        setCredits(data.balance);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const profileData = {
        user_id: user.id,
        name: profile.name,
        age: parseInt(profile.age),
        gender: profile.gender,
        seeking_gender: profile.seeking_gender,
        location: profile.location,
        bio: profile.bio,
        interests: profile.interests
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'user_id' });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to save profile",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Profile saved successfully!"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Credits Card */}
        <Card className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Your Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{credits}</div>
            <p className="text-pink-100">messages remaining</p>
          </CardContent>
        </Card>

        {/* Profile Setup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Picture */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-pink-200 to-purple-200 flex items-center justify-center">
                  {profile.profile_picture_url ? (
                    <img 
                      src={profile.profile_picture_url} 
                      alt="Profile" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <Camera className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <Button
                  size="sm"
                  className="absolute bottom-0 right-0 rounded-full bg-gradient-to-r from-pink-500 to-purple-600"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Name</label>
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Age</label>
                <Input
                  type="number"
                  value={profile.age}
                  onChange={(e) => setProfile({...profile, age: e.target.value})}
                  placeholder="Enter your age"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Gender</label>
                <Select value={profile.gender} onValueChange={(value) => setProfile({...profile, gender: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Seeking</label>
                <Select value={profile.seeking_gender} onValueChange={(value) => setProfile({...profile, seeking_gender: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seeking gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </label>
              <Input
                value={profile.location}
                onChange={(e) => setProfile({...profile, location: e.target.value})}
                placeholder="Enter your location"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Bio</label>
              <Textarea
                value={profile.bio}
                onChange={(e) => setProfile({...profile, bio: e.target.value})}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>

            <Button 
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;