"use client";

import React, { useEffect, useMemo, useState } from "react";
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
    } catch {
      setDisplayEvents((current) => [...current]);
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
              Upcoming Events
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
              Past Events
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
    </div>
  );
}
