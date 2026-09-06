import { Outlet } from 'react-router-dom';
import './seller-dashboard.css';

/**
 * Seller Dashboard shell.
 * Wraps every /seller/* route with the Global Store root scope.
 * Each view renders its own full-page chrome (mirrors the HTML mockups).
 */
function SellerDashboard() {
  return (
    <div className="sd-root">
      <Outlet />
    </div>
  );
}

export default SellerDashboard;