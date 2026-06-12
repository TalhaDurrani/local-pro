"use client";

import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import {
  Globe,
  User,
  LayoutDashboard,
  LogOut,
  Loader2,
  Moon,
  Sun,
  Settings,
  ShieldAlert,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import EditProfileDialog from "@/components/dashboard/EditProfileDialog";
import NotificationBell from "@/components/notifications/NotificationBell";

export default function Navbar() {
  const { user, loading, language, setLanguage, theme, setTheme, t, logout } = useAppContext();
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full glass-dark py-3 px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center justify-start gap-8">
        <Link
          href={user ? "/dashboard" : "/"}
          className="flex items-end justify-start gap-2 text-2xl font-bold tracking-tighter text-accent"
        >
          <Image
            src="/Pro-local.png"
            alt="ProLocal logo"
            width={36}
            height={36}
            priority
            className="h-9 w-9 object-contain"
          />
          <span className="hidden sm:inline">{t.appName}</span>
        </Link>
        <div className="hidden md:flex items-center gap-4">
          {user && (
            <>
              <Link
                href={user.role === "superadmin" ? "/admin" : "/dashboard"}
                className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
              >
                {t.dashboard}
              </Link>
              {user.role === "superadmin" && (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  {t.admin}
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        {loading && <Loader2 className="h-4 w-4 animate-spin text-accent/50" />}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label={theme === "dark" ? t.lightMode : t.darkMode}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLanguage(language === "en" ? "ur" : "en")}
          aria-label={language === "en" ? t.urdu : t.english}
        >
          <Globe className="h-4 w-4" />
        </Button>

        {user ? (
          <>
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-accent/20 border border-accent/20 overflow-hidden"
                >
                  <User className="h-5 w-5 text-accent-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 glass border-accent/20">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold truncate">{user.full_name}</span>
                  <span className="text-xs font-normal text-foreground/60 truncate">
                    {user.email || user.phone}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-accent mt-1">{user.role}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={user.role === "superadmin" ? "/admin" : "/dashboard"}>
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    {t.dashboard}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setSettingsOpen(true); }}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <EditProfileDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
          </>
        ) : !loading ? (
          <div className="flex items-center gap-2 ml-1">
            <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
              <Link href="/auth?mode=login">{t.login}</Link>
            </Button>
            <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/auth?mode=signup">{t.signUp}</Link>
            </Button>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
