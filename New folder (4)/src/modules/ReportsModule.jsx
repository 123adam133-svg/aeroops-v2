/* ═══════════════════════════════════════════════════════════
 * REPORTS MODULE — v7.2
 * Full integration: Duty Time, Stamps permissions, larger fonts
 * ═══════════════════════════════════════════════════════════ */
import React, { useState, useMemo, useEffect } from "react";
import {
  FileText,
  Printer,
  Lock,
  User as UserIcon,
  BarChart3,
  Plane as PlaneIcon,
  Stamp,
  FileX,
  Clock,
} from "lucide-react";
import { useT } from "../contexts";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { pdfSafe } from "../utils/pdf";
import { fmtDuty } from "../utils/helpers";
import { can as checkPerm } from "../config/permissions";

function logoToDisplayUrl(url) {
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  const match = url.match(/[?&]id=([^&]+)/);
  if (match) return `https://lh3.googleusercontent.com/d/${match[1]}`;
  const pathMatch = url.match(/\/d\/([^/]+)/);
  if (pathMatch) return `https://lh3.googleusercontent.com/d/${pathMatch[1]}`;
  return url;
}

export function ReportsModule({
  flights,
  crew,
  fleet,
  settings,
  user,
  initialSubTab = "crewHours",
}) {
  const t = useT();
  const logoUrl = settings?.logo ? logoToDisplayUrl(settings.logo) : "";
  const canViewAll = checkPerm(user, "reports.view_all");
  const canExportStamp = checkPerm(user, "reports.export_stamp"); // ⭐ صلاحية تصدير الختم

  const availableCrew = useMemo(() => {
    if (canViewAll) return crew;
    if (!user?.crewId) return [];
    const self = crew.find((c) => c.id === user.crewId);
    return self ? [self] : [];
  }, [crew, user, canViewAll]);

  const isLimited = !canViewAll;
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab);

  useEffect(() => {
    if (initialSubTab) setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  const [selectedCrew, setSelectedCrew] = useState("");
  const [selectedAcft, setSelectedAcft] = useState("");
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [timezone, setTimezone] = useState("UTC");
  const [busyPdf, setBusyPdf] = useState(false);

  useEffect(() => {
    if (isLimited && availableCrew.length === 1)
      setSelectedCrew(availableCrew[0].id);
  }, [isLimited, availableCrew]);

  const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return `${String(d.getUTCDate()).padStart(2, "0")}-${String(
      d.getUTCMonth() + 1
    ).padStart(2, "0")}-${d.getUTCFullYear()}`;
  };
  const fmtTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    let h, m;
    if (timezone === "UTC") {
      h = d.getUTCHours();
      m = d.getUTCMinutes();
    } else {
      h = d.getHours();
      m = d.getMinutes();
    }
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };
  const addMinutes = (iso, mins) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return new Date(d.getTime() + mins * 60000).toISOString();
  };

  const isCompleted = (f) => {
    const a = f.actual || {};
    return a.std && a.sta && !a.cancelled && f.status !== "CANCELLED";
  };

  const crewHoursFiltered = useMemo(() => {
    if (!selectedCrew) return [];
    const from = new Date(fromDate + "T00:00:00Z").getTime();
    const to = new Date(toDate + "T23:59:59Z").getTime();
    return flights
      .filter((f) => {
        const slots = Array.isArray(f.crewSlots)
          ? f.crewSlots
          : JSON.parse(f.crewSlots || "[]");
        if (!slots.some((s) => s.crewId === selectedCrew)) return false;
        if (selectedAcft && f.acft !== selectedAcft) return false;
        if (!isCompleted(f)) return false;
        const t = new Date(f.actual?.std || f.std).getTime();
        return t >= from && t <= to;
      })
      .sort(
        (a, b) =>
          new Date(a.actual?.std || a.std).getTime() -
          new Date(b.actual?.std || b.std).getTime()
      );
  }, [flights, selectedCrew, selectedAcft, fromDate, toDate]);

  const crewHoursRows = useMemo(() => {
    return crewHoursFiltered.map((f) => {
      const a = f.actual || {};
      const baseStd = a.std || f.std;
      const baseSta = a.sta || f.sta;
      const blockMin = Math.max(
        0,
        Math.round(
          (new Date(baseSta).getTime() - new Date(baseStd).getTime()) / 60000
        )
      );
      let flightMin = 0;
      if (a.takeoff && a.landing) {
        const tko = new Date(a.takeoff);
        const lnd = new Date(a.landing);
        if (!isNaN(tko.getTime()) && !isNaN(lnd.getTime()))
          flightMin = Math.max(
            0,
            Math.round((lnd.getTime() - tko.getTime()) / 60000)
          );
      }
      const nightMin = Math.max(0, Number(a.night) || 0);
      const instrumentMin = Math.max(0, Number(a.instrument) || 0);
      const acftType = fleet.find((x) => x.reg === f.acft)?.type || "—";
      const slot = (f.crewSlots || []).find((s) => s.crewId === selectedCrew);
      const func =
        slot?.position === "captain"
          ? "CPT"
          : slot?.position === "firstOfficer"
          ? "FO"
          : slot?.position === "observer"
          ? "OBS"
          : slot?.position === "fa1" || slot?.position === "fa2"
          ? "FA"
          : slot?.position === "engineer"
          ? "ENG1"
          : "—";
      const slots = (f.crewSlots || []).map((s) => ({
        ...s,
        member: crew.find((c) => c.id === s.crewId),
      }));
      const com =
        slots.find((s) => s.position === "captain")?.member?.fullName || "—";
      return {
        id: f.id,
        date: fmtDate(baseStd),
        acftType,
        reg: f.acft || "—",
        flightNo: f.flightNo,
        adep: f.dep,
        ades: f.arr,
        blockOff: fmtTime(baseStd),
        t_o: a.takeoff ? fmtTime(a.takeoff) : "—",
        lnd: a.landing ? fmtTime(a.landing) : "—",
        blockOn: fmtTime(baseSta),
        blockMin,
        block: blockMin > 0 ? fmtDuty(blockMin) : "—",
        flightMin,
        flight: flightMin > 0 ? fmtDuty(flightMin) : "—",
        nightMin,
        night: nightMin > 0 ? fmtDuty(nightMin) : "—",
        instrumentMin,
        instrument: instrumentMin > 0 ? fmtDuty(instrumentMin) : "—",
        func,
        com,
        showFlightTime: flightMin > 0,
        showNight: nightMin > 0,
        showInstrument: instrumentMin > 0,
      };
    });
  }, [crewHoursFiltered, fleet, crew, selectedCrew, timezone]);

  const crewHoursSummary = useMemo(() => {
    const totals = {
      blockMin: 0,
      flightMin: 0,
      nightMin: 0,
      instrumentMin: 0,
      sectors: 0,
      byType: {},
    };
    crewHoursRows.forEach((r) => {
      totals.blockMin += r.blockMin;
      totals.flightMin += r.flightMin;
      totals.nightMin += r.nightMin;
      totals.instrumentMin += r.instrumentMin;
      totals.sectors += 1;
      if (!totals.byType[r.acftType])
        totals.byType[r.acftType] = { block: 0, flight: 0, sectors: 0 };
      totals.byType[r.acftType].block += r.blockMin;
      totals.byType[r.acftType].flight += r.flightMin;
      totals.byType[r.acftType].sectors += 1;
    });
    return totals;
  }, [crewHoursRows]);

  const completedFlightsFiltered = useMemo(() => {
    const from = new Date(fromDate + "T00:00:00Z").getTime();
    const to = new Date(toDate + "T23:59:59Z").getTime();
    return flights
      .filter((f) => {
        if (selectedAcft && f.acft !== selectedAcft) return false;
        if (!isCompleted(f)) return false;
        const t = new Date(f.actual?.std || f.std).getTime();
        return t >= from && t <= to;
      })
      .sort(
        (a, b) =>
          new Date(a.actual?.std || a.std).getTime() -
          new Date(b.actual?.std || b.std).getTime()
      );
  }, [flights, selectedAcft, fromDate, toDate]);

  const completedFlightsRows = useMemo(() => {
    return completedFlightsFiltered.map((f) => {
      const a = f.actual || {};
      const baseStd = a.std || f.std;
      const baseSta = a.sta || f.sta;
      const acftType = fleet.find((x) => x.reg === f.acft)?.type || "—";
      const slots = (f.crewSlots || []).map((s) => ({
        ...s,
        member: crew.find((c) => c.id === s.crewId),
      }));
      const com =
        slots.find((s) => s.position === "captain")?.member?.fullName || "—";
      const sic =
        slots.find((s) => s.position === "firstOfficer")?.member?.fullName ||
        "—";
      return {
        id: f.id,
        date: fmtDate(baseStd),
        acftType,
        reg: f.acft || "—",
        flightNo: f.flightNo,
        adep: f.dep,
        ades: f.arr,
        blockOff: fmtTime(baseStd),
        t_o: a.takeoff ? fmtTime(a.takeoff) : "—",
        lnd: a.landing ? fmtTime(a.landing) : "—",
        blockOn: fmtTime(baseSta),
        com,
        sic,
      };
    });
  }, [completedFlightsFiltered, fleet, crew, timezone]);

  const completedFlightsSummary = useMemo(() => {
    const totals = { count: 0, byType: {} };
    completedFlightsRows.forEach((r) => {
      totals.count += 1;
      if (!totals.byType[r.acftType]) totals.byType[r.acftType] = { count: 0 };
      totals.byType[r.acftType].count += 1;
    });
    return totals;
  }, [completedFlightsRows]);

  const dutyTimeFiltered = useMemo(() => {
    if (!selectedCrew) return [];
    const from = new Date(fromDate + "T00:00:00Z").getTime();
    const to = new Date(toDate + "T23:59:59Z").getTime();
    return flights
      .filter((f) => {
        const slots = Array.isArray(f.crewSlots)
          ? f.crewSlots
          : JSON.parse(f.crewSlots || "[]");
        if (!slots.some((s) => s.crewId === selectedCrew)) return false;
        if (selectedAcft && f.acft !== selectedAcft) return false;
        if (!isCompleted(f)) return false;
        const t = new Date(f.actual?.std || f.std).getTime();
        return t >= from && t <= to;
      })
      .sort(
        (a, b) =>
          new Date(a.actual?.std || a.std).getTime() -
          new Date(b.actual?.std || b.std).getTime()
      );
  }, [flights, selectedCrew, selectedAcft, fromDate, toDate]);

  const dutyTimeRows = useMemo(() => {
    return dutyTimeFiltered.map((f) => {
      const a = f.actual || {};
      const scheduledStd = f.std;
      const actualSta = a.sta || f.sta;
      const dutyStartISO = addMinutes(scheduledStd, -60);
      const dutyEndISO = addMinutes(actualSta, 30);
      const dutyMin =
        dutyStartISO && dutyEndISO
          ? Math.max(
              0,
              Math.round(
                (new Date(dutyEndISO).getTime() -
                  new Date(dutyStartISO).getTime()) /
                  60000
              )
            )
          : 0;
      const acftType = fleet.find((x) => x.reg === f.acft)?.type || "—";
      return {
        id: f.id,
        date: fmtDate(f.std),
        acftType,
        reg: f.acft || "—",
        flightNo: f.flightNo,
        adep: f.dep,
        ades: f.arr,
        stdSched: fmtTime(f.std),
        staActual: fmtTime(actualSta),
        dutyStart: fmtTime(dutyStartISO),
        dutyEnd: fmtTime(dutyEndISO),
        dutyMin,
        duty: dutyMin > 0 ? fmtDuty(dutyMin) : "—",
      };
    });
  }, [dutyTimeFiltered, fleet, timezone]);

  const dutyTimeSummary = useMemo(() => {
    const totals = { dutyMin: 0, sectors: 0, byType: {} };
    dutyTimeRows.forEach((r) => {
      totals.dutyMin += r.dutyMin;
      totals.sectors += 1;
      if (!totals.byType[r.acftType])
        totals.byType[r.acftType] = { duty: 0, sectors: 0 };
      totals.byType[r.acftType].duty += r.dutyMin;
      totals.byType[r.acftType].sectors += 1;
    });
    return totals;
  }, [dutyTimeRows]);

  const personInfo = selectedCrew
    ? crew.find((c) => c.id === selectedCrew)
    : null;
  const personFullName = personInfo?.fullName || "—";
  const personEmpNo = personInfo?.empNo || "";
  const personName = personEmpNo
    ? `${personEmpNo} - ${personFullName}`
    : personFullName;
  const periodLabel = `${fmtDate(fromDate)} - ${fmtDate(toDate)}`;
  const issueDate = fmtDate(new Date().toISOString());

  const hasAnyFlightTime = crewHoursRows.some((r) => r.showFlightTime);
  const hasAnyNight = crewHoursRows.some((r) => r.showNight);
  const hasAnyInstrument = crewHoursRows.some((r) => r.showInstrument);

  const exportPDF = async (showStamp = false) => {
    setBusyPdf(true);
    try {
      const pdf = await PDFDocument.create();
      let page = pdf.addPage([842, 595]);
      const { height, width } = page.getSize();
      const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const fontMono = await pdf.embedFont(StandardFonts.Courier);

      let logoImage = null;
      if (settings?.logo) {
        try {
          const lRes = await fetch(logoToDisplayUrl(settings.logo));
          const lBytes = await lRes.arrayBuffer();
          try {
            logoImage = await pdf.embedPng(new Uint8Array(lBytes));
          } catch {
            logoImage = await pdf.embedJpg(new Uint8Array(lBytes));
          }
        } catch (e) {
          console.warn("Logo failed:", e.message);
        }
      }

      if (logoImage) {
        const dims = logoImage.scale(0.3);
        const scale = Math.min(1, 55 / dims.height);
        page.drawImage(logoImage, {
          x: 25,
          y: height - 75,
          width: dims.width * scale,
          height: dims.height * scale,
        });
      }

      const reportTitle =
        activeSubTab === "crewHours"
          ? t.crewHoursReport || "Flights by Crew Member"
          : activeSubTab === "completedFlights"
          ? t.completedFlights || "Completed Flights"
          : t.dutyTimeReport || "Crew Duty Time";
      page.drawText(reportTitle, {
        x: width / 2 - (activeSubTab === "crewHours" ? 90 : 100),
        y: height - 35,
        size: 20,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.2),
      });
      page.drawRectangle({
        x: width - 120,
        y: height - 55,
        width: 100,
        height: 40,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });
      page.drawText(t.dateOfIssue || "Date of Issue", {
        x: width - 115,
        y: height - 32,
        size: 9,
        font: fontBold,
        color: rgb(0.4, 0.4, 0.5),
      });
      page.drawText(issueDate, {
        x: width - 115,
        y: height - 48,
        size: 11,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.2),
      });

      if (activeSubTab === "crewHours" || activeSubTab === "dutyTime") {
        page.drawText(pdfSafe(personName), {
          x: 25,
          y: height - 95,
          size: 16,
          font: fontBold,
          color: rgb(0.1, 0.1, 0.2),
        });
      } else {
        page.drawText(
          (t.totalSectors || "Total Sectors") +
            ": " +
            completedFlightsSummary.count,
          {
            x: 25,
            y: height - 95,
            size: 16,
            font: fontBold,
            color: rgb(0.1, 0.4, 0.2),
          }
        );
      }
      page.drawText(pdfSafe(periodLabel), {
        x: width - 150,
        y: height - 95,
        size: 11,
        font: fontBold,
        color: rgb(0.3, 0.3, 0.4),
      });
      page.drawLine({
        start: { x: 20, y: height - 105 },
        end: { x: width - 20, y: height - 105 },
        thickness: 1.5,
        color: rgb(0, 0, 0),
      });

      let y = height - 130;
      if (activeSubTab === "crewHours") {
        page.drawText("Block", { x: 100, y, size: 10, font: fontBold });
        page.drawText("Flight time", { x: 160, y, size: 10, font: fontBold });
        page.drawText("Sectors", { x: 230, y, size: 10, font: fontBold });
        y -= 15;
        page.drawText("Total", { x: 25, y, size: 11, font: fontBold });
        page.drawText(fmtDuty(crewHoursSummary.blockMin), {
          x: 100,
          y,
          size: 11,
          font: fontBold,
        });
        page.drawText(fmtDuty(crewHoursSummary.flightMin), {
          x: 160,
          y,
          size: 11,
          font: fontBold,
        });
        page.drawText(String(crewHoursSummary.sectors), {
          x: 230,
          y,
          size: 11,
          font: fontBold,
        });
        y -= 18;
        Object.entries(crewHoursSummary.byType).forEach(([type, data]) => {
          page.drawText(type, { x: 25, y, size: 11, font: fontBold });
          page.drawText(fmtDuty(data.block), { x: 100, y, size: 11, font });
          page.drawText(fmtDuty(data.flight), { x: 160, y, size: 11, font });
          page.drawText(String(data.sectors), { x: 230, y, size: 11, font });
          y -= 14;
        });
      } else if (activeSubTab === "completedFlights") {
        page.drawText("Sectors", { x: 100, y, size: 10, font: fontBold });
        y -= 15;
        page.drawText("Total", { x: 25, y, size: 11, font: fontBold });
        page.drawText(String(completedFlightsSummary.count), {
          x: 100,
          y,
          size: 11,
          font: fontBold,
        });
        y -= 18;
        Object.entries(completedFlightsSummary.byType).forEach(
          ([type, data]) => {
            page.drawText(type, { x: 25, y, size: 11, font: fontBold });
            page.drawText(String(data.count), { x: 100, y, size: 11, font });
            y -= 14;
          }
        );
      } else if (activeSubTab === "dutyTime") {
        page.drawText("Duty Time", { x: 100, y, size: 10, font: fontBold });
        page.drawText("Sectors", { x: 180, y, size: 10, font: fontBold });
        y -= 15;
        page.drawText("Total", { x: 25, y, size: 11, font: fontBold });
        page.drawText(fmtDuty(dutyTimeSummary.dutyMin), {
          x: 100,
          y,
          size: 11,
          font: fontBold,
        });
        page.drawText(String(dutyTimeSummary.sectors), {
          x: 180,
          y,
          size: 11,
          font: fontBold,
        });
        y -= 18;
        Object.entries(dutyTimeSummary.byType).forEach(([type, data]) => {
          page.drawText(type, { x: 25, y, size: 11, font: fontBold });
          page.drawText(fmtDuty(data.duty), { x: 100, y, size: 11, font });
          page.drawText(String(data.sectors), { x: 180, y, size: 11, font });
          y -= 14;
        });
      }

      y -= 10;
      page.drawText(
        "Total sum may not be the sum of each positions because pilots can be assigned to several positions at the same time.",
        { x: 25, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) }
      );
      y -= 30;

      let detailCols;
      if (activeSubTab === "crewHours") {
        detailCols = [
          { x: 20, label: "Date" },
          { x: 80, label: "Aircraft" },
          { x: 130, label: "Reg." },
          { x: 175, label: "Flight No." },
          { x: 235, label: "ADEP" },
          { x: 280, label: "ADES" },
          { x: 325, label: "BLOCK OFF" },
          { x: 405, label: "T/O" },
          { x: 455, label: "LND" },
          { x: 505, label: "BLOCK ON" },
          { x: 580, label: "BLOCK" },
          ...(hasAnyFlightTime ? [{ x: 635, label: "Flight time" }] : []),
          ...(hasAnyNight ? [{ x: 700, label: "Night" }] : []),
          ...(hasAnyInstrument ? [{ x: 750, label: "Instr" }] : []),
          { x: 795, label: "Func." },
        ];
      } else if (activeSubTab === "completedFlights") {
        detailCols = [
          { x: 20, label: "Date" },
          { x: 85, label: "Aircraft" },
          { x: 140, label: "Reg." },
          { x: 195, label: "Flight No." },
          { x: 260, label: "ADEP" },
          { x: 305, label: "ADES" },
          { x: 350, label: "OFF" },
          { x: 405, label: "T/O" },
          { x: 455, label: "LND" },
          { x: 500, label: "ON" },
          { x: 550, label: "Sector" },
          { x: 610, label: "COM" },
          { x: 690, label: "SIC" },
        ];
      } else {
        detailCols = [
          { x: 20, label: "Date" },
          { x: 80, label: "Aircraft" },
          { x: 130, label: "Reg." },
          { x: 175, label: "Flight No." },
          { x: 235, label: "ADEP" },
          { x: 280, label: "ADES" },
          { x: 325, label: "STD" },
          { x: 380, label: "STA (Act)" },
          { x: 450, label: "Duty Start" },
          { x: 530, label: "Duty End" },
          { x: 610, label: "Duty" },
        ];
      }

      const drawDetailHeader = () => {
        page.drawRectangle({
          x: 15,
          y: y - 6,
          width: width - 30,
          height: 22,
          color: rgb(0.9, 0.9, 0.9),
        });
        detailCols.forEach((c) =>
          page.drawText(c.label, { x: c.x, y, size: 10, font: fontBold })
        );
        y -= 22;
      };
      drawDetailHeader();

      const activeRows =
        activeSubTab === "crewHours"
          ? crewHoursRows
          : activeSubTab === "completedFlights"
          ? completedFlightsRows
          : dutyTimeRows;
      activeRows.forEach((r) => {
        if (y < 40) {
          page = pdf.addPage([842, 595]);
          y = 555;
          drawDetailHeader();
        }
        let vals;
        if (activeSubTab === "crewHours") {
          vals = [
            r.date,
            r.acftType,
            r.reg,
            r.flightNo,
            r.adep,
            r.ades,
            r.blockOff,
            r.t_o,
            r.lnd,
            r.blockOn,
            r.block,
          ];
          if (hasAnyFlightTime) vals.push(r.flight);
          if (hasAnyNight) vals.push(r.night);
          if (hasAnyInstrument) vals.push(r.instrument);
          vals.push(r.func);
        } else if (activeSubTab === "completedFlights") {
          vals = [
            r.date,
            r.acftType,
            r.reg,
            r.flightNo,
            r.adep,
            r.ades,
            r.blockOff,
            r.t_o,
            r.lnd,
            r.blockOn,
            "1",
            r.com.substring(0, 15),
            r.sic.substring(0, 15),
          ];
        } else {
          vals = [
            r.date,
            r.acftType,
            r.reg,
            r.flightNo,
            r.adep,
            r.ades,
            r.stdSched,
            r.staActual,
            r.dutyStart,
            r.dutyEnd,
            r.duty,
          ];
        }
        vals.forEach((v, i) =>
          page.drawText(pdfSafe(String(v || "")), {
            x: detailCols[i].x,
            y,
            size: 9,
            font: fontMono,
          })
        );
        y -= 16;
      });

      y -= 10;
      page.drawRectangle({
        x: 15,
        y: y - 5,
        width: width - 30,
        height: 20,
        color: rgb(0.85, 0.95, 0.85),
      });
      page.drawText(t.totalLabel || "TOTAL", {
        x: 20,
        y: y + 2,
        size: 11,
        font: fontBold,
      });
      if (activeSubTab === "crewHours")
        page.drawText(fmtDuty(crewHoursSummary.blockMin), {
          x: 580,
          y: y + 2,
          size: 11,
          font: fontBold,
        });
      else if (activeSubTab === "completedFlights")
        page.drawText(String(completedFlightsSummary.count), {
          x: 550,
          y: y + 2,
          size: 11,
          font: fontBold,
        });
      else if (activeSubTab === "dutyTime")
        page.drawText(fmtDuty(dutyTimeSummary.dutyMin), {
          x: 610,
          y: y + 2,
          size: 11,
          font: fontBold,
        });

      /* ⭐ الختم */
      if (showStamp && settings?.stamp) {
        try {
          const sRes = await fetch(logoToDisplayUrl(settings.stamp));
          const sBytes = await sRes.arrayBuffer();
          let stampImage;
          try {
            stampImage = await pdf.embedPng(new Uint8Array(sBytes));
          } catch {
            stampImage = await pdf.embedJpg(new Uint8Array(sBytes));
          }
          if (stampImage) {
            const pages = pdf.getPages();
            pages.forEach((p) => {
              const { height } = p.getSize();
              const dims = stampImage.scale(0.5);
              const scale = Math.min(1, 65 / dims.height);
              p.drawImage(stampImage, {
                x: 50,
                y: 40,
                width: dims.width * scale,
                height: dims.height * scale,
                opacity: 0.8,
              });
            });
          }
        } catch (e) {
          console.warn("Stamp failed in PDF:", e.message);
        }
      }

      const bytes = await pdf.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const suffix = showStamp ? "_Stamped" : "_NoStamp";
      a.download =
        activeSubTab === "crewHours"
          ? `Crew_${
              personInfo?.empNo || "report"
            }_${fromDate}_${toDate}${suffix}.pdf`
          : activeSubTab === "completedFlights"
          ? `${
              t.completedFlights || "Completed_Flights"
            }_${fromDate}_${toDate}${suffix}.pdf`
          : `Duty_Time_${
              personInfo?.empNo || "report"
            }_${fromDate}_${toDate}${suffix}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("PDF failed: " + e.message);
      console.error(e);
    } finally {
      setBusyPdf(false);
    }
  };

  return (
    <div className="space-y-3 bg-slate-100 dark:bg-slate-900 p-3 rounded-lg">
      {isLimited &&
        (activeSubTab === "crewHours" || activeSubTab === "dutyTime") && (
          <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-lg p-3 text-white shadow-lg flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm">
                ساعاتي فقط — {personInfo?.fullName || user?.fullName}
              </div>
              <div className="text-[10px] text-sky-100">
                يمكنك عرض ساعاتك فقط
              </div>
            </div>
            <Lock className="w-5 h-5 text-white/70" />
          </div>
        )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-lg p-3">
        <div
          className={`grid grid-cols-2 gap-2 ${
            activeSubTab === "crewHours" || activeSubTab === "dutyTime"
              ? "md:grid-cols-6"
              : "md:grid-cols-5"
          }`}
        >
          {(activeSubTab === "crewHours" || activeSubTab === "dutyTime") && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                👤 {t.crewMember || "Crew Member"}{" "}
                {isLimited && <span className="text-rose-500">🔒</span>}
              </label>
              <select
                value={selectedCrew}
                onChange={(e) => setSelectedCrew(e.target.value)}
                disabled={isLimited}
                className={`w-full px-2 py-1.5 border rounded text-xs ${
                  isLimited
                    ? "bg-slate-100 dark:bg-slate-700 cursor-not-allowed text-slate-500"
                    : "bg-white dark:bg-slate-900"
                }`}
              >
                <option value="">— {t.selectCrew || "Select Crew"} —</option>
                {availableCrew.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.empNo} - {c.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              ✈️ {t.aircraft || "Aircraft"}
            </label>
            <select
              value={selectedAcft}
              onChange={(e) => setSelectedAcft(e.target.value)}
              className="w-full px-2 py-1.5 border rounded text-xs bg-white dark:bg-slate-900"
            >
              <option value="">{t.allAircraft || "All Aircraft"}</option>
              {fleet.map((a) => (
                <option key={a.id} value={a.reg}>
                  {a.reg}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              📅 {t.fromDate || "From"}
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-2 py-1.5 border rounded text-xs bg-white dark:bg-slate-900"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              📅 {t.toDate || "To"}
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-2 py-1.5 border rounded text-xs bg-white dark:bg-slate-900"
            />
          </div>
          <div className="flex items-end gap-1 col-span-2 md:col-span-2">
            <button
              onClick={() => exportPDF(true)}
              disabled={
                busyPdf ||
                ((activeSubTab === "crewHours" ||
                  activeSubTab === "dutyTime") &&
                  !selectedCrew) ||
                !canExportStamp
              }
              className="w-1/2 px-2 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1"
              title={canExportStamp ? "تصدير بالختم" : "ليس لديك صلاحية"}
            >
              <Stamp className="w-3.5 h-3.5" /> {busyPdf ? "…" : "PDF"}
            </button>
            <button
              onClick={() => exportPDF(false)}
              disabled={
                busyPdf ||
                ((activeSubTab === "crewHours" ||
                  activeSubTab === "dutyTime") &&
                  !selectedCrew)
              }
              className="w-1/2 px-2 py-2 rounded bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1"
              title="تصدير بدون ختم"
            >
              <FileX className="w-3.5 h-3.5" /> {busyPdf ? "…" : "PDF"}
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1 - Crew Hours */}
      {activeSubTab === "crewHours" && (
        <>
          {selectedCrew ? (
            <div className="bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-lg p-4">
              <div className="mb-4 pb-3 border-b-2 border-slate-300">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo"
                        className="h-16 object-contain"
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        }
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-700 flex items-center justify-center text-white font-bold text-2xl">
                        ✈️
                      </div>
                    )}
                  </div>
                  <div className="border-2 border-slate-400 rounded p-2 text-center">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">
                      {t.dateOfIssue || "Date of Issue"}
                    </div>
                    <div className="text-sm font-bold">{issueDate}</div>
                  </div>
                </div>
                <div className="text-center mb-3">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {t.crewHoursReport || "Flights by Crew Member"}
                  </h1>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">
                      {t.crewMember || "Crew Member"}
                    </div>
                    <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300">
                      {personName}
                    </h2>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">
                      {t.period || "Period"}
                    </div>
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {periodLabel}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <table className="w-full text-sm max-w-md">
                  <thead>
                    <tr className="text-slate-600">
                      <th className="text-start py-1"></th>
                      <th className="text-center py-1 font-bold">Block</th>
                      <th className="text-center py-1 font-bold">
                        Flight time
                      </th>
                      <th className="text-center py-1 font-bold">Sectors</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-slate-300 font-bold">
                      <td className="py-1">Total</td>
                      <td className="text-center py-1 font-mono">
                        {fmtDuty(crewHoursSummary.blockMin)}
                      </td>
                      <td className="text-center py-1 font-mono">
                        {fmtDuty(crewHoursSummary.flightMin)}
                      </td>
                      <td className="text-center py-1 font-mono">
                        {crewHoursSummary.sectors}
                      </td>
                    </tr>
                    {Object.entries(crewHoursSummary.byType).map(
                      ([type, data]) => (
                        <tr key={type} className="border-t border-slate-200">
                          <td className="py-1">{type}</td>
                          <td className="text-center py-1 font-mono">
                            {fmtDuty(data.block)}
                          </td>
                          <td className="text-center py-1 font-mono">
                            {fmtDuty(data.flight)}
                          </td>
                          <td className="text-center py-1 font-mono">
                            {data.sectors}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
              <div className="overflow-x-auto border border-slate-300 rounded">
                <table className="w-full text-sm">
                  <thead className="bg-slate-200 dark:bg-slate-700">
                    <tr>
                      {[
                        "Date",
                        "Aircraft",
                        "Reg.",
                        "Flight No.",
                        "ADEP",
                        "ADES",
                        "BLOCK OFF",
                        "T/O",
                        "LND",
                        "BLOCK ON",
                        "BLOCK",
                      ]
                        .concat(hasAnyFlightTime ? ["Flight time"] : [])
                        .concat(hasAnyNight ? ["Night"] : [])
                        .concat(hasAnyInstrument ? ["Instrument"] : [])
                        .concat(["Func.", "COM"])
                        .map((h, i) => (
                          <th
                            key={`${h}-${i}`}
                            className="px-3 py-2 text-start font-bold border-e border-slate-300 whitespace-nowrap text-xs"
                          >
                            {h}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {crewHoursRows.map((r, i) => (
                      <tr
                        key={i}
                        className={`border-t border-slate-200 ${
                          i % 2 === 0 ? "" : "bg-slate-50 dark:bg-slate-900/50"
                        }`}
                      >
                        <td className="px-3 py-2 font-mono whitespace-nowrap">
                          {r.date}
                        </td>
                        <td className="px-3 py-2">{r.acftType}</td>
                        <td className="px-3 py-2 font-bold bg-amber-50 dark:bg-amber-950">
                          {r.reg}
                        </td>
                        <td className="px-3 py-2 font-mono">{r.flightNo}</td>
                        <td className="px-3 py-2 font-bold text-center">
                          {r.adep}
                        </td>
                        <td className="px-3 py-2 font-bold text-center">
                          {r.ades}
                        </td>
                        <td className="px-3 py-2 font-mono text-center">
                          {r.blockOff}
                        </td>
                        <td className="px-3 py-2 font-mono text-center">
                          {r.t_o}
                        </td>
                        <td className="px-3 py-2 font-mono text-center">
                          {r.lnd}
                        </td>
                        <td className="px-3 py-2 font-mono text-center">
                          {r.blockOn}
                        </td>
                        <td className="px-3 py-2 font-mono text-center bg-sky-50 dark:bg-sky-950 font-bold">
                          {r.block}
                        </td>
                        {hasAnyFlightTime && (
                          <td className="px-3 py-2 font-mono text-center bg-emerald-50 dark:bg-emerald-950 font-bold">
                            {r.flight}
                          </td>
                        )}
                        {hasAnyNight && (
                          <td className="px-3 py-2 font-mono text-center text-indigo-700">
                            {r.night}
                          </td>
                        )}
                        {hasAnyInstrument && (
                          <td className="px-3 py-2 font-mono text-center text-purple-700">
                            {r.instrument}
                          </td>
                        )}
                        <td className="px-3 py-2 text-center font-bold">
                          {r.func}
                        </td>
                        <td className="px-3 py-2 text-xs truncate max-w-[120px]">
                          {r.com}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-200 dark:bg-slate-700 font-bold">
                    <tr>
                      <td colSpan="10" className="px-3 py-2 text-end text-sm">
                        TOTAL
                      </td>
                      <td className="px-3 py-2 font-mono text-center text-sm">
                        {fmtDuty(crewHoursSummary.blockMin)}
                      </td>
                      {hasAnyFlightTime && (
                        <td className="px-3 py-2 font-mono text-center text-sm">
                          {fmtDuty(crewHoursSummary.flightMin)}
                        </td>
                      )}
                      {hasAnyNight && (
                        <td className="px-3 py-2 font-mono text-center text-sm">
                          {fmtDuty(crewHoursSummary.nightMin)}
                        </td>
                      )}
                      {hasAnyInstrument && (
                        <td className="px-3 py-2 font-mono text-center text-sm">
                          {fmtDuty(crewHoursSummary.instrumentMin)}
                        </td>
                      )}
                      <td colSpan="2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 rounded-lg p-12 text-center text-slate-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {isLimited ? "جاري تحميل ساعاتك…" : "اختر عضو طاقم لعرض ساعاته"}
              </p>
            </div>
          )}
        </>
      )}

      {/* TAB 2 - Completed Flights */}
      {activeSubTab === "completedFlights" && (
        <div className="bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-lg p-4">
          <div className="mb-4 pb-3 border-b-2 border-slate-300">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
              <div>
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-16 object-contain"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-2xl">
                    ✈️
                  </div>
                )}
              </div>
              <div className="border-2 border-slate-400 rounded p-2 text-center">
                <div className="text-[10px] font-bold text-slate-500 uppercase">
                  {t.dateOfIssue || "Date of Issue"}
                </div>
                <div className="text-sm font-bold">{issueDate}</div>
              </div>
            </div>
            <div className="text-center mb-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {t.completedFlights || "Completed Flights"}
              </h1>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">
                  {t.totalSectors || "Total Sectors"}
                </div>
                <h2 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {completedFlightsSummary.count}
                </h2>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-500 uppercase">
                  {t.period || "Period"}
                </div>
                <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {periodLabel}
                </div>
              </div>
            </div>
          </div>
          <div className="mb-4">
            <table className="w-full text-sm max-w-md">
              <thead>
                <tr className="text-slate-600">
                  <th className="text-start py-1"></th>
                  <th className="text-center py-1 font-bold">Sectors</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-300 font-bold">
                  <td className="py-1">Total</td>
                  <td className="text-center py-1 font-mono text-lg">
                    {completedFlightsSummary.count}
                  </td>
                </tr>
                {Object.entries(completedFlightsSummary.byType).map(
                  ([type, data]) => (
                    <tr key={type} className="border-t border-slate-200">
                      <td className="py-1">{type}</td>
                      <td className="text-center py-1 font-mono font-bold">
                        {data.count}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
          <div className="overflow-x-auto border border-slate-300 rounded">
            <table className="w-full text-sm">
              <thead className="bg-slate-200 dark:bg-slate-700">
                <tr>
                  {[
                    t.date || "Date",
                    t.aircraftCol || "Aircraft",
                    t.regCol || "Reg.",
                    t.flightNoCol || "Flight No.",
                    "ADEP",
                    "ADES",
                    t.blockOffCol || "OFF",
                    "T/O",
                    "LND",
                    t.blockOnCol || "ON",
                    t.sector || "Sector",
                    t.com || "COM",
                    t.sic || "SIC",
                  ].map((h, i) => (
                    <th
                      key={`${h}-${i}`}
                      className="px-3 py-2 text-start font-bold border-e border-slate-300 whitespace-nowrap text-xs"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {completedFlightsRows.map((r, i) => (
                  <tr
                    key={i}
                    className={`border-t border-slate-200 ${
                      i % 2 === 0 ? "" : "bg-slate-50 dark:bg-slate-900/50"
                    }`}
                  >
                    <td className="px-3 py-2 font-mono whitespace-nowrap">
                      {r.date}
                    </td>
                    <td className="px-3 py-2">{r.acftType}</td>
                    <td className="px-3 py-2 font-bold bg-amber-50 dark:bg-amber-950">
                      {r.reg}
                    </td>
                    <td className="px-3 py-2 font-mono">{r.flightNo}</td>
                    <td className="px-3 py-2 font-bold text-center">
                      {r.adep}
                    </td>
                    <td className="px-3 py-2 font-bold text-center">
                      {r.ades}
                    </td>
                    <td className="px-3 py-2 font-mono text-center">
                      {r.blockOff}
                    </td>
                    <td className="px-3 py-2 font-mono text-center">{r.t_o}</td>
                    <td className="px-3 py-2 font-mono text-center">{r.lnd}</td>
                    <td className="px-3 py-2 font-mono text-center">
                      {r.blockOn}
                    </td>
                    <td className="px-3 py-2 font-mono text-center bg-sky-50 dark:bg-sky-950 font-bold">
                      1
                    </td>
                    <td className="px-3 py-2 text-xs truncate max-w-[120px]">
                      {r.com}
                    </td>
                    <td className="px-3 py-2 text-xs truncate max-w-[120px]">
                      {r.sic}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-200 dark:bg-slate-700 font-bold">
                <tr>
                  <td colSpan="10" className="px-3 py-2 text-end text-sm">
                    {t.totalSectorsLabel || "TOTAL SECTORS"}
                  </td>
                  <td className="px-3 py-2 font-mono text-center bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-sm">
                    {completedFlightsSummary.count}
                  </td>
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3 - Duty Time */}
      {activeSubTab === "dutyTime" && (
        <>
          {selectedCrew ? (
            <div className="bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-lg p-4">
              <div className="mb-4 pb-3 border-b-2 border-slate-300">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo"
                        className="h-16 object-contain"
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        }
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-700 flex items-center justify-center text-white font-bold text-2xl">
                        ✈️
                      </div>
                    )}
                  </div>
                  <div className="border-2 border-slate-400 rounded p-2 text-center">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">
                      {t.dateOfIssue || "Date of Issue"}
                    </div>
                    <div className="text-sm font-bold">{issueDate}</div>
                  </div>
                </div>
                <div className="text-center mb-3">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {t.dutyTimeReport || "Crew Duty Time"}
                  </h1>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">
                      {t.crewMember || "Crew Member"}
                    </div>
                    <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300">
                      {personName}
                    </h2>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">
                      {t.period || "Period"}
                    </div>
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {periodLabel}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <table className="w-full text-sm max-w-md">
                  <thead>
                    <tr className="text-slate-600">
                      <th className="text-start py-1"></th>
                      <th className="text-center py-1 font-bold">Duty Time</th>
                      <th className="text-center py-1 font-bold">Sectors</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-slate-300 font-bold">
                      <td className="py-1">Total</td>
                      <td className="text-center py-1 font-mono">
                        {fmtDuty(dutyTimeSummary.dutyMin)}
                      </td>
                      <td className="text-center py-1 font-mono">
                        {dutyTimeSummary.sectors}
                      </td>
                    </tr>
                    {Object.entries(dutyTimeSummary.byType).map(
                      ([type, data]) => (
                        <tr key={type} className="border-t border-slate-200">
                          <td className="py-1">{type}</td>
                          <td className="text-center py-1 font-mono">
                            {fmtDuty(data.duty)}
                          </td>
                          <td className="text-center py-1 font-mono">
                            {data.sectors}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
              <div className="overflow-x-auto border border-slate-300 rounded">
                <table className="w-full text-sm">
                  <thead className="bg-slate-200 dark:bg-slate-700">
                    <tr>
                      {[
                        "Date",
                        "Aircraft",
                        "Reg.",
                        "Flight No.",
                        "ADEP",
                        "ADES",
                        "STD (Sched)",
                        "STA (Actual)",
                        "Duty Start",
                        "Duty End",
                        "Duty",
                      ].map((h, i) => (
                        <th
                          key={`${h}-${i}`}
                          className="px-3 py-2 text-start font-bold border-e border-slate-300 whitespace-nowrap text-xs"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dutyTimeRows.map((r, i) => (
                      <tr
                        key={i}
                        className={`border-t border-slate-200 ${
                          i % 2 === 0 ? "" : "bg-slate-50 dark:bg-slate-900/50"
                        }`}
                      >
                        <td className="px-3 py-2 font-mono whitespace-nowrap">
                          {r.date}
                        </td>
                        <td className="px-3 py-2">{r.acftType}</td>
                        <td className="px-3 py-2 font-bold bg-amber-50 dark:bg-amber-950">
                          {r.reg}
                        </td>
                        <td className="px-3 py-2 font-mono">{r.flightNo}</td>
                        <td className="px-3 py-2 font-bold text-center">
                          {r.adep}
                        </td>
                        <td className="px-3 py-2 font-bold text-center">
                          {r.ades}
                        </td>
                        <td className="px-3 py-2 font-mono text-center">
                          {r.stdSched}
                        </td>
                        <td className="px-3 py-2 font-mono text-center">
                          {r.staActual}
                        </td>
                        <td className="px-3 py-2 font-mono text-center text-sky-700 dark:text-sky-400">
                          {r.dutyStart}
                        </td>
                        <td className="px-3 py-2 font-mono text-center text-sky-700 dark:text-sky-400">
                          {r.dutyEnd}
                        </td>
                        <td className="px-3 py-2 font-mono text-center bg-emerald-50 dark:bg-emerald-950 font-bold">
                          {r.duty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-200 dark:bg-slate-700 font-bold">
                    <tr>
                      <td colSpan="10" className="px-3 py-2 text-end text-sm">
                        TOTAL
                      </td>
                      <td className="px-3 py-2 font-mono text-center text-sm bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        {fmtDuty(dutyTimeSummary.dutyMin)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 rounded-lg p-12 text-center text-slate-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {isLimited
                  ? "جاري تحميل ساعاتك…"
                  : "اختر عضو طاقم لعرض ساعات الخدمة (Duty)"}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ReportsModule;
