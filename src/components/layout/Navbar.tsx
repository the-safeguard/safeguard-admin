import { Bell, User, LogOut, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@the-safeguard/ui/theme";
import { useAuth } from "../../auth/AuthContext";

export function Navbar() {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  // Shared provider: persists under the suite-wide `sg_theme` key so the choice
  // carries across landing/chat/admin. Light is the default.
  const { theme, toggle: toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <nav className="fixed top-0 right-0 left-0 z-30 bg-background/80 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex-1" />
        <div className="flex items-center gap-6">
          <button
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <button className="relative text-muted-foreground hover:text-foreground transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center">
                <User className="h-4 w-4 text-accent" />
              </div>
              <span className="hidden sm:inline">{user?.name ?? "Account"}</span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-card shadow-lg">
                <div className="px-4 py-3 text-xs text-muted-foreground border-b border-border">
                  {user?.email}
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
