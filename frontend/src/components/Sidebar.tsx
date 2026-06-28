import { useReaderStore } from "@/store/readerStore";
import { UserButton, SignInButton } from "@clerk/nextjs";
import { isClerkMocked } from "@/lib/auth-helper";
import { useAppAuth } from "@/hooks/useAppAuth";
import { 
  BookOpen, 
  StickyNote, 
  BarChart3, 
  Moon, 
  Sun, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  FolderOpen
} from "lucide-react";

interface SidebarProps {
  currentView: "library" | "notes" | "analytics";
  setCurrentView: (view: "library" | "notes" | "analytics") => void;
}

export default function Sidebar({ currentView, setCurrentView }: SidebarProps) {
  const { theme, setTheme, sidebarOpen, toggleSidebar } = useReaderStore();
  const isMock = isClerkMocked();
  const { isSignedIn } = useAppAuth();

  const navigationItems = [
    { id: "library", label: "Library", icon: BookOpen },
    { id: "notes", label: "Saved Notes", icon: StickyNote },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ] as const;

  return (
    <aside 
      className={`h-screen flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 relative ${
        sidebarOpen ? "w-64" : "w-16"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-slate-200 dark:border-slate-800 justify-between">
        {sidebarOpen ? (
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span className="bg-indigo-600 text-white p-1.5 rounded-lg">
              <FolderOpen size={18} />
            </span>
            <span>ReadLens <span className="text-indigo-600 dark:text-indigo-400">AI</span></span>
          </h1>
        ) : (
          <div className="bg-indigo-600 text-white p-2 rounded-lg mx-auto">
            <FolderOpen size={18} />
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center rounded-xl p-3 text-sm font-medium transition-all gap-3 ${
                isActive 
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"
              }`}
            >
              <Icon size={20} className={isActive ? "text-indigo-600 dark:text-indigo-400" : ""} />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Settings (Theme Toggles) */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
        {sidebarOpen ? (
          <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setTheme("light")}
              className={`flex justify-center py-1.5 rounded-lg text-xs font-semibold ${
                theme === "light" 
                  ? "bg-white text-slate-800 shadow" 
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Sun size={14} className="mr-1" /> Light
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex justify-center py-1.5 rounded-lg text-xs font-semibold ${
                theme === "dark" 
                  ? "bg-slate-900 text-white shadow" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Moon size={14} className="mr-1" /> Dark
            </button>
            <button
              onClick={() => setTheme("sepia")}
              className={`flex justify-center py-1.5 rounded-lg text-xs font-semibold ${
                theme === "sepia" 
                  ? "bg-[#e4dcc4] text-[#5b4636] shadow" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
              }`}
            >
              <Eye size={14} className="mr-1" /> Sepia
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button 
              onClick={() => setTheme(theme === "light" ? "dark" : theme === "dark" ? "sepia" : "light")}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              {theme === "light" ? <Sun size={18} /> : theme === "dark" ? <Moon size={18} /> : <Eye size={18} />}
            </button>
          </div>
        )}
      </div>

      {/* User Section / Authentication */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between min-h-16">
        <div className="flex items-center gap-3 w-full">
          {isMock ? (
            /* Mock User View */
            <div className="flex items-center gap-3 w-full">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                D
              </div>
              {sidebarOpen && (
                <div className="flex flex-col truncate">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">Dev Mode</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">Local Bypass</span>
                </div>
              )}
            </div>
          ) : (
            /* Clerk Active Auth */
            <>
              {isSignedIn ? (
                <>
                  <UserButton />
                  {sidebarOpen && (
                    <div className="flex flex-col truncate">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">Account</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Signed In</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 justify-center w-full">
                  {sidebarOpen ? (
                    <SignInButton mode="modal">
                      <button className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg w-full">
                        Sign In
                      </button>
                    </SignInButton>
                  ) : (
                    <SignInButton mode="modal">
                      <button className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                        <LogOut size={16} />
                      </button>
                    </SignInButton>
                  )}
                </div>
              )}
            </>
          )}
        </div>


        {/* Collapse Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 p-1 rounded-full shadow hover:bg-slate-50 dark:hover:bg-slate-700 z-20"
        >
          {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>
      </div>
    </aside>
  );
}
