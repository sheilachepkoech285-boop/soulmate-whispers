import { supabase } from '@/integrations/supabase/client';

export const createFakeProfiles = async () => {
  const fakeProfiles = [
    {
      user_id: crypto.randomUUID(),
      name: 'Emily Johnson',
      age: 25,
      gender: 'female',
      seeking_gender: 'male',
      bio: 'Love hiking, yoga, and trying new cuisines. Looking for someone who shares my passion for adventure!',
      location: 'Nairobi, Kenya',
      interests: ['Hiking', 'Yoga', 'Cooking', 'Travel'],
      is_fake_profile: true,
      profile_picture_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face'
    },
    {
      user_id: crypto.randomUUID(),
      name: 'Sarah Wilson',
      age: 28,
      gender: 'female',
      seeking_gender: 'male',
      bio: 'Professional photographer with a love for art and music. Seeking meaningful connections and deep conversations.',
      location: 'Mombasa, Kenya',
      interests: ['Photography', 'Art', 'Music', 'Coffee'],
      is_fake_profile: true,
      profile_picture_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face'
    },
    {
      user_id: crypto.randomUUID(),
      name: 'Michael Chen',
      age: 30,
      gender: 'male',
      seeking_gender: 'female',
      bio: 'Tech entrepreneur who loves weekend getaways and good food. Always up for trying something new!',
      location: 'Kisumu, Kenya',
      interests: ['Technology', 'Travel', 'Food', 'Movies'],
      is_fake_profile: true,
      profile_picture_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face'
    },
    {
      user_id: crypto.randomUUID(),
      name: 'David Martinez',
      age: 27,
      gender: 'male',
      seeking_gender: 'female',
      bio: 'Fitness enthusiast and nature lover. Looking for someone to share outdoor adventures and quiet moments.',
      location: 'Nakuru, Kenya',
      interests: ['Fitness', 'Nature', 'Reading', 'Cycling'],
      is_fake_profile: true,
      profile_picture_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face'
    },
    {
      user_id: crypto.randomUUID(),
      name: 'Jessica Taylor',
      age: 26,
      gender: 'female',
      seeking_gender: 'male',
      bio: 'Artist and dancer with a passion for creativity. Seeking someone who appreciates the beauty in everyday life.',
      location: 'Eldoret, Kenya',
      interests: ['Art', 'Dancing', 'Music', 'Literature'],
      is_fake_profile: true,
      profile_picture_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face'
    }
  ];

  try {
    // Check if fake profiles already exist
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_fake_profile', true);

    if (existingProfiles && existingProfiles.length > 0) {
      console.log('Fake profiles already exist');
      return;
    }

    // Insert fake profiles
    const { error } = await supabase
      .from('profiles')
      .insert(fakeProfiles);

    if (error) {
      console.error('Error creating fake profiles:', error);
    } else {
      console.log('Fake profiles created successfully');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};