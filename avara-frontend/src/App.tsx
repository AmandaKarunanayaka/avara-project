import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { HomeLayout } from './layouts/HomeLayout'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import { ProjectLayout } from './layouts/ProjectLayout'
import Question from './pages/Question'
import Research from './pages/Research'
import Login from './pages/Login'

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
          <Route path="/Research" element={<Research/>} />
        </Route>
        <Route path="/Question" element={<Question />} />
        <Route path="/Login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}