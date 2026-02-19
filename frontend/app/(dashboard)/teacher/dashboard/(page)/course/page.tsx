"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { AnimatePresence } from "framer-motion";
import CreateCourseModal from "../../../components/CreateCourseTitleForm";

export default function CoursePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="bg-black text-white p-2 flex items-center justify-center gap-1 dark:bg-white dark:text-black rounded-full hover:scale-105 active:scale-95 transition-all"
      >
        <Icon icon={"lucide:plus"} width={20} />
        <p className="pr-1 text-sm font-semibold tracking-tight">
          Materi baru
        </p>
      </button>

      <AnimatePresence>
        {isModalOpen && (
          <CreateCourseModal 
            onClose={() => setIsModalOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}