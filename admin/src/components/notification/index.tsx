import {
  useChangeStatusToReadMutation,
  useGetNotificationListQuery,
} from "@/redux/services/notification";
import { useAppSelector } from "@/redux/store/hooks";
import { TimeDifference } from "@/utils/timeDifference";
import { useEffect, useState } from "react";
import Loader from "../Loader";
import { useNavigate } from "react-router-dom";
import { handleError } from "@/utils/responseHandler";
import { messageGenerator } from "@/utils/generalHelper";

// import notificationSound from "@/assets/notifcationSound1.mp3";

interface NotificationType {
  id: number;
  message: string;
  request_id: number;
  updatedAt?: string;
}

type NotificationProps = {
  setOpen: any;
};

const buttonClassName = "h-[2.25rem] w-[6.75rem] rounded-[0.75rem]";

export default function Notification({ setOpen }: NotificationProps) {
  const navigate = useNavigate();

  const [query, setQuery] = useState({ page: 1, limit: 5, isRead: null });
  const [notification, setNotification] = useState<NotificationType[]>([]);

  // const audio = new Audio(notificationSound);

  // const [isSoundEnabled, setIsSoundEnabled] = useState(false);

  const {
    data: notificationData,
    isSuccess: notificationSuccess,
    isLoading: notificationLoading,
    refetch,
  } = useGetNotificationListQuery(query);

  const [changeStatus] = useChangeStatusToReadMutation();

  const newNotificationData = useAppSelector((state) => state.socket.message);

  useEffect(() => {
    if (notificationSuccess && notificationData?.data?.data) {
      setNotification(notificationData.data.data);
    }
  }, [notificationSuccess, notificationData]);

  useEffect(() => {
    if (newNotificationData?.length) {
      // if (true) {
      //   audio
      //     .play()
      //     .catch((error) => console.error("Audio play failed:", error));
      // }
      setNotification((prev) => {
        const combined = [...newNotificationData.slice().reverse(), ...prev];
        return [...new Map(combined.map((each) => [each.id, each])).values()];
      });
    }
  }, [newNotificationData]);

  const filterNotification = (status: boolean | null) => {
    if (status === null) {
      setQuery((prev) => ({
        ...prev,
        isRead: null,
      }));
    } else {
      setQuery((prev) => ({
        ...prev,
        isRead: status,
      }));
    }
    refetch();
  };

  const handleCloseNotification = () => {
    setOpen(false);
  };

  const handleNavigation = async (id: number, isRead: boolean) => {
    if (isRead === true) {
      navigate("/admin/approve-request", { state: { selectedId: id } });
    } else {
      try {
        // note: do not use handle Response function as it gives toast message by default
        await changeStatus(id)
          .unwrap()
          .then((res) => {
            if (res?.success) {
              navigate("/admin/approve-request", { state: { selectedId: id } });
            }
          });
      } catch (error) {
        handleError({ error });
      }
    }
    handleCloseNotification();
  };

  return (
    <section className="p-[1.5rem]">
      {/* Filter Buttons */}
      <div className="flex gap-[0.5rem]">
        <button
          className={`${buttonClassName} bg-[#C50219] text-white`}
          onClick={() => filterNotification(null)}
        >
          All
        </button>
        <button
          className={`${buttonClassName} bg-primaryColor text-white`}
          onClick={() => filterNotification(false)}
        >
          Unread
        </button>
        <button
          className={`${buttonClassName} bg-[#FF80C5] text-white`}
          onClick={() => filterNotification(true)}
        >
          Read
        </button>
      </div>

      {/* Notifications List */}
      <div className="mt-[1.5rem] space-y-[1.5rem]">
        {notificationLoading ? (
          <Loader />
        ) : (
          notification.map((each) => (
            <div
              key={each.id}
              className="flex justify-between items-start cursor-pointer"
              onClick={() => handleNavigation(each.id, each.isRead)}
            >
              <div className="mt-[0.5rem] mr-[1rem] flex flex-col gap-[0.5rem] items-center">
                <div
                  className={`w-[0.75rem] h-[0.75rem] rounded-full ${
                    each.isRead ? "bg-[#FF80C5]" : "bg-primaryColor"
                  }`}
                />
                <div className="w-[1px] h-[4rem] bg-[#a7acb2]" />
              </div>
              <div className="max-w-[22rem]">
                <h4 className="text-[1.125rem] font-[500] leading-[1.75rem]">
                  {each.user
                    ? messageGenerator(
                        each.user,
                        each.userId,
                        each.senderId,
                        each.type,
                      )
                    : each.message}
                </h4>
                <p className="text-[1.125rem] font-[500] leading-[1.75rem]">
                  {each.type}
                </p>
              </div>
              <div className="mt-[0.2rem] ml-[2rem]">
                <p className="text-[1.125rem] font-[500] leading-[1.75rem] opacity-50">
                  {each.updatedAt ? TimeDifference(each.updatedAt) : "recent"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
