import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, MessageCircle, User, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Discover', path: '/discover' },
    { icon: MessageCircle, label: 'Messages', path: '/messages' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map(({ icon: Icon, label, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              isActive(path)
                ? 'text-pink-600 bg-pink-50'
                : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
            }`}
          >
            <Icon className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Logout</span>
        </Button>
      </div>
    </div>
  );
};

export default BottomNavigation;