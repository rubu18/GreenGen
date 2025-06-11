
import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import DarkModeToggle from "./DarkModeToggle";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 ml-64">
          <div className="flex justify-end p-4">
            <DarkModeToggle />
          </div>
          <main className="p-8 pt-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
