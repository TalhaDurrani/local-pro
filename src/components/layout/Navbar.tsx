"use client";

import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Globe, User, LayoutDashboard, LogOut, Menu, Loader2, Moon, Sun } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const { user, loading, language, setLanguage, theme, setTheme, t, logout } = useAppContext();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

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
        <Link href="/" className="text-2xl font-bold tracking-tighter text-accent">
          {t.appName}
        </Link>
        <div className="hidden md:flex items-center gap-4">
          {user && (
            <>
              <Link href="/dashboard" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
                {t.dashboard}
              </Link>
              {user.role === 'admin' && (
                <Link href="/admin" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
                  {t.admin}
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {loading && <Loader2 className="h-4 w-4 animate-spin text-accent/50" />}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="gap-2 font-medium"
          aria-label={theme === 'dark' ? t.lightMode : t.darkMode}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === 'dark' ? t.lightMode : t.darkMode}
        </Button>
        <LanguageSwitcher />

        {user ? (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full bg-accent/20 border border-accent/20 overflow-hidden">
                  <User className="h-5 w-5 text-accent-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass border-accent/20">
                <div className="px-2 py-1.5 text-xs text-foreground/70 border-b border-border mb-1">
                  {user.phone}
                </div>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    {t.dashboard}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  {t.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : !loading && (
          <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/auth">{t.login}</Link>
          </Button>
        )}

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6 text-accent" />
              </Button>
            </SheetTrigger>
            <SheetContent side={language === 'ur' ? 'right' : 'left'} className="glass-dark border-accent/20">
              <div className="flex flex-col gap-6 mt-8">
                <Link href="/dashboard" className="text-xl font-semibold text-accent">
                  {t.dashboard}
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}