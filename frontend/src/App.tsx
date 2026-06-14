import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Members from './pages/Members';
import FamilyTree from './pages/FamilyTree';
import Forums from './pages/Forums';
import ForumCategory from './pages/ForumCategory';
import ForumThread from './pages/ForumThread';
import Matrimony from './pages/Matrimony';
import MatrimonyCreate from './pages/MatrimonyCreate';
import MatrimonyView from './pages/MatrimonyView';
import Businesses from './pages/Businesses';
import BusinessProfileView from './pages/BusinessProfileView';
import EditBusiness from './pages/EditBusiness';
import AboutKaruneegar from './pages/AboutKaruneegar';
import Scholarship from './pages/Scholarship';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-saffron-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to={`/login?from=${encodeURIComponent(location.pathname)}`} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
          <Route path="/register" element={<AuthLayout><Register /></AuthLayout>} />
          {/* Public routes */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/about" element={<Layout><AboutKaruneegar /></Layout>} />

          {/* Protected service routes — require login */}
          <Route path="/members" element={<Layout><PrivateRoute><Members /></PrivateRoute></Layout>} />
          <Route path="/profile" element={<Layout><PrivateRoute><Profile /></PrivateRoute></Layout>} />
          <Route path="/profile/edit" element={<Layout><PrivateRoute><EditProfile /></PrivateRoute></Layout>} />
          <Route path="/u/:username" element={<Layout><PrivateRoute><Profile /></PrivateRoute></Layout>} />
          <Route path="/family-tree" element={<Layout><PrivateRoute><FamilyTree /></PrivateRoute></Layout>} />
          <Route path="/forums" element={<Layout><PrivateRoute><Forums /></PrivateRoute></Layout>} />
          <Route path="/forums/:catId" element={<Layout><PrivateRoute><ForumCategory /></PrivateRoute></Layout>} />
          <Route path="/forums/thread/:threadId" element={<Layout><PrivateRoute><ForumThread /></PrivateRoute></Layout>} />
          <Route path="/matrimony" element={<Layout><PrivateRoute><Matrimony /></PrivateRoute></Layout>} />
          <Route path="/matrimony/create" element={<Layout><PrivateRoute><MatrimonyCreate /></PrivateRoute></Layout>} />
          <Route path="/matrimony/:profileId" element={<Layout><PrivateRoute><MatrimonyView /></PrivateRoute></Layout>} />
          <Route path="/scholarships" element={<Layout><PrivateRoute><Scholarship /></PrivateRoute></Layout>} />
          <Route path="/businesses" element={<Layout><PrivateRoute><Businesses /></PrivateRoute></Layout>} />
          <Route path="/business/edit" element={<Layout><PrivateRoute><EditBusiness /></PrivateRoute></Layout>} />
          <Route path="/business/:id" element={<Layout><PrivateRoute><BusinessProfileView /></PrivateRoute></Layout>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
