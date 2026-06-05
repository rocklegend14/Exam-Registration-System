import Link from "next/link"
import { useRouter } from "next/navigation"
import { BookOpen, Calendar, CreditCard, Home, LogOut, Users } from "lucide-react"

interface SidebarProps {
  activePage?: string;
}

export function Sidebar({ activePage = "dashboard" }: SidebarProps) {
  const router = useRouter();

  return (
    <div className="w-64 bg-white shadow-md">
      <div className="p-4">
        <h2 className="text-xl font-bold">Admin Dashboard</h2>
      </div>
      <nav className="mt-4">
        <Link 
          href="/dashboard/admin" 
          className={`flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 ${
            activePage === "dashboard" ? "bg-gray-100" : ""
          }`}
        >
          <Home className="w-5 h-5 mr-2" />
          Dashboard
        </Link>
        <Link 
          href="/dashboard/admin/exams" 
          className={`flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 ${
            activePage === "exams" ? "bg-gray-100" : ""
          }`}
        >
          <BookOpen className="w-5 h-5 mr-2" />
          Exams
        </Link>
        <Link 
          href="/dashboard/admin/registrations" 
          className={`flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 ${
            activePage === "registrations" ? "bg-gray-100" : ""
          }`}
        >
          <Users className="w-5 h-5 mr-2" />
          Registrations
        </Link>
        <Link 
          href="/dashboard/admin/payments" 
          className={`flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 ${
            activePage === "payments" ? "bg-gray-100" : ""
          }`}
        >
          <CreditCard className="w-5 h-5 mr-2" />
          Payments
        </Link>
        <button 
          onClick={() => router.push('/auth/login')} 
          className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </button>
      </nav>
    </div>
  );
} 