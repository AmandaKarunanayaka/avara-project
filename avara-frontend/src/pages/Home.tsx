import type { SVGProps } from 'react';
import type { JSX } from 'react/jsx-runtime';
import '../css/home.css';
import { Input } from "@/components/ui/input"

export default function Home() {
  return (
    <>
      <section className="main-content">
        <div className="header">
          <h1 className="scroll-m-20 text-center text-4xl tracking-tight text-balance heading">
            Automate. Accelerate. Escape.
          </h1>
        </div>
        <div className="searchbar">
          <div className="flex items-center w-full max-w-lg space-x-2 border px-3.5 py-2 search-bar">
            <SearchIcon className="h-4 w-4 icon" />
            <Input type="search" placeholder="Search" className="w-full border-0 h-8 font-semibold search" />
          </div>
        </div>
      </section>
      <div className="content-cards">
      <div className="grid auto-rows-min gap-4 md:grid-cols-4">
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
      </div>
      </div>
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min large-card" />
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