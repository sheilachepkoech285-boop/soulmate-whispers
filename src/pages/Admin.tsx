import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, MessageCircle, CreditCard, Plus, Coins } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';

interface UserStats {
  id: string;
  user_id: string;
  name: string;
  email: string;
  credits: number;
  matches: number;
  messages: number;
  created_at: string;
}

const Admin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<UserStats[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMessages: 0,
    totalCredits: 0,
    revenue: 0
  });
  const [selectedUserId, setSelectedUserId] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
      fetchDashboardData();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user?.id)
        .single();
      
      setIsAdmin(profile?.is_admin || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all users with their credits
      const { data: usersData } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          name,
          created_at
        `)
        .eq('is_fake_profile', false);

      // Fetch statistics
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_fake_profile', false);

      const { count: totalMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });

      const { data: creditsData } = await supabase
        .from('credits')
        .select('balance');

      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('amount')
        .eq('status', 'completed');

      const totalCredits = creditsData?.reduce((sum, credit) => sum + credit.balance, 0) || 0;
      const revenue = transactionsData?.reduce((sum, transaction) => sum + Number(transaction.amount), 0) || 0;

      setStats({
        totalUsers: totalUsers || 0,
        totalMessages: totalMessages || 0,
        totalCredits,
        revenue
      });

      // Fetch credits for each user
      const processedUsers = [];
      if (usersData) {
        for (const user of usersData) {
          const { data: userCredits } = await supabase
            .from('credits')
            .select('balance')
            .eq('user_id', user.user_id)
            .single();

          processedUsers.push({
            id: user.id,
            user_id: user.user_id,
            name: user.name,
            email: 'user@example.com',
            credits: userCredits?.balance || 0,
            matches: 0,
            messages: 0,
            created_at: user.created_at
          });
        }
        setUsers(processedUsers);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCredits = async () => {
    if (!selectedUserId || !creditAmount) {
      toast.error('Please select a user and enter credit amount');
      return;
    }

    try {
      // First get current balance
      const { data: currentCredits } = await supabase
        .from('credits')
        .select('balance')
        .eq('user_id', selectedUserId)
        .single();

      const newBalance = (currentCredits?.balance || 0) + parseInt(creditAmount);

      const { error } = await supabase
        .from('credits')
        .update({ balance: newBalance })
        .eq('user_id', selectedUserId);

      if (error) throw error;

      toast.success(`Added ${creditAmount} credits successfully`);
      setSelectedUserId('');
      setCreditAmount('');
      fetchDashboardData();
    } catch (error) {
      console.error('Error adding credits:', error);
      toast.error('Failed to add credits');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Manage users, credits, and monitor app activity</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-blue-600" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
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
              <div className="text-3xl font-bold text-green-600">{stats.totalMessages}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Coins className="h-5 w-5 text-yellow-600" />
                Total Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.totalCredits}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-purple-600" />
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">${stats.revenue}</div>
            </CardContent>
          </Card>
        </div>

        {/* Credit Management */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Credits to User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Select User</label>
                <select 
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="">Choose a user...</option>
                  {users.map(user => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.name} (Current: {user.credits} credits)
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Credits Amount</label>
                <Input
                  type="number"
                  placeholder="Enter credits"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                />
              </div>
              <Button 
                onClick={addCredits}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                Add Credits
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Matches</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>
                      <Badge variant={user.credits > 0 ? 'default' : 'destructive'}>
                        {user.credits} credits
                      </Badge>
                    </TableCell>
                    <TableCell>{user.matches}</TableCell>
                    <TableCell>{user.messages}</TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline">Active</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;