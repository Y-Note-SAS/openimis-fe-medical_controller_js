import React, { useCallback } from "react";
import { combine, Searcher, useTranslations, withModulesManager } from "@openimis/fe-core";
import { withStyles, withTheme } from "@material-ui/core/styles";
import { Tooltip } from "@material-ui/core";
import MissionsFilter from "./MissionsFilter";
import { MODULE_NAME } from "../constants";
import { formatMonthYear } from "../helpers/utils";
import { connect } from "react-redux";

const styles = () => ({});

const formatMedicalController = (controller) =>
  controller ? `${controller.otherNames} ${controller.lastName}` : "";

const getMissionDistrictNames = (mission) => {
  const rawDistricts = mission?.districts;
  const normalizedDistricts = Array.isArray(rawDistricts)
    ? rawDistricts.map((d) => d?.district ?? d)
    : Array.isArray(rawDistricts?.edges)
      ? rawDistricts.edges.map((e) => e?.node?.district ?? e?.node ?? e)
      : mission?.district
        ? [mission.district]
        : [];

  return normalizedDistricts.map((d) => d?.name).filter(Boolean);
};

const formatDistricts = (mission, formatMessageWithValues) => {
  const districtNames = getMissionDistrictNames(mission);
  if (districtNames.length <= 2) {
    return districtNames.join(", ");
  }

  const remainingCount = districtNames.length - 2;
  const visibleDistricts = districtNames.slice(0, 2).join(", ");
  const remainingDistricts = districtNames.slice(2).join(", ");
  const tooltipTitle = formatMessageWithValues("missions.searcher.districts.remainingTooltip", {
    count: remainingCount,
    districts: remainingDistricts,
  });

  return (
    <Tooltip title={tooltipTitle}>
      <span>{`${visibleDistricts} +${remainingCount}`}</span>
    </Tooltip>
  );
};

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
    "medical_controller.missions.missionDate",
    "medical_controller.missions.status",
  ];

  const sorts = useCallback(
    () => [
      ["missionCode", true],
      ["region__name", true],
      ["districts", true],
      ["user", true],
      ["startDate", false],
      ["endDate", false],
      ["missionDate", false],
      ["status", true],
    ],
    []
  );

  const itemFormatters = useCallback(
    () => [
      (mission) => mission.missionCode,
      (mission) => mission.region?.name,
      (mission) => formatDistricts(mission, formatMessageWithValues),
      (mission) => formatMedicalController(mission.user),
      (mission) => formatMonthYear(mission.startDate),
      (mission) => formatMonthYear(mission.endDate),
      (mission) => formatDateFromISO(mission.missionDate),
      (mission) => formatMessage(`missions.status.${mission.status}`),
    ],
    [formatMessage, formatMessageWithValues]
  );

  const filtersToQueryParams = useCallback((state) => {
    const params = Object.keys(state.filters)
      .filter((key) => state.filters[key].filter)
      .map((key) => state.filters[key].filter);

    if (state.orderBy) {
      params.push(`orderBy: ["${state.orderBy}"]`);
    } else {
      params.push(`orderBy: ["-dateCreated"]`);
    }

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
      sorts={sorts}
      itemFormatters={itemFormatters}
      rowIdentifier={(mission) => mission.uuid}
      filtersToQueryParams={filtersToQueryParams}
      defaultOrderBy="-dateCreated"
      onDoubleClick={onDoubleClick}
    />
  );
};

const mapStateToProps = (state) => ({
  items: state.medical_controller.missions.items,
  pageInfo: state.medical_controller.missions.pageInfo,
  fetching: state.medical_controller.missions.isFetching,
  fetched: state.medical_controller.missions.isFetched,
  error: state.medical_controller.missions.error,
});

const enhance = combine(withTheme, withModulesManager, withStyles(styles), connect(mapStateToProps));

export default enhance(MissionsSearcher);
