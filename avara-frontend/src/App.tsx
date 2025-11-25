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
import Register from "./pages/Register";
import Risk from "./pages/Risk";
import Core from "./pages/core";
import Roadmap from "./pages/roadmap";
import Task from "./pages/task";

// inside your <Routes>:
<Route path="/risk/:projectId" element={<Risk />} />



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
    if (!decoded.exp) return false; 
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
  if (!token || isTokenExpired(token)) return <Navigate to="/Register" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<HomeLayoutWrapper />}>
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
        </Route>

        <Route element={<ProjectLayoutWrapper />}>
          {/* parametric routes */}
          <Route path="/dashboard/:projectId" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/research/:projectId" element={<PrivateRoute><Research /></PrivateRoute>} />
          <Route path="/risk/:projectId" element={<Risk />} />
          <Route path="/core/:projectId" element={<Core />} />
          <Route path="/roadmap/:projectId" element={<PrivateRoute><Roadmap /></PrivateRoute>} />
          <Route path="/task/:projectId" element={<PrivateRoute><Task /></PrivateRoute>} />

          {/* legacy safety */}
          <Route path="/Dashboard" element={<Navigate to="/" replace />} />
          <Route path="/Research" element={<Navigate to="/" replace />} />
          <Route path="/Risk" element={<Navigate to="/" replace />} />
          <Route path="/Core" element={<Navigate to="/" replace />} />
          <Route path="/Roadmap" element={<Navigate to="/" replace />} />
          <Route path="/Task" element={<Navigate to="/" replace />} />
        </Route>

        {/* Public / semi-public */}
        <Route path="/Question" element={<Question />} />
        <Route path="/Login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/Register" element={<PublicRoute><Register /></PublicRoute>} />


        <Route path="*" element={<Navigate to="/Register" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
