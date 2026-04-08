import { Outlet } from 'react-router-dom';
import SideNavBar from './SideNavBar';
import TopNavBar from './TopNavBar';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background">
      <SideNavBar />
      <div className="ml-72 flex flex-col min-h-screen">
        <TopNavBar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
