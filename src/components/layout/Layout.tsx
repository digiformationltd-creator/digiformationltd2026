import Header from "./Header";
import Footer from "./Footer";

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col bg-background relative overflow-x-hidden">
    <Header />
    <main className="flex-1 pt-20">{children}</main>
    <Footer />
  </div>
);

export default Layout;
