import { IndianRupee, Monitor, PackageIcon, TrendingUpIcon } from "lucide-react";

export function Logo() {
    return (
        <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white">
                <TrendingUpIcon size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">
                Trade<span className="text-green-600">Pi</span>
            </span>
        </div>
    );
}
