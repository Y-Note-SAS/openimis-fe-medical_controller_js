import React from "react";
import {
  combine,
  ControlledField,
  ConstantBasedPicker,
  PublishedComponent,
  TextInput,
  useDebounceCb,
  useTranslations,
  withModulesManager,
  MonthPicker,
  MonthYearPicker,
  YearPicker
} from "@openimis/fe-core";
import { Grid, TextField } from "@material-ui/core";
import { withStyles, withTheme } from "@material-ui/core/styles";
import { MISSION_STATUS, MODULE_NAME } from "../constants";
import { getFirstDayOfMonth } from "../helpers/utils";

const styles = (theme) => ({
  form: {
    padding: 0,
    width: "100%",
  },
  item: {
    padding: theme.spacing(1),
  },
  dateGroup: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
  },
  dateLabel: {
    fontSize: "0.75rem",
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.5),
    fontWeight: 500,
  },
  datePickersRow: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  }
});

const MissionsFilter = (props) => {
  const { classes, filters, modulesManager, onChangeFilters } = props;
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
  const filterValue = (key) => filters?.[key]?.value ?? null;
  const debounceTime = modulesManager.getConf("fe-admin", "debounceTime", 500);

  const codeFilter = (value) => ({
    id: "code",
    value,
    filter: value ? `missionCode_Icontains: "${value}"` : null,
  });
  const regionFilter = (value) => ({
    id: "region",
    value,
    filter: value ? `region_Id: "${value.id}"` : null,
  });
  const districtFilter = (value) => ({
    id: "district",
    value,
    filter: value ? `district_Id: "${value.id}"` : null,
  });
  const controllerFilter = (value) => ({
    id: "medicalController",
    value,
    filter: value ? `user_IUser_Id: "${value.id}"` : null,
  });
  const statusFilter = (value) => ({
    id: "status",
    value,
    filter: value ? `status: ${value}` : null,
  });
  const startDateFilter = (value) => ({
    id: "startDate",
    value,
    filter: value ? `startDate_Gte: "${value}"` : null,
  });
  const endDateFilter = (value) => ({
    id: "endDate",
    value,
    filter: value ? `endDate_Lte: "${value}"` : null,
  });

  const onCodeChange = useDebounceCb((value) => onChangeFilters([codeFilter(value)]), debounceTime);

  const createMonthChangeHandler = (prefix, e) => {
    const yearRaw = filterValue(`${prefix}Year`);
    const year = parseInt(yearRaw, 10);
    const month = parseInt(e, 10);

    const monthFilter = {
      id: `${prefix}Month`,
      value: e,
      filter: null,
    };

    // Préparer la liste des mises à jour à envoyer en une seule fois
    const updates = [monthFilter];

    // Si mois ET année valides, ajouter le filtre de date complet
    if (!Number.isNaN(year) && year && !Number.isNaN(month) && month) {
      const dateStr = getFirstDayOfMonth(year, month);
      const filter = prefix == "start" ? startDateFilter(dateStr) : endDateFilter(dateStr);
      updates.push(filter);
    } else {
      // sinon, s'il y avait un filtre de date précédent, le nettoyer
      const clearFilter = prefix == "start" ? startDateFilter(null) : endDateFilter(null);
      updates.push(clearFilter);
    }

    // Appel unique pour mettre à jour le mois (toujours) et le filtre de date (si applicable)
    onChangeFilters(updates);
  };

  const createYearChangeHandler = (prefix, e) => {
    console.log(`${prefix}: ${e}`);
    const monthRaw = filterValue(`${prefix}Month`);
    const month = parseInt(monthRaw, 10);

    const yearFilter = {
      id: `${prefix}Year`,
      value: e,
      filter: null,
    };

    // Préparer la liste des mises à jour à envoyer en une seule fois
    const updates = [yearFilter];

    // Si année ET mois valides, ajouter le filtre de date complet
    const year = parseInt(e, 10);
    if (!Number.isNaN(year) && year && !Number.isNaN(month) && month) {
      const dateStr = getFirstDayOfMonth(year, month);
      const filter = prefix == "start" ? startDateFilter(dateStr) : endDateFilter(dateStr);
      updates.push(filter);
    } else {
      // sinon, nettoyer le filtre de date s'il existait
      const clearFilter = prefix == "start" ? startDateFilter(null) : endDateFilter(null);
      updates.push(clearFilter);
    }

    // Appel unique pour mettre à jour l'année (toujours) et le filtre de date (si applicable)
    onChangeFilters(updates);
  };

  const currentYear = new Date().getFullYear();
  const handleStartYearChange = (e) => createYearChangeHandler("start", e)
  const handleEndYearChange = (e) => createYearChangeHandler("end", e);
  const handleStartMonthChange = (e) => createMonthChangeHandler("start", e);
  const handleEndMonthChange = (e) => createMonthChangeHandler("end", e);
  const startMonth = parseInt(filterValue("startMonth"), 10);
  const endMonth = parseInt(filterValue("endMonth"), 10);
  const _startYear = parseInt(filterValue("startYear"), 10);
  const startYear = Number.isNaN(_startYear) ? null : _startYear;

  return (
    <Grid container className={classes.form}>
      <ControlledField
        module={MODULE_NAME}
        id="MissionsFilter.code"
        field={
          <Grid item xs={12} sm={6} md={3} className={classes.item}>
            <TextInput
              module={MODULE_NAME}
              name="code"
              label={formatMessage("medical_controller.missions.code")}
              value={filterValue("code")}
              onChange={onCodeChange}
            />
          </Grid>
        }
      />
      <ControlledField
        module={MODULE_NAME}
        id="MissionsFilter.region"
        field={
          <Grid item xs={12} sm={6} md={3} className={classes.item}>
            <PublishedComponent
              pubRef="location.LocationPicker"
              locationLevel={0}
              value={filterValue("region")}
              withNull
              label={formatMessage("medical_controller.missions.region")}
              onChange={(value) => onChangeFilters([regionFilter(value), districtFilter(null)])}
            />
          </Grid>
        }
      />
      <ControlledField
        module={MODULE_NAME}
        id="MissionsFilter.district"
        field={
          <Grid item xs={12} sm={6} md={3} className={classes.item}>
            <PublishedComponent
              pubRef="location.LocationPicker"
              locationLevel={1}
              value={filterValue("district")}
              region={filterValue("region")}
              withNull
              onChange={(value) => onChangeFilters([districtFilter(value)])}
              label={formatMessage("medical_controller.missions.district")}
              parentLocation={filterValue("region")}
            />
          </Grid>
        }
      />
      <ControlledField
        module={MODULE_NAME}
        id="MissionsFilter.medicalController"
        field={
          <Grid item xs={12} sm={6} md={3} className={classes.item}>
            <PublishedComponent
              pubRef="medical_controller.MedicalControllerPicker"
              value={filterValue("medicalController")}
              withNull
              label={formatMessage("medical_controller.missions.medicalController")}
              onChange={(value) => onChangeFilters([controllerFilter(value)])}
            />
          </Grid>
        }
      />
      <ControlledField
        module={MODULE_NAME}
        id="MissionsFilter.status"
        field={
          <Grid item xs={12} sm={4} md={2} className={classes.item}>
            <ConstantBasedPicker
              module={MODULE_NAME}
              label="missions.status"
              constants={MISSION_STATUS}
              withNull
              value={filterValue("status")}
              onChange={(value) => onChangeFilters([statusFilter(value)])}
            />
          </Grid>
        }
      />

      <ControlledField
        module={MODULE_NAME}
        id="MissionsFilter.startDate"
        field={
          <Grid item xs={12} md={2} className={classes.item}>
            <div className={classes.dateGroup}>
              <div className={classes.dateLabel}>
                {formatMessage("medical_controller.missions.startDate")}
              </div>
              <div className={classes.datePickersRow}>
                <MonthPicker
                  value={filterValue("startMonth") || ""}
                  onChange={handleStartMonthChange}
                  withNull={true}
                  withLabel={false}
                />
                <Grid item xs={8}>
                  <YearPicker
                    value={filterValue("startYear") || ""}
                    onChange={handleStartYearChange}
                    min={2020}
                    max={currentYear + 1}
                    withLabel={false}
                  />
                </Grid>
              </div>
            </div>
          </Grid>
        }
      />

      <ControlledField
        module={MODULE_NAME}
        id="MissionsFilter.endDate"
        field={
          <Grid item xs={12} md={2} className={classes.item}>
            <div className={classes.dateGroup}>
              <div className={classes.dateLabel}>
                {formatMessage("medical_controller.missions.endDate")}
              </div>
              <div className={classes.datePickersRow}>
                <MonthPicker
                  value={filterValue("endMonth") || ""}
                  onChange={handleEndMonthChange}
                  withNull={true}
                  withLabel={false}
                />
                <Grid item xs={8}>
                  <YearPicker
                    value={filterValue("endYear") || ""}
                    onChange={handleEndYearChange}
                    min={endMonth < startMonth ? (startYear ? startYear + 1 : 2020) : (startYear || 2020)}
                    max={currentYear + 2}
                    withLabel={false}
                  />
                </Grid>
              </div>
            </div>
          </Grid>
        }
      />
    </Grid>
  );
};

const enhance = combine(withTheme, withStyles(styles), withModulesManager);

export default enhance(MissionsFilter);