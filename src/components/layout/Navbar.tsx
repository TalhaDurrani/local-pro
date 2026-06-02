
"use client";

import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { 
  Globe, 
  User, 
  LayoutDashboard, 
  ShieldCheck, 
  LogOut, 
  Zap,
  Menu
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";

export default function Navbar() {
  const { user, language, setLanguage, t, switchRole, setUser } = useAppContext();

  const handleLogout = () => setUser(null);

  const LanguageSwitcher = () => (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
      className="gap-2 font-medium"
    >
      <Globe className="h-4 w-4" />
      {language === 'en' ? t.urdu : t.english}
    </Button>
  );

  return (
    <nav className="sticky top-0 z-50 w-full glass-dark py-3 px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-2xl font-bold tracking-tighter text-pro-sage">
          {t.appName}
        </Link>
        <div className="hidden md:flex items-center gap-4">
          {user && (
            <>
              <Link href="/dashboard" className="text-sm font-medium text-pro-sage/80 hover:text-pro-sage transition-colors">
                {t.dashboard}
              </Link>
              {user.role === 'admin' && (
                <Link href="/admin" className="text-sm font-medium text-pro-sage/80 hover:text-pro-sage transition-colors">
                  {t.admin}
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <LanguageSwitcher />

        {user ? (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={switchRole}
              className="hidden sm:flex border-pro-sage/30 hover:bg-pro-sage/10 text-pro-sage"
            >
              <Zap className="h-4 w-4 mr-2" />
              {user.role === 'seeker' ? t.roleProvider : t.roleSeeker}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full bg-pro-sage/20 border border-pro-sage/20 overflow-hidden">
                  <User className="h-5 w-5 text-pro-sage" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass border-pro-sage/20">
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  {t.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Button asChild size="sm" className="bg-pro-sage text-pro-slate hover:bg-pro-sage/90">
            <Link href="/auth">{t.login}</Link>
          </Button>
        )}

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6 text-pro-sage" />
              </Button>
            </SheetTrigger>
            <SheetContent side={language === 'ur' ? 'right' : 'left'} className="glass-dark border-pro-sage/20">
              <div className="flex flex-col gap-6 mt-8">
                <Link href="/dashboard" className="text-xl font-semibold text-pro-sage">
                  {t.dashboard}
                </Link>
                {user?.role === 'admin' && (
                  <Link href="/admin" className="text-xl font-semibold text-pro-sage">
                    {t.admin}
                  </Link>
                )}
                {user && (
                  <Button variant="outline" className="justify-start border-pro-sage/30 text-pro-sage" onClick={switchRole}>
                    <Zap className="h-4 w-4 mr-2" />
                    {user.role === 'seeker' ? t.roleProvider : t.roleSeeker}
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
