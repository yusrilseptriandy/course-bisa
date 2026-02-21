import { Icon } from '@iconify/react';

interface EditorFieldProps {
  label: string;
  children: React.ReactNode;
  isEditing?: boolean;
  onToggleEdit?: () => void;
  charCount?: string;
}

export const EditorField = ({ label, children, isEditing, onToggleEdit, charCount }: EditorFieldProps) => (
  <div className="group border border-gray-200 dark:border-[#3e3e3e] focus-within:border-[#3ea6ff] rounded-lg px-4 py-2 w-full bg-white dark:bg-transparent transition-all relative">
    <div className="flex justify-between items-center mb-1">
      <p className="text-[12px] font-medium text-[#aaaaaa] group-focus-within:text-[#3ea6ff] tracking-wider">
        {label}
      </p>
      {onToggleEdit && (
        <button onClick={onToggleEdit} className="text-zinc-500 hover:text-biru transition-colors">
          <Icon icon={isEditing ? 'proicons:save' : 'lucide:pencil'} width={18} />
        </button>
      )}
    </div>
    {children}
    {charCount && (
      <p className="text-right text-[10px] text-[#aaaaaa] mt-1">{charCount}</p>
    )}
  </div>
);