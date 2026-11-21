import React from "react";
import { FaRegCalendarAlt } from "react-icons/fa";
import type { AttendanceStatus } from "unihub-community-sdk";

export const EventBox: React.FC<{
  event: EventData;
  isSelected: boolean;
  onClick: () => void;
  onClose: () => void;
  isHidden: boolean;
  attendanceStatus?: AttendanceStatus;
  attendanceBusy?: boolean;
  attendanceMessage?: string;
  onJoin?: () => void;
  onViewQR?: () => void;
  canJoin?: boolean;
}> = ({
  event,
  isSelected,
  onClick,
  onClose,
  isHidden,
  attendanceStatus,
  attendanceBusy,
  attendanceMessage,
  onJoin,
  onViewQR,
  canJoin = true,
}) => {
  const truncateContent = (content: string, length: number) => {
    return content.length > length ? content.substring(0, length) + "..." : content;
  };
  const parsedDate = event.date ? new Date(event.date) : null;
  const formattedDate =
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? new Intl.DateTimeFormat("tr-TR", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(parsedDate)
      : "Tarih belirtilmemiş";

  return (
    <div
      className={`relative cursor-pointer border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg shadow-md transition-all duration-500 ease-in-out ${
        isSelected ? "w-full h-auto py-10 px-10" : "w-full h-20 overflow-hidden"
      } ${isHidden ? "hidden" : "block"} p-3`}
      onClick={!isSelected ? onClick : undefined} 
    >
      
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation(); 
            onClose();
          }}
          className="absolute top-2 right-2 bg-[#1a264e] dark:bg-white text-white dark:text-gray-900 p-2 w-8 h-8 flex items-center justify-center rounded-full shadow-lg transform transition-transform duration-300 ease-in-out hover:scale-105 hover:bg-transparent dark:hover:bg-transparent hover:border-2 border-gray-900 hover:text-gray-900 dark:border-white dark:hover:text-white"
          aria-label="Close"
        >
          ✕
        </button>
      )}

      <div className="flex justify-between md:justify-start items-center space-x-6">
        <h3 className="text-sm md:text-lg font-semibold text-black dark:text-white">
          {event.header}
        </h3>
        <div className="flex items-center space-x-1">
          <FaRegCalendarAlt className="text-gray-500 dark:text-gray-400" />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formattedDate}
          </p>
        </div>
      </div>
      <p
        className={`mt-1 md:mt-2 text-gray-600 dark:text-gray-300 text-sm md:text-base ${
          !isSelected ? "line-clamp-2" : ""
        }`}
        dangerouslySetInnerHTML={{
          __html: isSelected ? event.content : truncateContent(event.content, 70),
        }}
      />

      {isSelected && (
        <div className="mt-5 flex flex-wrap items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {attendanceMessage && (
            <p className="w-full text-sm font-medium text-red-600 dark:text-red-400">
              {attendanceMessage}
            </p>
          )}

          {attendanceStatus === "JOINED" ? (
            <>
              <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                Katılımınız doğrulandı
              </span>
              {onViewQR && (
                <button
                  type="button"
                  onClick={onViewQR}
                  className="rounded-full bg-[#1a264e] px-5 py-2 text-sm font-semibold text-white dark:bg-white dark:text-[#1a264e]"
                >
                  Karekodu görüntüle
                </button>
              )}
            </>
          ) : attendanceStatus === "PENDING_APPROVAL" ? (
            <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              Katılımınız bekleme listesinde
            </span>
          ) : canJoin ? (
            <button
              type="button"
              onClick={onJoin}
              disabled={attendanceBusy}
              className="rounded-full bg-[#1a264e] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-[#1a264e]"
            >
              {attendanceBusy ? "İşleniyor..." : "Etkinliğe Katıl"}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};
