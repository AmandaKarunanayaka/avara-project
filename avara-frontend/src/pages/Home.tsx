import type { SVGProps } from "react"
import type { JSX } from "react/jsx-runtime"
import "../css/home.css"
import { Input } from "@/components/ui/input"
import { useState } from "react"

export default function Home() {
  const [showModal, setShowModal] = useState(false)
  const [projectName, setProjectName] = useState("")

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && projectName.trim() !== "") {
      window.location.href = "/question"
    }
  }

  return (
    <>
      <div className={`flex flex-col gap-4 h-full content ${showModal ? "blur-sm" : ""}`}> 
        <section className="main-content">
          <div className="header">
            <h1 className="scroll-m-20 text-center text-4xl tracking-tight text-balance heading">
              Automate. Accelerate. Escape.
            </h1>
          </div>
          <div className="searchbar">
            <div className="flex items-center w-full max-w-lg space-x-2 border px-3.5 py-2 search-bar">
              <SearchIcon className="h-4 w-4 icon" />
              <Input
                type="search"
                placeholder="Search"
                className="w-full border-0 h-8 font-semibold search"
              />
            </div>
          </div>
        </section>

        {/* Cards Section */}
        <div className="content-cards">
          <div className="grid auto-rows-min gap-4 md:grid-cols-4">
            {/* First Card - Add Project */}
            <div
              className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center cursor-pointer hover:bg-muted transition"
              onClick={() => setShowModal(true)}
            >
              <PlusIcon className="h-10 w-10 text-black" />
            </div>

            <div className="aspect-video rounded-xl bg-muted/50" />
            <div className="aspect-video rounded-xl bg-muted/50" />
            <div className="aspect-video rounded-xl bg-muted/50" />
          </div>
        </div>

        <div className="flex-1 rounded-xl bg-muted/50 min-h-0 large-card" />

      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-black rounded-xl p-6 w-[90%] max-w-md shadow-xl text-white">
            <h2 className="text-xl font-semibold mb-4">New Project</h2>
            <Input
              type="text"
              placeholder="Enter project name..."
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={handleEnter}
              className="mb-6 bg-gray-800 text-white border-gray-600"
            />
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowModal(false)}
                className="w-32 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600"
              >
                Close
              </button>
              <button
                onClick={() => {
                  if (projectName.trim() !== "") {
                    window.location.href = "/question"
                  }
                }}
                className="w-32 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function SearchIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function PlusIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  )
}