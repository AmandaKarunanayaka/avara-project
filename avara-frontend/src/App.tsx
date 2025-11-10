// src/App.tsx
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { HomeLayout } from './layouts/HomeLayout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import { ProjectLayout } from './layouts/ProjectLayout';
import Question from './pages/Question';
import Research from './pages/Research';
import Login from './pages/Login';
import type { JSX } from 'react';

function HomeLayoutWrapper() {
  return (
    <HomeLayout>
      <Outlet />
    </HomeLayout>
  );
}

function ProjectLayoutWrapper() {
  return (
    <ProjectLayout>
      <Outlet />
    </ProjectLayout>
  );
}

/** quick client-side expiry check (optional, but useful) */
function isTokenExpired(token: string | null) {
  if (!token) return true;
  try {
    const payload = token.split('.')[1];
    if (!payload) return true;
    let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const decoded = JSON.parse(atob(base64));
    if (!decoded.exp) return false; // no exp => assume not expired
    return Date.now() / 1000 > decoded.exp;
  } catch {
    return true;
  }
}

function PublicRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('token');
  if (token && !isTokenExpired(token)) return <Navigate to="/" replace />;
  return children;
}

function PrivateRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('token');
  if (!token || isTokenExpired(token)) return <Navigate to="/Login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<HomeLayoutWrapper />}>
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
        </Route>

        {/* Project routes protected */}
        <Route element={<ProjectLayoutWrapper />}>
          <Route path="/Dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/research/:projectId" element={<PrivateRoute><Research /></PrivateRoute>} />
        </Route>

        {/* Public / semi-public */}
        <Route path="/Question" element={<Question />} />
        <Route path="/Login" element={<PublicRoute><Login /></PublicRoute>} />

        {/* Catch-all redirect to login */}
        <Route path="*" element={<Navigate to="/Login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
