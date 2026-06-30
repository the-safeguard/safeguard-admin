import { BarChart3, BookOpen, Shield, Users, FileText, Zap, Settings, Radar, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { LogoMark } from "@the-safeguard/ui/brand";

const navItems = [
  { id: "overview", label: "Overview", icon: BarChart3, href: "/dashboard" },
  { id: "discovery", label: "Shadow AI", icon: Radar, href: "/discovery" },
  { id: "policies", label: "Policies", icon: Shield, href: "/policies" },
  { id: "knowledge", label: "Knowledge", icon: BookOpen, href: "/knowledge" },
  { id: "users", label: "Users & Teams", icon: Users, href: "/users" },
  { id: "logs", label: "Usage Logs", icon: FileText, href: "/logs" },
  { id: "extensions", label: "Extensions", icon: Zap, href: "/extensions" },
  { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
];

export function Sidebar() {
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg hover:bg-muted md:hidden"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside
        className={`fixed left-4 top-4 bottom-4 w-64 z-40 rounded-2xl bg-sidebar transition-all duration-300 shadow-lg border border-border/50 ${
          isOpen ? "translate-x-0" : "-translate-x-[280px] md:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full px-4 py-6 gap-8">
          <div className="flex items-center gap-2 px-2">
            <LogoMark size={30} />
            <span className="text-lg font-bold text-sidebar-foreground">SafeGuard</span>
          </div>

          <nav className="flex flex-col gap-2 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-sidebar-border pt-4">
            <div className="bg-sidebar-accent/20 rounded-lg p-3">
              <p className="text-xs text-sidebar-foreground font-semibold mb-1">GDPR & CCPA</p>
              <p className="text-xs text-sidebar-foreground/70">Compliant Platform</p>
            </div>
          </div>
        </div>
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setIsOpen(false)} />
      )}
    </>
  );
}
