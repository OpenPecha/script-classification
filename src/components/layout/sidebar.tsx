import { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  FileText,
  Users,
  Layers,
  Package,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Settings,
  BarChart3,
} from 'lucide-react'
import { cn, getInitials, getRoleTranslationKey } from '@/lib/utils'
import { useAuth } from '@/features/auth'
import { useUIStore } from '@/store/use-ui-store'
import { UserRole } from '@/types'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle, LanguageToggle } from '@/components/common'

interface NavItem {
  labelKey: string
  href: string
  icon: React.ElementType
  roles: UserRole[]
}

const CONTRIBUTIONS_ROLES: UserRole[] = [
  UserRole.Admin,
  UserRole.Annotator,
  UserRole.Reviewer,
  UserRole.FinalReviewer,
]

const navItems: NavItem[] = [
  {
    labelKey: 'nav.dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: [UserRole.Admin, UserRole.Annotator, UserRole.Reviewer, UserRole.FinalReviewer],
  },
  {
    labelKey: 'nav.users',
    href: '/admin/users',
    icon: Users,
    roles: [UserRole.Admin],
  },
  {
    labelKey: 'nav.groups',
    href: '/admin/groups',
    icon: Layers,
    roles: [UserRole.Admin],
  },
  {
    labelKey: 'nav.batches',
    href: '/admin/batches',
    icon: Package,
    roles: [UserRole.Admin],
  },
  {
    labelKey: 'nav.userContributions',
    href: '/admin/user-contributions',
    icon: BarChart3,
    roles: CONTRIBUTIONS_ROLES,
  },
]

export function Sidebar() {
  const { t } = useTranslation('common')
  const { currentUser, logout } = useAuth()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const sidebarRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setSettingsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [settingsOpen])

  if (!currentUser) return null

  const filteredNavItems = navItems.filter(
    (item) => currentUser.role && item.roles.includes(currentUser.role)
  )

  const handleLogout = () => {
    logout()
  }

  const toggleSettings = () => {
    setSettingsOpen((prev) => !prev)
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
      sidebarCollapsed && 'justify-center px-2'
    )

  return (
    <aside
      ref={sidebarRef}
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex h-16 items-center justify-between px-4">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-sidebar-foreground font-inter">Script</span>
              <span className="text-xs text-sidebar-foreground/70 font-inter">Classification</span>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8 text-sidebar-foreground"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Separator className="bg-sidebar-border" />

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {filteredNavItems.map((item) => (
          <NavLink key={item.href} to={item.href} className={linkClass}>
            <item.icon className="h-5 w-5 shrink-0" />
            {!sidebarCollapsed && <span>{t(item.labelKey)}</span>}
          </NavLink>
        ))}
      </nav>
      <Separator className="bg-sidebar-border" />

      <div className="p-2">
        <div
          className={cn(
            'overflow-hidden transition-all duration-300 ease-out',
            settingsOpen && !sidebarCollapsed ? 'max-h-40 opacity-100 mb-2' : 'max-h-0 opacity-0'
          )}
        >
          <div className="flex flex-col gap-2 rounded-lg bg-sidebar-accent/50 p-2">
            <LanguageToggle />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              {!sidebarCollapsed && <span className="ml-2">{t('actions.logout')}</span>}
            </Button>
          </div>
        </div>

        <div
          className={cn(
            'flex items-center gap-3 rounded-lg p-2',
            sidebarCollapsed && 'justify-center'
          )}
        >
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={currentUser.picture} alt={currentUser.username} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getInitials(currentUser.username ?? 'No Name')}
            </AvatarFallback>
          </Avatar>
          {!sidebarCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {currentUser.username}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {currentUser.role ? t(`roles.${getRoleTranslationKey(currentUser.role)}`) : ''}
              </p>
            </div>
          )}
          {!sidebarCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8 shrink-0 text-muted-foreground hover:text-sidebar-foreground transition-transform duration-200',
                settingsOpen && 'rotate-90'
              )}
              onClick={toggleSettings}
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  )
}
