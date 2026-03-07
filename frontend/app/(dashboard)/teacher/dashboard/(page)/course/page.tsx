"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { AnimatePresence } from "framer-motion";
import CreateCourseModal from "../../../components/CreateCourseTitleForm";
import { useCourseData } from "@/app/hooks/use-course-data";
import CourseTable from "../../../components/teacher/CourseTable";

export default function CoursePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { ownerCourses, isLoading } = useCourseData(undefined, false);

  return (
    <div className="min-h-screen bg-white dark:bg-abu">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Kursus Saya
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-sm">
              Kelola materi pembelajaran kamu.
            </p>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-black text-white dark:bg-white dark:text-black px-6 py-2.5 rounded-full hover:opacity-90 active:scale-95 transition-all"
          >
            <Icon icon="lucide:plus" width={20} />
            <span className="text-sm tracking-tight font-medium">Materi Baru</span>
          </button>
        </div>

        <div>
          <CourseTable courses={ownerCourses} isLoading={isLoading} />
        </div>
      </div>

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