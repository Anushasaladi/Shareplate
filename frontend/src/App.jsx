import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { homePathFor, useAuth } from './context/AuthContext.jsx';
import AddFood from './pages/AddFood.jsx';
import BrowseFoodPage from './pages/BrowseFoodPage.jsx';
import DonationHistory from './pages/DonationHistory.jsx';
import DonorDashboard from './pages/DonorDashboard.jsx';
import EditFood from './pages/EditFood.jsx';
import FoodDetails from './pages/FoodDetails.jsx';
import Home from './pages/Home.jsx';
import IncomingRequests from './pages/IncomingRequests.jsx';
import Login from './pages/Login.jsx';
import MyListings from './pages/MyListings.jsx';
import MyRequests from './pages/MyRequests.jsx';
import NotFound from './pages/NotFound.jsx';
import Profile from './pages/Profile.jsx';
import RecipientDashboard from './pages/RecipientDashboard.jsx';
import Register from './pages/Register.jsx';

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to={homePathFor(user)} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

      <Route element={<ProtectedRoute role="Donor" />}>
        <Route path="/donor" element={<DashboardLayout />}>
          <Route index element={<DonorDashboard />} />
          <Route path="add-food" element={<AddFood />} />
          <Route path="listings" element={<MyListings />} />
          <Route path="foods/:id/edit" element={<EditFood />} />
          <Route path="foods/:id" element={<FoodDetails />} />
          <Route path="requests" element={<IncomingRequests />} />
          <Route path="browse" element={<BrowseFoodPage />} />
          <Route path="history" element={<DonationHistory />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute role="Recipient" />}>
        <Route path="/recipient" element={<DashboardLayout />}>
          <Route index element={<RecipientDashboard />} />
          <Route path="foods/:id" element={<FoodDetails />} />
          <Route path="requests" element={<MyRequests />} />
          <Route path="history" element={<DonationHistory />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
