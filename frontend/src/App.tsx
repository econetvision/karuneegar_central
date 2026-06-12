import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
          <Route path="/register" element={<AuthLayout><Register /></AuthLayout>} />
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/members" element={<Layout><Members /></Layout>} />
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
          <Route path="/profile/edit" element={<Layout><EditProfile /></Layout>} />
          <Route path="/u/:username" element={<Layout><Profile /></Layout>} />
          <Route path="/family-tree" element={<Layout><FamilyTree /></Layout>} />
          <Route path="/forums" element={<Layout><Forums /></Layout>} />
          <Route path="/forums/:catId" element={<Layout><ForumCategory /></Layout>} />
          <Route path="/forums/thread/:threadId" element={<Layout><ForumThread /></Layout>} />
          <Route path="/matrimony" element={<Layout><Matrimony /></Layout>} />
          <Route path="/matrimony/create" element={<Layout><MatrimonyCreate /></Layout>} />
          <Route path="/matrimony/:profileId" element={<Layout><MatrimonyView /></Layout>} />
          <Route path="/scholarships" element={<Layout><Scholarship /></Layout>} />
          <Route path="/about" element={<Layout><AboutKaruneegar /></Layout>} />
          <Route path="/businesses" element={<Layout><Businesses /></Layout>} />
          <Route path="/business/edit" element={<Layout><EditBusiness /></Layout>} />
          <Route path="/business/:id" element={<Layout><BusinessProfileView /></Layout>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
