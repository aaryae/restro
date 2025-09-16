import { IoMdArrowRoundBack } from "react-icons/io";
import { useLocation, useNavigate } from "react-router-dom";

export default function PageTitle({
  title,
  isBack = false,
  className,
}: {
  title: string;
  isBack?: boolean;
  className?: string;
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleNavigation = () => {
    const path = pathname.split("/");
    navigate(`/admin/${path[path.length - 2]}/list`);
  };

  return (
    <div className="text-start flex items-center gap-[1rem] mb-[2rem]">
      {isBack && (
        <button className="hover:text-primaryColor" onClick={handleNavigation}>
          <IoMdArrowRoundBack size={20} />
        </button>
      )}
      <p className={`text-[1.25rem] font-[700] ${className}`}>{title}</p>
    </div>
  );
}
