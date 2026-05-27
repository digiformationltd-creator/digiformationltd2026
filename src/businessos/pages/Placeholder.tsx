import { Construction } from "lucide-react";

export default function Placeholder({ title, description }: { title: string; description?: string }) {
  return (
    <div className="os-glass p-12 text-center">
      <div className="w-14 h-14 rounded-2xl mx-auto bg-gradient-to-br from-blue-500/20 to-purple-500/20 grid place-items-center mb-4">
        <Construction className="w-6 h-6 text-blue-300" />
      </div>
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="text-sm text-white/50 mt-2 max-w-md mx-auto">
        {description || "This module is part of Phase 2. The shell, schema and bridge to the existing email engine are ready — UI ships next."}
      </p>
    </div>
  );
}
