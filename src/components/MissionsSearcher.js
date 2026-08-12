import React, { useCallback } from "react";
import { combine, Searcher, useTranslations, withModulesManager } from "@openimis/fe-core";
import { withStyles, withTheme } from "@material-ui/core/styles";
import MissionsFilter from "./MissionsFilter";
import { MODULE_NAME } from "../constants";
import { formatMonthYear } from "../helpers/utils";

const styles = () => ({});

const formatMedicalController = (controller) =>
  controller ? `${controller.otherNames} ${controller.lastName}` : "";

const MissionsSearcher = (props) => {
  const { error, fetched, fetching, items, modulesManager, onFiltersChange, onDoubleClick, pageInfo } = props;
  const { formatDateFromISO, formatMessage, formatMessageWithValues } = useTranslations(MODULE_NAME, modulesManager);

  const headers = () => [
    "medical_controller.missions.code",
    "medical_controller.missions.region",
    "medical_controller.missions.district",
    "medical_controller.missions.medicalController",
    "medical_controller.missions.startDate",
    "medical_controller.missions.endDate",
    "medical_controller.missions.status",
  ];

  const itemFormatters = useCallback(
    () => [
      (mission) => mission.code,
      (mission) => mission.region?.name,
      (mission) => mission.district?.name,
      (mission) => formatMedicalController(mission.medicalController),
      (mission) => formatMonthYear(mission.startDate),
      (mission) => formatMonthYear(mission.endDate),
      (mission) => formatMessage(`missions.status.${mission.status}`),
    ],
    []
  );

  const filtersToQueryParams = useCallback((state) => {
    const params = Object.keys(state.filters)
      .filter((key) => state.filters[key].filter)
      .map((key) => state.filters[key].filter);

    if (!state.beforeCursor && !state.afterCursor) {
      params.push(`first: ${state.pageSize}`);
    }
    if (state.afterCursor) {
      params.push(`after: "${state.afterCursor}"`);
      params.push(`first: ${state.pageSize}`);
    }
    if (state.beforeCursor) {
      params.push(`before: "${state.beforeCursor}"`);
      params.push(`last: ${state.pageSize}`);
    }

    return params;
  }, []);

  return (
    <Searcher
      module={MODULE_NAME}
      FilterPane={MissionsFilter}
      cacheFiltersKey="medicalControllerMissionsPageFiltersCache"
      items={items}
      itemsPageInfo={pageInfo}
      fetchingItems={fetching}
      fetchedItems={fetched}
      errorItems={error}
      tableTitle={formatMessageWithValues("missions.table.title", { count: pageInfo.totalCount ?? 0 })}
      fetch={onFiltersChange}
      headers={headers}
      itemFormatters={itemFormatters}
      rowIdentifier={(mission) => mission.uuid}
      filtersToQueryParams={filtersToQueryParams}
      onDoubleClick={onDoubleClick}
    />
  );
};

const enhance = combine(withTheme, withModulesManager, withStyles(styles));

export default enhance(MissionsSearcher);
