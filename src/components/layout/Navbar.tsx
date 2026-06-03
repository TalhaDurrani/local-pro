"use client";

import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Globe, User, LayoutDashboard, LogOut, Menu, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const { user, loading, language, setLanguage, t } = useAppContext();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
        {loading && <Loader2 className="h-4 w-4 animate-spin text-pro-sage/50" />}
        <LanguageSwitcher />

        {user ? (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full bg-pro-sage/20 border border-pro-sage/20 overflow-hidden">
                  <User className="h-5 w-5 text-pro-sage" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass border-pro-sage/20">
                <div className="px-2 py-1.5 text-xs text-pro-sage/50 border-b border-white/10 mb-1">
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
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}