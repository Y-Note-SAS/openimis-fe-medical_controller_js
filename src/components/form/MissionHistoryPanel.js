import React, { Fragment, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Searcher, useTranslations } from "@openimis/fe-core";
import { MODULE_NAME } from "../../constants";
import { fetchMissionHistory } from "../../actions";

const formatTimestamp = (timestamp) => {
  if (!timestamp) return { date: "", time: "" };
  // Traiter le timestamp comme UTC et le convertir dans le fuseau horaire local
  const match = String(timestamp).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (match) {
    const [, y, mo, d, h, mi] = match.map(Number);
    const date = new Date(Date.UTC(y, mo - 1, d, h, mi));
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`,
    };
  }
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
};

const MissionHistoryPanel = ({ classes, modulesManager, missionCode }) => {
  const dispatch = useDispatch();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
  const {
    items: historyItems,
    fetchingHistory,
    fetchedHistory,
    errorHistory,
    pageInfo,
  } = useSelector((state) => state.medical_controller?.missionHistory ?? {
    items: [],
    fetchingHistory: false,
    fetchedHistory: false,
    errorHistory: null,
    pageInfo: { totalCount: 0 },
  });

  useEffect(() => {
    if (missionCode) {
      dispatch(fetchMissionHistory(modulesManager, missionCode));
    }
  }, [missionCode]);

  // Trier du plus récent au plus ancien
  const sortedItems = [...historyItems].sort((a, b) => {
    return new Date(b.actionDate) - new Date(a.actionDate);
  });

  const headers = useCallback(() => [
    "MissionHistory.date",
    "MissionHistory.time",
    "MissionHistory.controller",
    "MissionHistory.action",
  ], []);

  const itemFormatters = useCallback(() => [
    (h) => <span style={{ whiteSpace: "nowrap" }}>{formatTimestamp(h.actionDate).date}</span>,
    (h) => <span style={{ whiteSpace: "nowrap" }}>{formatTimestamp(h.actionDate).time}</span>,
    (h) => h.user?.username ?? "",
    (h) => h.action,
  ], []);

  return (
    <Fragment>
      <Searcher
        module={MODULE_NAME}
        tableTitle={formatMessage("MissionHistory.title")}
        headers={headers}
        itemFormatters={itemFormatters}
        items={sortedItems}
        itemsPageInfo={{ totalCount: sortedItems.length }}
        fetchingItems={fetchingHistory}
        errorItems={errorHistory}
        fetchedItems={fetchedHistory}
        fetch={() => {}}
        rowIdentifier={(h, idx) => `${h.actionDate}-${idx}`}
        canFetch={false}
      />
    </Fragment>
  );
};

export default MissionHistoryPanel;
