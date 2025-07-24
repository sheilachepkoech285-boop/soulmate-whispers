import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, Send, CreditCard } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Match {
  id: string;
  matched_profile_id: string;
  profiles: {
    name: string;
    profile_picture_url: string;
  };
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_admin_reply: boolean;
}

const Messages = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMatches();
      fetchCredits();
    }
  }, [user]);

  useEffect(() => {
    if (selectedMatch) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [selectedMatch]);

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          matched_profile_id,
          profiles:matched_profile_id (
            name,
            profile_picture_url
          )
        `)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error fetching matches:', error);
        return;
      }

      setMatches(data || []);
    } catch (error) {
      console.error('Error:', error);
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

  const fetchMessages = async () => {
    if (!selectedMatch) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', selectedMatch.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const subscribeToMessages = () => {
    if (!selectedMatch) return;

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${selectedMatch.id}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedMatch || !user) return;

    // Check if user has credits
    if (credits <= 0) {
      toast({
        title: "No credits remaining",
        description: "Purchase more credits to continue messaging",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Send message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          match_id: selectedMatch.id,
          sender_id: user.id,
          content: newMessage,
          is_admin_reply: false
        });

      if (messageError) {
        console.error('Error sending message:', messageError);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive"
        });
        return;
      }

      // Deduct credit
      const { error: creditError } = await supabase
        .from('credits')
        .update({ balance: credits - 1 })
        .eq('user_id', user.id);

      if (creditError) {
        console.error('Error updating credits:', creditError);
      } else {
        setCredits(prev => prev - 1);
      }

      setNewMessage('');
      toast({
        title: "Message sent!",
        description: "Your message has been delivered"
      });
    } catch (error) {
      console.error('Error:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <div className="flex h-screen">
        {/* Matches Sidebar */}
        <div className="w-1/3 border-r bg-white p-4 overflow-y-auto">
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">Your Matches</h2>
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg text-white">
              <Heart className="h-5 w-5" />
              <span className="font-medium">{credits} credits</span>
            </div>
          </div>

          <div className="space-y-3">
            {matches.map((match) => (
              <Card
                key={match.id}
                className={`cursor-pointer transition-colors ${
                  selectedMatch?.id === match.id ? 'bg-pink-50 border-pink-200' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedMatch(match)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={match.profiles.profile_picture_url} />
                      <AvatarFallback>
                        {match.profiles.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{match.profiles.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Tap to start chatting
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {matches.length === 0 && (
            <div className="text-center py-8">
              <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground">No matches yet</p>
              <p className="text-sm text-muted-foreground">Go discover new people!</p>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedMatch ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-white">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedMatch.profiles.profile_picture_url} />
                    <AvatarFallback>
                      {selectedMatch.profiles.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{selectedMatch.profiles.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      <Heart className="h-3 w-3 mr-1" />
                      {credits} credits left
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender_id === user?.id
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                          : 'bg-white border shadow-sm'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender_id === user?.id ? 'text-pink-100' : 'text-muted-foreground'
                        }`}
                      >
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t bg-white">
                {credits > 0 ? (
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      disabled={loading}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || loading}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="mb-2 p-3 bg-gray-50 rounded-lg">
                      <CreditCard className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        You've used all your credits!
                      </p>
                    </div>
                    <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                      Buy More Credits
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">Select a match</h3>
                <p className="text-muted-foreground">
                  Choose someone from your matches to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;