import DigiNav from "@/components/DigiNav";
import DigiFooter from "@/components/DigiFooter";
import UserDrawer from "@/components/UserDrawer";

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
    <DigiNav />
    <main className="flex-1 pt-20 sm:pt-24">{children}</main>
    <DigiFooter />
    <UserDrawer />
  </div>
);

export default Layout;

