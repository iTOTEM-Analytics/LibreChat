import Header from "./Header";
import Sidebar from "./Sidebar";
import Breadcrumb from "./Breadcrumb";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {/* Sticky Breadcrumb */}
          <div className="sticky top-0 z-10 bg-gray-50 px-5 pt-5 pb-2">
            <Breadcrumb />
          </div>

          {/* Page Content */}
          <div className="p-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
