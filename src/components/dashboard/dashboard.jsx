import { useEffect, useState, useCallback } from "react";
import Navbar from "../navbar/navbar";
import { getEquipmentListService } from "../../services/masterservice";
import { format, differenceInDays, parseISO } from "date-fns";
import { getGatepassList } from "../../services/gatepass.service";
import { 
  FaTriangleExclamation,
  FaRegCircleCheck,
  FaBarcode,
  FaRegCalendarDays,
  FaRegClock,
  FaLaptop,
  FaClipboardCheck,
  FaRegBell,
  FaWrench,
  FaXmark
} from "react-icons/fa6";

import { BsHourglassSplit, BsTag } from "react-icons/bs";

const AUTO_CLOSE_SECS = 60;

const TABS = [
  { key: "week",    label: "1 Week",  days: 7,    color: "#E24B4A" },
  { key: "fifteen", label: "15 Days", days: 15,   color: "#EF9F27" },
  { key: "month",   label: "1 Month", days: 30,   color: "#378ADD" },
  { key: "expired", label: "Expired", days: null,  color: "#6B7280" },
];

const getUrgency = (daysLeft) => {
  if (daysLeft < 0)   return { accentColor: "#6B7280", badgeBg: "rgba(107,114,128,0.13)", badgeColor: "#374151" };
  if (daysLeft <= 7)  return { accentColor: "#E24B4A", badgeBg: "rgba(226,75,74,0.12)",    badgeColor: "#991B1B" };
  if (daysLeft <= 15) return { accentColor: "#EF9F27", badgeBg: "rgba(239,159,39,0.12)",  badgeColor: "#92400E" };
  return               { accentColor: "#378ADD", badgeBg: "rgba(55,138,221,0.12)",         badgeColor: "#1E40AF" };
};

/* ─────────────────────────────────────────────────────────────
    CALIBRATION MODAL
───────────────────────────────────────────────────────────── */
const CalibrationModal = ({ allItems, onClose }) => {
  const [secondsLeft, setSecondsLeft] = useState(AUTO_CLOSE_SECS);
  const [activeTab, setActiveTab] = useState("week");

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) { clearInterval(interval); onClose(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onClose]);

  const progressPct  = (secondsLeft / AUTO_CLOSE_SECS) * 100;
  const activeTabCfg = TABS.find(t => t.key === activeTab);
  const today        = new Date();

  const filteredItems = allItems.filter(item => {
    if (!item.calibrationDueDate) return false;
    const days = differenceInDays(parseISO(item.calibrationDueDate), today);
    if (activeTab === "expired") return days < 0;
    return days >= 0 && days <= activeTabCfg.days;
  });

  return (
    <div style={ms.overlay}>
      <div style={ms.modal}>
        <div style={ms.header}>
          <div style={ms.headerTitle}>
            <FaTriangleExclamation style={{ fontSize: 18, color: "#FBBF24" }} />
            Calibration Due Alert
            <span style={{ ...ms.badge, background: "rgba(255,255,255,0.2)", color: "#fff" }}>
              {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
            </span>
          </div>
          <button style={ms.closeBtn} onClick={onClose} aria-label="Close">
            <FaXmark style={{ fontSize: 16 }} />
          </button>
        </div>

        <div style={ms.tabBar}>
          {TABS.map(tab => {
            const isActive = tab.key === activeTab;
            const count = allItems.filter(item => {
              if (!item.calibrationDueDate) return false;
              const d = differenceInDays(parseISO(item.calibrationDueDate), today);
              if (tab.key === "expired") return d < 0;
              return d >= 0 && d <= tab.days;
            }).length;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                ...ms.tabBtn,
                borderBottom: isActive ? `2.5px solid ${tab.color}` : "2.5px solid transparent",
                color: isActive ? tab.color : "#888",
                fontWeight: isActive ? 600 : 400,
              }}>
                {tab.label}
                <span style={{ ...ms.tabCount, background: isActive ? tab.color : "#F0F0F0", color: isActive ? "#fff" : "#888" }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div style={ms.body}>
          {filteredItems.length === 0 ? (
            <div style={ms.emptyState}>
              <FaRegCircleCheck style={{ fontSize: 40, color: "#10B981" }} />
              <p style={{ marginTop: 8, fontSize: 13, color: "#6B7280" }}>
                No calibrations due within {activeTabCfg.label.toLowerCase()}
              </p>
            </div>
          ) : (
            filteredItems.map(item => {
              const daysLeft = differenceInDays(parseISO(item.calibrationDueDate), today);
              const { accentColor, badgeBg, badgeColor } = getUrgency(daysLeft);
              return (
                <div key={item.equipmentId} style={{ ...ms.card, borderLeft: `3px solid ${accentColor}` }}>
                  <div className="text-start" style={{ flex: 1, minWidth: 0 }}>
                    <div style={ms.cardName}>{item.equipmentName}</div>
                    <div style={ms.cardMeta}>
                      <FaBarcode style={{ fontSize: 14, verticalAlign: -1, display: "inline-block" }} />
                      {" "}Serial: {item.itemSerialNumber}&nbsp;·&nbsp;Project: {item.projectCode}
                    </div>
                  </div>
                  <div style={ms.cardRight}>
                    <div style={ms.cardDueDate}>
                      <FaRegCalendarDays style={{ fontSize: 13, verticalAlign: -1, display: "inline-block" }} />
                      {" "}{format(parseISO(item.calibrationDueDate), "dd-MM-yyyy")}
                    </div>
                    <span style={{ ...ms.badge, background: badgeBg, color: badgeColor }}>
                      {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? "Today" : `${daysLeft}d left`}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={ms.footer}>
          <div style={ms.countdown}>
            <FaRegClock style={{ fontSize: 14 }} />
            <span>Closes in {secondsLeft}s</span>
            <div style={ms.progressBar}>
              <div style={{ ...ms.progressFill, width: `${progressPct}%` }} />
            </div>
          </div>
          <button style={ms.dismissBtn} onClick={onClose}>Dismiss</button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
    GRADIENT STAT CARD
───────────────────────────────────────────────────────────── */
const StatCard = ({ icon: IconComponent, label, value, gradientFrom, gradientTo, sub }) => (
  <div style={{
    background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
    borderRadius: 14,
    padding: "1.2rem 1.4rem",
    boxShadow: `0 4px 18px ${gradientFrom}44`,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    position: "relative",
    overflow: "hidden",
  }}>
    <div style={{
      position: "absolute", top: -20, right: -20,
      width: 90, height: 90, borderRadius: "50%",
      background: "rgba(255,255,255,0.10)",
      pointerEvents: "none",
    }} />
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
      <div style={{
        width: 42, height: 42, borderRadius: 11,
        background: "rgba(255,255,255,0.22)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <IconComponent style={{ fontSize: 21, color: "#fff" }} />
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{value ?? "—"}</div>
    </div>
    <div style={{ position: "relative" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.95)" }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.68)", marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
    CALIBRATION ALERT ROW
───────────────────────────────────────────────────────────── */
const AlertRow = ({ item, today }) => {
  const daysLeft = differenceInDays(parseISO(item.calibrationDueDate), today);
  const { accentColor, badgeBg, badgeColor } = getUrgency(daysLeft);
  return (
    <div style={{ ...ds.listRow, borderLeft: `3px solid ${accentColor}` }}>
      <div style={{ ...ds.rowIconWrap, background: accentColor + "18", color: accentColor }}>
        <FaWrench style={{ fontSize: 14 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={ds.rowTitle}>{item.equipmentName}</div>
        <div style={ds.rowMeta}>{item.itemSerialNumber} · {item.projectCode}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
        <div style={ds.rowDate}>{format(parseISO(item.calibrationDueDate), "dd-MM-yyyy")}</div>
        <span  className="text-danger" style={{ ...ds.pill, background: badgeBg, color: badgeColor }}>
          {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? "Today" : `${daysLeft}d left`}
        </span>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
    PANEL WRAPPER
───────────────────────────────────────────────────────────── */
const Panel = ({ title, icon: IconComponent, iconColor, badge, badgeBg, badgeColor, action, onAction, children, bodyStyle }) => (
  <div style={ds.panel}>
    <div style={ds.panelHeader}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: iconColor + "18",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <IconComponent style={{ fontSize: 14, color: iconColor }} />
        </div>
        <span style={ds.panelTitle}>{title}</span>
        {badge !== undefined && (
          <span style={{ ...ds.chip, background: badgeBg ?? "#F3F4F6", color: badgeColor ?? "#374151" }}>
            {badge}
          </span>
        )}
      </div>
      {action && (
        <button style={ds.panelAction} onClick={onAction}>{action}</button>
      )}
    </div>
    <div style={{ ...ds.panelBody, ...bodyStyle }}>{children}</div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
    MAIN DASHBOARD
───────────────────────────────────────────────────────────── */
const Dashboard = () => {
  const [equipmentList, setEquipmentList] = useState([]);
  const [allDueItems,   setAllDueItems]   = useState([]);
  const [gatepassList,  setGatepassList]  = useState([]);
  const [showModal,     setShowModal]     = useState(false);

  const today = new Date();

  const getEquipmentMasterList = async () => {
    try {
      const response = await getEquipmentListService();
      const data = Array.isArray(response)
        ? response
        : response?.data || response?.content || response?.equipmentList || [];
      setEquipmentList(data);
      const due = data
        .filter(item => item.calibrationDueDate && differenceInDays(parseISO(item.calibrationDueDate), today) <= 30)
        .sort((a, b) =>
          differenceInDays(parseISO(a.calibrationDueDate), today) -
          differenceInDays(parseISO(b.calibrationDueDate), today)
        );
      setAllDueItems(due);
      const hasShownModalThisSession = sessionStorage.getItem("hasShownCalibrationModal");
      if (due.length > 0 && !hasShownModalThisSession) {
        setShowModal(true);
        sessionStorage.setItem("hasShownCalibrationModal", "true");
      }
    } catch {
      setEquipmentList([]);
      setAllDueItems([]);
    }
  };

  const getGatepassData = async () => {
    try {
      const response = await getGatepassList();
      const data = Array.isArray(response)
        ? response
        : response?.data || response?.content || response?.gatepassList || [];
      setGatepassList(data);
    } catch {
      setGatepassList([]);
    }
  };

  useEffect(() => {
    getEquipmentMasterList();
    getGatepassData();
  }, []);

  const handleClose = useCallback(() => setShowModal(false), []);

  /* ── Derived counts ── */
  const expiredCount = allDueItems.filter(i =>
    differenceInDays(parseISO(i.calibrationDueDate), today) < 0
  ).length;

  const gpOut     = gatepassList.filter(g => g.itemStatus === "O").length;
  const gpPending = gatepassList.filter(g => g.itemStatus === "P").length;

  const CAT_COLORS = { RMGP: "#E24B4A", TSGP: "#EF9F27", NRMGP: "#355cdd", "NRMGP-C": "#8B5CF6" };

  return (
    <>
      <Navbar />

      {/* Bell FAB */}
      {!showModal && allDueItems.length > 0 && (
        <button onClick={() => setShowModal(true)} style={ds.bellBtn} title="View calibration alerts">
          <FaRegBell style={{ fontSize: 20 }} />
          <span style={ds.bellBadge}>{allDueItems.length}</span>
        </button>
      )}

      {showModal && <CalibrationModal allItems={allDueItems} onClose={handleClose} />}

      <div style={ds.page}>

        {/* ══ ROW 1 — STAT CARDS ══ */}
        <div style={ds.statsGrid}>
          <StatCard
            icon={FaLaptop}
            label="Total Equipment"
            value={equipmentList.length}
            gradientFrom="#355cdd"
            gradientTo="#1e3fa8"
            sub="All registered assets"
          />
          <StatCard
            icon={FaTriangleExclamation}
            label="Calibration Overdue"
            value={expiredCount}
            gradientFrom="#E24B4A"
            gradientTo="#b91c1c"
            sub="Past due date"
          />
          <StatCard
            icon={FaClipboardCheck}
            label="Total Gatepasses"
            value={gatepassList.length}
            gradientFrom="#EF9F27"
            gradientTo="#b45309"
            sub="All gate pass records"
          />
          <StatCard
            icon={BsHourglassSplit}
            label="Pending Returns"
            value={gpOut + gpPending}
            gradientFrom="#8B5CF6"
            gradientTo="#6d28d9"
            sub="Items still outside"
          />
        </div>

        {/* ══ ROW 2 — MAIN ACTIONABLE WORKSPACE ══ */}
        <div className="text-start" style={ds.twoCol}>

          {/* Left: Calibration Alerts */}
          <Panel
            title="Calibration Alerts"
            icon={FaRegBell}
            iconColor="#E24B4A"
            badge={allDueItems.length > 0 ? `${allDueItems.length} pending` : undefined}
            badgeBg="rgba(226,75,74,0.12)"
            badgeColor="#991B1B"
            action={allDueItems.length > 0 ? "View All →" : undefined}
            onAction={() => setShowModal(true)}
          >
            {allDueItems.slice(0, 5).length === 0 ? (
              <div style={ds.emptyState}>
                <FaRegCircleCheck style={{ fontSize: 38, color: "#10B981" }} />
                <p style={{ marginTop: 8, fontSize: 13, color: "#6B7280" }}>
                  All calibrations are up to date
                </p>
              </div>
            ) : (
              allDueItems.slice(0, 5).map(item => (
                <AlertRow key={item.equipmentId} item={item} today={today} />
              ))
            )}
          </Panel>

          {/* Right: Gatepass Category Breakdown */}
          <Panel
            title="Gatepass by Category"
            icon={BsTag}
            iconColor="#8B5CF6"
            bodyStyle={{ justifyContent: "space-between" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {["RMGP", "TSGP", "NRMGP", "NRMGP-C"].map(cat => {
                const count = gatepassList.filter(g => g.category === cat).length;
                const pct   = gatepassList.length > 0
                  ? Math.round((count / gatepassList.length) * 100)
                  : 0;
                const color = CAT_COLORS[cat];
                return (
                  <div key={cat}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{cat}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, color: "#9CA3AF" }}>{count} records</span>
                        <span style={{
                          fontSize: 11, fontWeight: 700,
                          padding: "2px 9px", borderRadius: 20,
                          background: color + "18", color,
                        }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 8, background: "#F1F4F9", borderRadius: 6, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${pct}%`,
                        background: `linear-gradient(90deg, ${color}aa, ${color})`,
                        borderRadius: 6,
                        transition: "width 0.8s ease",
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Total Summary Footer Box */}
            <div style={{
              marginTop: 14, padding: "12px 14px",
              background: "linear-gradient(135deg, #EEF2FF, #F5F3FF)",
              borderRadius: 10,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>Total Gatepass Records</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#355cdd" }}>{gatepassList.length}</span>
            </div>
          </Panel>

        </div>
      </div>
    </>
  );
};

/* ─────────────────────────────────────────────────────────────
    STYLES
───────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────────
   STYLES (UPDATED FOR COMPACT HEIGHT)
───────────────────────────────────────────────────────────── */
const ds = {
  page: {
    padding: "1.25rem 1.5rem",
    width: "100%",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "1.1rem",
    background: "#F1F4F9",
    minHeight: "calc(100vh - 60px)",
  },

  /* Grids */
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "1.1rem",
    flexShrink: 0
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1.1rem",
    alignItems: "stretch", 
  },

  /* Panel */
  panel: {
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    height: "480px", // 💡 Decreased slightly from 400px/100% for a tighter fit
  },
  panelHeader: {
    padding: "0.85rem 1.1rem",
    borderBottom: "1px solid #F1F4F9",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#FAFBFF",
    flexShrink: 0,
  },
  panelTitle:  { fontSize: 13, fontWeight: 700, color: "#111827", letterSpacing: "0.01em" },
  panelAction: {
    fontSize: 12, color: "#355cdd",
    background: "none", border: "none",
    cursor: "pointer", fontWeight: 600, padding: 0,
  },
  panelBody: {
    padding: "1rem 1.2rem",
    overflowY: "auto", 
    display: "flex",
    flexDirection: "column",
    gap: 12,
    flex: 1,
  },

  /* Empty state */
  emptyState: { textAlign: "center", padding: "2.5rem 1rem", color: "#6B7280" },

  /* List row */
  listRow: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "9px 12px",
    borderRadius: "0 10px 10px 0",
    border: "1px solid #F1F4F9",
    background: "#FAFBFF",
  },
  rowIconWrap: {
    width: 30, height: 30, borderRadius: 8,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  rowTitle: { fontSize: 13, fontWeight: 600, color: "#111827" },
  rowMeta:  { fontSize: 11, color: "#6B7280", marginTop: 1 },
  rowDate:  { fontSize: 11, color: "#374151", fontWeight: 600 },
  pill:     { fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700, whiteSpace: "nowrap" },

  /* Chip */
  chip: { fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 600 },

  /* Bell FAB */
  bellBtn: {
    position: "fixed", bottom: 28, right: 28, zIndex: 1040,
    background: "linear-gradient(135deg, #E24B4A, #b91c1c)", color: "#fff",
    border: "none", borderRadius: "50%",
    width: 54, height: 54, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 16px rgba(226,75,74,0.48)",
  },
  bellBadge: {
    position: "absolute", top: 4, right: 4,
    background: "#fff", color: "#E24B4A",
    fontSize: 10, fontWeight: 800,
    borderRadius: "50%", width: 18, height: 18,
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "1.5px solid #E24B4A",
  },
};

/* ── Modal styles ── */
const ms = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 1050,
    background: "rgba(0,0,0,0.45)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "1rem",
  },
  modal: {
    background: "#fff", borderRadius: 14,
    border: "0.5px solid #ddd", width: "100%", maxWidth: 750,
    boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
  },
  header: {
    padding: "1rem 1.25rem",
    background: "linear-gradient(120deg, #355cdd 0%, #1e3fa8 100%)",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    color: "#fff", borderRadius: "14px 14px 0 0",
  },
  headerTitle: { display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 600 },
  closeBtn: {
    border: "0.5px solid rgba(255,255,255,0.4)", borderRadius: 8,
    width: 28, height: 28, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(255,255,255,0.15)", color: "#fff"
  },
  tabBar: { display: "flex", borderBottom: "1px solid #F1F4F9", padding: "0 1.25rem", gap: 4 },
  tabBtn: {
    background: "none", border: "none", borderBottom: "2.5px solid transparent",
    padding: "10px 14px", cursor: "pointer", fontSize: 13,
    display: "flex", alignItems: "center", gap: 6, transition: "color 0.15s",
  },
  tabCount: {
    fontSize: 11, fontWeight: 600, borderRadius: 10,
    padding: "1px 7px", minWidth: 20, textAlign: "center",
  },
  body: {
    padding: "1rem 1.25rem", minHeight: 220, maxHeight: 350,
    overflowY: "auto", display: "flex", flexDirection: "column", gap: 8,
  },
  emptyState: { textAlign: "center", padding: "2rem 1rem", color: "#888" },
  card: {
    border: "0.5px solid #E5E7EB", borderRadius: "0 10px 10px 0",
    padding: "10px 14px",
    display: "flex", alignItems: "center",
    justifyContent: "space-between", gap: 12,
    background: "#FAFBFF",
  },
  cardName:    { fontSize: 14, fontWeight: 600, color: "#111827" },
  cardMeta:    { fontSize: 12, color: "#6B7280", marginTop: 2 },
  cardRight:   { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0, minWidth: 100 },
  cardDueDate: { fontSize: 12, color: "#374151", whiteSpace: "nowrap", fontWeight: 700 },
  badge:       { fontSize: 12, padding: "2px 8px", borderRadius: 6, fontWeight: 600, whiteSpace: "nowrap" },
  footer: {
    padding: "0.75rem 1.25rem", borderTop: "1px solid #F1F4F9",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "#FAFBFF",
  },
  countdown:    { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#888" },
  progressBar:  { width: 120, height: 4, background: "#eee", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", background: "#E24B4A", borderRadius: 2, transition: "width 1s linear" },
  dismissBtn: {
    fontSize: 12, background: "none",
    border: "1px solid #D1D5DB", borderRadius: 8,
    padding: "5px 14px", cursor: "pointer", color: "#374151",
  },
};

export default Dashboard;