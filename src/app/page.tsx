import Link from "next/link";
import { Paperclip, ArrowUp, ChevronDown, Search } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex h-screen bg-[#171719] font-sans text-gray-300">
      <div className="flex w-full flex-1 flex-col items-center justify-between p-4 md:p-8">
        <div className="mt-8 w-full max-w-lg"></div>
        <div className="mb-3 w-full max-w-lg">
          <div className="flex items-center rounded-xl border border-gray-700/40 bg-[#252528] p-2 shadow-sm transition-all duration-150 focus-within:border-[#7E22CE]/70">
            <input
              type="text"
              placeholder="Type your message here..."
              className="flex-grow bg-transparent px-2.5 py-1 text-sm text-gray-200 placeholder-gray-500 focus:outline-none" // Adjusted padding
            />
            <button className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-[#303033] hover:text-gray-200">
              <Paperclip className="h-4 w-4" />
            </button>
            <button className="ml-1.5 rounded-lg bg-[#7E22CE] p-1.5 text-gray-100 transition-colors hover:bg-[#8F33D6]">
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-1.5 flex items-center justify-between px-2 text-[0.6875rem] text-gray-500">
            <div className="flex items-center space-x-1">
              <span>Gemini 2.5 Flash</span>
              <ChevronDown className="h-2.5 w-2.5 text-gray-500" />
            </div>
            <div className="flex cursor-pointer items-center space-x-1 hover:text-gray-300">
              <Search className="h-3 w-3" />
              <span>Search</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
