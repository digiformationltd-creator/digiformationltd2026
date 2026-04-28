import DigiNav from "@/components/DigiNav";
import DigiFooter from "@/components/DigiFooter";

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
    <DigiNav />
    <main className="flex-1 pt-24">{children}</main>
    <DigiFooter />
  </div>
);

export default Layout;
