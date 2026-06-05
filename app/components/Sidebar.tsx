import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, BookOpen, Users, CreditCard, Settings, LogOut } from 'lucide-react';

export function Sidebar() {
  return (
    <div className="hidden w-64 flex-col bg-card p-4 shadow-md md:flex">
      <div className="mb-8 flex items-center space-x-2">
        <div className="text-xl font-bold">
          <span className="text-primary">Exam</span>
          <span>Registration</span>
        </div>
      </div>
      <nav className="flex-1 space-y-2">
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href="/dashboard/admin">
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href="/dashboard/admin/exams">
            <BookOpen className="mr-2 h-4 w-4" />
            Exams
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start bg-accent" asChild>
          <Link href="/dashboard/admin/registrations">
            <Users className="mr-2 h-4 w-4" />
            Registrations
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href="/dashboard/admin/payments">
            <CreditCard className="mr-2 h-4 w-4" />
            Payments
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href="/dashboard/admin/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </Button>
      </nav>
      <div className="pt-4">
        <Button variant="outline" className="w-full justify-start">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
} 