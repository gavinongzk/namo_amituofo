import Footer from "@/components/shared/Footer"
import Header from "@/components/shared/Header"
import NavigationProvider from "@/components/shared/NavigationProvider"
import BackToTopButton from "@/components/shared/BackToTopButton"
import BreadcrumbNavigation from "@/components/shared/BreadcrumbNavigation"
import AdminNavigation from "@/components/shared/AdminNavigation"
import FloatingQuickActions from "@/components/shared/FloatingQuickActions"
import KeyboardNavigation from "@/components/shared/KeyboardNavigation"
import NavigationProgress from "@/components/shared/NavigationProgress"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NavigationProvider>
      <div className="flex h-screen flex-col">
        {/* Navigation Progress Bar */}
        <NavigationProgress />
        
        <Header />
        <main className="flex-1">
          <div className="content-container">
            {/* Breadcrumb Navigation */}
            <BreadcrumbNavigation />
            
            {/* Admin Navigation (only shows on admin pages) */}
            <AdminNavigation />
            
            {children}
          </div>
        </main>
        <Footer />
        
        {/* Back to Top Button */}
        <BackToTopButton />
        
        {/* Floating Quick Actions (mobile) */}
        <FloatingQuickActions />
        
        {/* Keyboard Navigation */}
        <KeyboardNavigation />
      </div>
    </NavigationProvider>
  )
}
