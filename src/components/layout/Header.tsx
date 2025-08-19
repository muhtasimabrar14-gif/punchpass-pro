import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Dumbbell, Calendar, Users, Settings, LogOut, CreditCard, TrendingUp, QrCode, Upload } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const Header = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 text-xl font-bold">
          <Dumbbell className="h-6 w-6" />
          <span>PunchPass Pro</span>
        </Link>

        {user ? (
          <div className="flex items-center space-x-4">
            <nav className="hidden lg:flex items-center space-x-1">
              <Button variant={isActive('/dashboard') ? 'secondary' : 'ghost'} asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button variant={isActive('/classes') ? 'secondary' : 'ghost'} asChild>
                <Link to="/classes">Classes</Link>
              </Button>
              <Button variant={isActive('/members') ? 'secondary' : 'ghost'} asChild>
                <Link to="/members">Members</Link>
              </Button>
              <Button variant={isActive('/memberships') ? 'secondary' : 'ghost'} asChild>
                <Link to="/memberships">Memberships</Link>
              </Button>
            </nav>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user.user_metadata?.display_name?.[0] || user.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">
                      {user.user_metadata?.display_name || user.email}
                    </p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/analytics">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Analytics
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/qr-scanner">
                    <QrCode className="mr-2 h-4 w-4" />
                    QR Scanner
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/import">
                    <Upload className="mr-2 h-4 w-4" />
                    Import Data
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button variant="hero" asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;