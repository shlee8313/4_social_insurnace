// File: app/worker/layout.jsx
"use client";

import React from "react";
import { WorkerGuard } from "../components/auth/AuthGuard";
import { WorkerSidebar } from "./components/WorkerSidebar";
import { WorkerHeader } from "./components/WorkerHeader";

export default function WorkerLayout({ children }) {
  return (
    <WorkerGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <WorkerHeader />

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-white shadow-lg">
            <WorkerSidebar />
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
      </div>
    </WorkerGuard>
  );
}
