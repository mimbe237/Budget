'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function UserNav() {
  const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar');
  const { user, userProfile } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const isFrench = userProfile?.locale === 'fr-CM';

  const handleLogout = () => {
    signOut(auth).then(() => {
      router.push('/login');
    });
  };

  const translations = {
    profile: isFrench ? 'Profil' : 'Profile',
    settings: isFrench ? 'Paramètres' : 'Settings',
    logout: isFrench ? 'Déconnexion' : 'Log out',
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage 
              src={user?.photoURL || userAvatar?.imageUrl} 
              alt="User avatar" 
              data-ai-hint={userAvatar?.imageHint} 
            />
            <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userProfile?.firstName || user?.displayName || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
           <DropdownMenuItem asChild>
             <Link href="/settings">{translations.profile}</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
             <Link href="/settings">{translations.settings}</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          {translations.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
