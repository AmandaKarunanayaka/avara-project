import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { HomeLayout } from './layouts/HomeLayout'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard' 
import { ProjectLayout } from './layouts/ProjectLayout'
function HomeLayoutWrapper() {
  return (
    <HomeLayout>
      <Outlet />
    </HomeLayout>
  )
}

function ProjectLayoutWrapper() {
  return (
    <ProjectLayout>
      <Outlet />    
    </ProjectLayout>
  )
}

export default function App() {
  console.log('App component rendering')
  
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<HomeLayoutWrapper />}>
          <Route path="/" element={<Home />} />
        </Route>

        <Route element={<ProjectLayoutWrapper />}>
          <Route path="/Dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}