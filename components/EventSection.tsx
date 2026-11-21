"use client";

import React, { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  UniHubError,
  type AttendanceStatus,
  type EventForm,
  type FormAnswer,
} from "unihub-community-sdk";
import leftGradient from "../public/images/event-lb.svg";
import rightGradient from "../public/images/event-rm.svg";
import { EventBox } from "./EventBox";
import { PageCard } from "./PageCard";
import { EVENTS_DATA } from "@/utils/constants";
import { createUniHubClient } from "@/features/unihub/client";

type EventTab = "upcoming" | "past";
const PAGE_SIZE = 10;

export default function EventSection({
  events,
  unihubKey,
}: {
  events: EventData[];
  unihubKey?: string;
}) {
  const unihub = useMemo(() => createUniHubClient(unihubKey), [unihubKey]);
  const [tab, setTab] = useState<EventTab>("upcoming");
  const [page, setPage] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [displayEvents, setDisplayEvents] = useState<EventData[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attendanceStatuses, setAttendanceStatuses] = useState<Record<number, AttendanceStatus>>({});
  const [attendanceBusy, setAttendanceBusy] = useState<number | null>(null);
  const [attendanceMessages, setAttendanceMessages] = useState<Record<number, string>>({});
  const [formEventId, setFormEventId] = useState<number | null>(null);
  const [eventForm, setEventForm] = useState<EventForm | null>(null);
  const [formAnswers, setFormAnswers] = useState<Record<number, string>>({});
  const [qrEventId, setQrEventId] = useState<number | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");

  const fallbackPages = useMemo(() => {
    const now = Date.now();
    const filtered = events
      .filter((event) => {
        if (!event.date) return tab === "past";
        const date = new Date(event.date).getTime();
        return tab === "upcoming" ? date >= now : date < now;
      })
      .sort((a, b) => {
        const difference = new Date(a.date).getTime() - new Date(b.date).getTime();
        return tab === "past" ? -difference : difference;
      });

    return {
      items: filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
      totalPages: Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
    };
  }, [events, page, tab]);

  useEffect(() => {
    if (!unihub) {
      setDisplayEvents(fallbackPages.items);
      setTotalPages(fallbackPages.totalPages);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError("");

    unihub.events
      .list({ when: tab, page, size: PAGE_SIZE })
      .then((result) => {
        if (!active) return;
        setDisplayEvents(
          result.items.map((event) => ({
            unihubId: event.id,
            header: event.title,
            date: event.startsAt ?? "",
            content: event.location ? `Konum: ${event.location}` : "Konum belirtilmemiş",
          }))
        );
        setTotalPages(Math.max(1, result.totalPages));
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setDisplayEvents([]);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Etkinlikler yüklenemedi."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [tab, page, fallbackPages]);

  const changeTab = (nextTab: EventTab) => {
    setTab(nextTab);
    setPage(0);
    setSelectedEvent(null);
  };

  const selectEvent = async (index: number) => {
    setSelectedEvent(index);
    const event = displayEvents[index];
    if (!unihub || !event.unihubId) return;

    try {
      const detail = await unihub.events.get(event.unihubId);
      setDisplayEvents((current) =>
        current.map((item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                content: detail.description || item.content,
                date: detail.startsAt ?? item.date,
              }
            : item
        )
      );

      if (unihub.auth.current()) {
        const attendance = await unihub.attendance.status(event.unihubId);
        setAttendanceStatuses((current) => ({
          ...current,
          [event.unihubId as number]: attendance.status,
        }));
      }
    } catch {
      setDisplayEvents((current) => [...current]);
    }
  };

  const joinEvent = async (eventId: number) => {
    if (!unihub) return;
    setAttendanceBusy(eventId);
    setAttendanceMessages((current) => ({ ...current, [eventId]: "" }));

    try {
      if (!unihub.auth.current()) {
        await unihub.auth.signIn();
      }

      const result = await unihub.attendance.join(eventId);
      setAttendanceStatuses((current) => ({
        ...current,
        [eventId]: result.status === "PENDING_APPROVAL" ? "PENDING_APPROVAL" : "JOINED",
      }));
    } catch (requestError: unknown) {
      if (requestError instanceof UniHubError) {
        if (requestError.code === "SIGN_IN_CANCELLED") {
          return;
        } else if (requestError.code === "NOT_SIGNED_IN") {
          setAttendanceMessages((current) => ({
            ...current,
            [eventId]: "Lütfen önce UniHub ile giriş yapın.",
          }));
        } else if (requestError.code === "FORM_REQUIRED") {
          try {
            const form = await unihub.attendance.form(eventId);
            if (form.appRequired) {
            setAttendanceMessages((current) => ({
              ...current,
              [eventId]: "Bu başvuru formu belge istiyor. Başvurunuzu UniHub uygulamasından tamamlayın.",
            }));
            } else {
            setEventForm(form);
            setFormEventId(eventId);
            setFormAnswers({});
            }
          } catch (formError: unknown) {
            setAttendanceMessages((current) => ({
            ...current,
            [eventId]:
              formError instanceof UniHubError ? formError.message : "Başvuru formu yüklenemedi.",
            }));
          }
        } else if (requestError.code === "POPUP_BLOCKED") {
          await unihub.auth.signIn({ mode: "redirect" });
        } else {
          setAttendanceMessages((current) => ({
            ...current,
            [eventId]: requestError.message,
          }));
        }
      } else {
        setAttendanceMessages((current) => ({
          ...current,
          [eventId]: "Etkinliğe katılım işlemi yapılamadı.",
        }));
      }
    } finally {
      setAttendanceBusy(null);
    }
  };

  const submitApplication = async () => {
    if (!unihub || formEventId === null || !eventForm) return;
    setAttendanceBusy(formEventId);
    setAttendanceMessages((current) => ({ ...current, [formEventId]: "" }));

    const answers: FormAnswer[] = eventForm.questions.map((question) => ({
      questionId: question.id,
      answer: formAnswers[question.id] ?? "",
    }));

    try {
      const result = await unihub.attendance.apply(formEventId, answers);
      setAttendanceStatuses((current) => ({
        ...current,
        [formEventId]:
          result.status === "PENDING_APPROVAL" ? "PENDING_APPROVAL" : "JOINED",
      }));
      setFormEventId(null);
      setEventForm(null);
    } catch (requestError: unknown) {
      setAttendanceMessages((current) => ({
        ...current,
        [formEventId]:
          requestError instanceof UniHubError
            ? requestError.message
            : "Başvurunuz gönderilemedi.",
      }));
    } finally {
      setAttendanceBusy(null);
    }
  };

  const viewQRCode = async (eventId: number) => {
    if (!unihub) return;
    setAttendanceBusy(eventId);
    setAttendanceMessages((current) => ({ ...current, [eventId]: "" }));

    try {
      const ticket = await unihub.attendance.ticket(eventId);
      const dataUrl = await QRCode.toDataURL(ticket.qrPayload, {
        errorCorrectionLevel: "M",
        width: 280,
        margin: 2,
      });
      setQrDataUrl(dataUrl);
      setQrEventId(eventId);
    } catch (requestError: unknown) {
      setAttendanceMessages((current) => ({
        ...current,
        [eventId]:
          requestError instanceof UniHubError
            ? requestError.message
            : "Karekod oluşturulamadı.",
      }));
    } finally {
      setAttendanceBusy(null);
    }
  };

  return (
    <div
      id="events"
      className="relative w-screen min-h-screen overflow-hidden bg-white dark:bg-gray-900"
    >
      <div
        className="absolute top-[7%] right-[-10%] h-[800px] w-[700px] bg-contain bg-no-repeat opacity-60 md:opacity-80 z-0"
        style={{ backgroundImage: `url(${rightGradient.src})` }}
      />
      <div
        className="absolute bottom-[1%] left-[-15%] h-[700px] w-[750px] bg-contain bg-no-repeat opacity-70 z-0"
        style={{ backgroundImage: `url(${leftGradient.src})` }}
      />

      <div className="absolute inset-0 flex justify-center pt-2 md:pt-0 md:items-center">
        <div className="relative z-10 flex w-full max-w-7xl flex-col items-center p-4 md:px-24">
          <div className="flex flex-col self-center items-center md:self-start md:items-start">
            <PageCard content={EVENTS_DATA.cardContent} backgroundColor="#8F99C2" />
            <h1 className="my-2 text-3xl font-bold sm:text-5xl md:my-6 dark:text-white">
              {EVENTS_DATA.title}
            </h1>
          </div>

          <div className="mb-4 flex rounded-full bg-gray-100 p-1 dark:bg-gray-800" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "upcoming"}
              onClick={() => changeTab("upcoming")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors md:px-7 ${
                tab === "upcoming"
                  ? "bg-[#1a264e] text-white dark:bg-white dark:text-[#1a264e]"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              Yaklaşan Etkinlikler
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "past"}
              onClick={() => changeTab("past")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors md:px-7 ${
                tab === "past"
                  ? "bg-[#1a264e] text-white dark:bg-white dark:text-[#1a264e]"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              Geçmiş Etkinlikler
            </button>
          </div>

          <div className="w-full max-h-[520px] overflow-y-auto pr-1 space-y-3 md:space-y-4">
            {loading ? (
              <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                Etkinlikler yükleniyor...
              </div>
            ) : error ? (
              <div className="rounded-lg border border-red-200 bg-white p-6 text-center text-red-600 dark:border-red-900 dark:bg-gray-800">
                {error}
              </div>
            ) : displayEvents.length ? (
              displayEvents.map((event, index) => (
                <EventBox
                  key={event.unihubId ?? `${event.header}-${event.date}-${index}`}
                  event={event}
                  isSelected={selectedEvent === index}
                  onClick={() => selectEvent(index)}
                  onClose={() => setSelectedEvent(null)}
                  isHidden={selectedEvent !== null && selectedEvent !== index}
                  attendanceStatus={
                    event.unihubId ? attendanceStatuses[event.unihubId] : undefined
                  }
                  attendanceBusy={
                    event.unihubId ? attendanceBusy === event.unihubId : false
                  }
                  attendanceMessage={
                    event.unihubId ? attendanceMessages[event.unihubId] : undefined
                  }
                  onJoin={
                    event.unihubId ? () => joinEvent(event.unihubId as number) : undefined
                  }
                  onViewQR={
                    event.unihubId ? () => viewQRCode(event.unihubId as number) : undefined
                  }
                />
              ))
            ) : (
              <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                Bu bölümde etkinlik bulunmuyor.
              </div>
            )}
          </div>

          <nav
            aria-label="Etkinlik sayfalari"
            className="mt-5 flex items-center justify-center gap-2"
          >
            <button
              type="button"
              disabled={page === 0}
              onClick={() => {
                setPage((current) => Math.max(0, current - 1));
                setSelectedEvent(null);
              }}
              className="h-9 rounded-full border border-gray-300 px-3 text-sm disabled:opacity-40 dark:border-gray-600 dark:text-white"
            >
              Önceki
            </button>
            {Array.from({ length: totalPages }, (_, index) => index).map((index) => (
              <button
                type="button"
                key={index}
                aria-current={page === index ? "page" : undefined}
                onClick={() => {
                  setPage(index);
                  setSelectedEvent(null);
                }}
                className={`h-9 w-9 rounded-full text-sm font-semibold ${
                  page === index
                    ? "bg-[#1a264e] text-white dark:bg-white dark:text-[#1a264e]"
                    : "border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200"
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => {
                setPage((current) => Math.min(totalPages - 1, current + 1));
                setSelectedEvent(null);
              }}
              className="h-9 rounded-full border border-gray-300 px-3 text-sm disabled:opacity-40 dark:border-gray-600 dark:text-white"
            >
              Sonraki
            </button>
          </nav>
        </div>
      </div>

      {formEventId !== null && eventForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold dark:text-white">Katılım Başvuru Formu</h2>
              <button
                type="button"
                aria-label="Formu kapat"
                onClick={() => {
                  setFormEventId(null);
                  setEventForm(null);
                }}
                className="text-2xl leading-none text-gray-500 dark:text-gray-300"
              >
                ×
              </button>
            </div>
            {eventForm.questions.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-300">
                Bu etkinlik için ek bilgi gerekmiyor.
              </p>
            ) : (
              <div className="max-h-[60vh] space-y-4 overflow-y-auto">
                {eventForm.questions.map((question) => (
                  <label key={question.id} className="block text-sm font-semibold dark:text-gray-100">
                    {question.label}
                    {question.type === "BOOLEAN" ? (
                      <select
                        value={formAnswers[question.id] ?? ""}
                        onChange={(event) =>
                          setFormAnswers((current) => ({
                            ...current,
                            [question.id]: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                      >
                        <option value="">Seçiniz</option>
                        {(question.options ?? ["true", "false"]).map((option) => (
                          <option key={option} value={option}>
                            {option === "true" ? "Evet" : option === "false" ? "Hayır" : option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={question.type === "EMAIL" ? "email" : question.type === "PHONE" ? "tel" : "text"}
                        value={formAnswers[question.id] ?? ""}
                        onChange={(event) =>
                          setFormAnswers((current) => ({
                            ...current,
                            [question.id]: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                      />
                    )}
                  </label>
                ))}
              </div>
            )}
            {formEventId && attendanceMessages[formEventId] && (
              <p className="mt-4 text-sm text-red-600 dark:text-red-400">
                {attendanceMessages[formEventId]}
              </p>
            )}
            <button
              type="button"
              onClick={submitApplication}
              disabled={attendanceBusy === formEventId}
              className="mt-6 w-full rounded-full bg-[#1a264e] px-5 py-3 font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-[#1a264e]"
            >
              {attendanceBusy === formEventId ? "Gönderiliyor..." : "Başvuruyu Gönder"}
            </button>
          </div>
        </div>
      )}

      {qrEventId !== null && qrDataUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-2xl bg-white p-6 text-center shadow-xl dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold dark:text-white">Etkinlik Karekodunuz</h2>
            <img
              src={qrDataUrl}
              alt="Etkinlik karekodu"
              className="mx-auto h-[280px] w-[280px]"
            />
            <button
              type="button"
              onClick={() => {
                setQrEventId(null);
                setQrDataUrl("");
              }}
              className="mt-5 rounded-full border border-gray-300 px-5 py-2 font-semibold dark:border-gray-600 dark:text-white"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
