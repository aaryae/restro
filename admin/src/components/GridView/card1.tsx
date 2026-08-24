import { useEffect, useState } from "react";
import { ArrowUpRight, Mail, Phone, User } from "lucide-react";
import userImage from "@/assets/user_image.jpeg";
import { buildAssetUrl } from "@/utils/buildAssetUrl";
import { cn } from "@/lib/utils";

type Card1Props = {
  handleNewUser: (id: number) => void;
  canEdit?: boolean;
  imageUrl: string | null;
  id: number;
  firstName: string;
  lastName: string;
  gender: string;
  email: string;
  mobileNo: string;
  username?: string;
  roleTitle?: string;
  isActive?: boolean;
};

export default function Card1({
  handleNewUser,
  canEdit = true,
  imageUrl,
  id,
  firstName,
  lastName,
  email,
  mobileNo,
  username,
  roleTitle,
  isActive = true,
}: Readonly<Card1Props>) {
  const [avatarSrc, setAvatarSrc] = useState(() => {
    const src = imageUrl ? buildAssetUrl(imageUrl) : "";
    return src || userImage;
  });

  useEffect(() => {
    const src = imageUrl ? buildAssetUrl(imageUrl) : "";
    setAvatarSrc(src || userImage);
  }, [imageUrl]);

  const fullName =
    [firstName, lastName].filter(Boolean).join(" ") || username || "User";

  return (
    <button
      type="button"
      onClick={() => canEdit && handleNewUser(id)}
      disabled={!canEdit}
      className={cn(
        "group relative w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-4 text-left transition-all duration-200",
        canEdit &&
          "hover:border-slate-300 hover:shadow-[0_8px_30px_rgba(15,23,42,0.06)]",
        canEdit &&
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryColor/25",
        !canEdit && "cursor-default opacity-90",
      )}
    >
      <div className="absolute inset-y-0 left-0 w-1 scale-y-0 bg-primaryColor transition-transform duration-200 group-hover:scale-y-100" />

      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <div className="h-14 w-14 overflow-hidden rounded-full bg-slate-100 ring-2 ring-slate-100">
            <img
              src={avatarSrc}
              alt={fullName}
              className="h-full w-full object-cover"
              onError={() => setAvatarSrc(userImage)}
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-semibold text-slate-900">
                {fullName}
              </h3>
              <p className="mt-0.5 truncate text-sm text-slate-500">
                {username ? `@${username}` : "Staff member"}
              </p>
            </div>

            <span
              className={cn(
                "inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-500",
              )}
            >
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>

          {roleTitle && (
            <span className="mt-2.5 inline-flex rounded-md border border-primaryColor/15 bg-primaryColor/[0.06] px-2 py-0.5 text-xs font-medium text-primaryColor">
              {roleTitle}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
        {email ? (
          <div className="flex items-center gap-2.5 text-sm text-slate-600">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-400">
              <Mail className="h-3.5 w-3.5" />
            </span>
            <span className="truncate">{email}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 text-sm text-slate-400">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-50">
              <Mail className="h-3.5 w-3.5" />
            </span>
            <span>No email</span>
          </div>
        )}

        {mobileNo ? (
          <div className="flex items-center gap-2.5 text-sm text-slate-600">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-400">
              <Phone className="h-3.5 w-3.5" />
            </span>
            <span>{mobileNo}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 text-sm text-slate-400">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-50">
              <Phone className="h-3.5 w-3.5" />
            </span>
            <span>No phone</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs font-medium text-slate-400 transition-colors group-hover:text-primaryColor">
        <span className="inline-flex items-center gap-1">
          <User className="h-3.5 w-3.5" />
          View profile
        </span>
        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}
