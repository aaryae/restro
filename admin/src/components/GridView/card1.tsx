import { IMAGE_BASE_URL } from "@/constants";

type Card1Props = {
  handleNewUser: (id: number) => void;
  imageUrl: string | null;
  id: number;
  firstName: string;
  lastName: string;
  gender: string;
  email: string;
  mobileNo: string;
};

export default function Card1({
  handleNewUser,
  imageUrl,
  id,
  firstName,
  lastName,
  gender,
  email,
  mobileNo,
}: Readonly<Card1Props>) {
  return (
    <button
      key={id}
      onClick={() => handleNewUser(id)}
      className="flex gap-[0.75rem] p-[0.75rem] bg-white min-w-[20rem] rounded-[0.75rem] cursor-pointer"
    >
      <div>
        <img
          src={`${IMAGE_BASE_URL}${imageUrl}`}
          alt="User"
          height={60}
          width={60}
          className="rounded-full h-[3.75rem] w-[3.75rem]"
          // crossOrigin="anonymous"
        />
      </div>
      <div className="text-start">
        <div className="pb-[0.5rem] space-y-[2px] mt-[2px]">
          <p>
            <span className="font-[700] text-[1rem] text-[#555621]">
              {firstName}
            </span>
            <br />
            <span className="font-[700] text-[1rem] text-[#555621]">
              {lastName},{" "}
            </span>
            <span className="font-[700] text-[1rem] text-[#B0AF86] capitalize">
              {gender.charAt(0)}
            </span>
          </p>
          <p>User</p>
        </div>

        <p className="mt-[1rem] text-blue-500">{email}</p>
      </div>
    </button>
  );
}
