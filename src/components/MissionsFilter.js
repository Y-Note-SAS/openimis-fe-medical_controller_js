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
} from "@openimis/fe-core";
import { Grid, TextField } from "@material-ui/core";
import { withStyles, withTheme } from "@material-ui/core/styles";
import { MISSION_STATUSES, MODULE_NAME } from "../constants";

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
  },
  monthField: {
    width: 100,
    "& .MuiOutlinedInput-root": {
      borderRadius: 6,
      height: 40,
    },
    "& .MuiOutlinedInput-input": {
      padding: "10px 14px",
      textAlign: "center",
      fontSize: "0.875rem",
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#d1d5db",
    },
  },
  yearField: {
    width: 100,
    "& .MuiOutlinedInput-root": {
      borderRadius: 6,
      height: 40,
    },
    "& .MuiOutlinedInput-input": {
      padding: "10px 14px",
      textAlign: "center",
      fontSize: "0.875rem",
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#d1d5db",
    },
  },
});

const MissionsFilter = (props) => {
  const { classes, filters, modulesManager, onChangeFilters } = props;
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
  const filterValue = (key) => filters?.[key]?.value ?? null;
  const debounceTime = modulesManager.getConf("fe-admin", "debounceTime", 500);

  const codeFilter = (value) => ({
    id: "code",
    value,
    filter: value ? `code_Icontains: "${value}"` : null,
  });
  const regionFilter = (value) => ({
    id: "region",
    value,
    filter: value ? `location_Uuid: "${value.uuid}"` : null,
  });
  const districtFilter = (value) => ({
    id: "district",
    value,
    filter: value ? `location_Uuid: "${value.uuid}"` : null,
  });
  const controllerFilter = (value) => ({
    id: "medicalController",
    value,
    filter: value ? `medicalController_Uuid: "${value.uuid}"` : null,
  });
  const statusFilter = (value) => ({
    id: "status",
    value,
    filter: value ? `status: "${value}"` : null,
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

  // Gestion des dates
  const getStartDateValue = () => {
    const month = filterValue("startMonth");
    const year = filterValue("startYear");
    if (month && year) {
      return `${String(month).padStart(2, "0")}/${year}`;
    }
    return "";
  };

  const getEndDateValue = () => {
    const month = filterValue("endMonth");
    const year = filterValue("endYear");
    if (month && year) {
      return `${String(month).padStart(2, "0")}/${year}`;
    }
    return "";
  };

  const handleStartMonthChange = (e) => {
    const value = e.target.value;
    const month = parseInt(value, 10);
    const year = parseInt(filterValue("startYear"), 10);
    
    // Mettre à jour le mois
    const monthFilter = {
      id: "startMonth",
      value: value,
      filter: null,
    };

    // Si mois et année sont valides, construire la date
    if (month && year && month >= 1 && month <= 12) {
      const date = new Date(year, month - 1, 1);
      const dateStr = date.toISOString().split("T")[0];
      onChangeFilters([monthFilter, startDateFilter(dateStr)]);
    } else {
      onChangeFilters([monthFilter, startDateFilter(null)]);
    }
  };

  const handleStartYearChange = (e) => {
    const value = e.target.value;
    const year = parseInt(value, 10);
    const month = parseInt(filterValue("startMonth"), 10);
    
    const yearFilter = {
      id: "startYear",
      value: value,
      filter: null,
    };

    if (month && year && month >= 1 && month <= 12 && year > 0) {
      const date = new Date(year, month - 1, 1);
      const dateStr = date.toISOString().split("T")[0];
      onChangeFilters([yearFilter, startDateFilter(dateStr)]);
    } else {
      onChangeFilters([yearFilter, startDateFilter(null)]);
    }
  };

  const handleEndMonthChange = (e) => {
    const value = e.target.value;
    const month = parseInt(value, 10);
    const year = parseInt(filterValue("endYear"), 10);
    
    const monthFilter = {
      id: "endMonth",
      value: value,
      filter: null,
    };

    if (month && year && month >= 1 && month <= 12) {
      const date = new Date(year, month, 0);
      const dateStr = date.toISOString().split("T")[0];
      onChangeFilters([monthFilter, endDateFilter(dateStr)]);
    } else {
      onChangeFilters([monthFilter, endDateFilter(null)]);
    }
  };

  const handleEndYearChange = (e) => {
    const value = e.target.value;
    const year = parseInt(value, 10);
    const month = parseInt(filterValue("endMonth"), 10);
    
    const yearFilter = {
      id: "endYear",
      value: value,
      filter: null,
    };

    if (month && year && month >= 1 && month <= 12 && year > 0) {
      const date = new Date(year, month, 0);
      const dateStr = date.toISOString().split("T")[0];
      onChangeFilters([yearFilter, endDateFilter(dateStr)]);
    } else {
      onChangeFilters([yearFilter, endDateFilter(null)]);
    }
  };

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
              pubRef="location.RegionPicker"
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
              pubRef="location.DistrictPicker"
              value={filterValue("district")}
              region={filterValue("region")}
              withNull
              label={formatMessage("medical_controller.missions.district")}
              onChange={(value) => onChangeFilters([districtFilter(value)])}
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
              constants={MISSION_STATUSES}
              withNull
              value={filterValue("status")}
              onChange={(value) => onChangeFilters([statusFilter(value)])}
            />
          </Grid>
        }
      />
      
      {/* Start Date - MM YYYY */}
      <ControlledField
        module={MODULE_NAME}
        id="MissionsFilter.startDate"
        field={
          <Grid item xs={12} sm={4} md={2} className={classes.item}>
            <div className={classes.dateGroup}>
              <div className={classes.dateLabel}>
                {formatMessage("medical_controller.missions.startDate")}
              </div>
              <div className={classes.datePickersRow}>
                <TextField
                  className={classes.monthField}
                  value={filterValue("startMonth") || ""}
                  onChange={handleStartMonthChange}
                  placeholder="MM"
                  variant="outlined"
                  size="small"
                  inputProps={{
                    maxLength: 2,
                    style: { textAlign: "center" },
                  }}
                />
                <TextField
                  className={classes.yearField}
                  value={filterValue("startYear") || ""}
                  onChange={handleStartYearChange}
                  placeholder="YYYY"
                  variant="outlined"
                  size="small"
                  inputProps={{
                    maxLength: 4,
                    style: { textAlign: "center" },
                  }}
                />
              </div>
            </div>
          </Grid>
        }
      />

      {/* End Date - MM YYYY */}
      <ControlledField
        module={MODULE_NAME}
        id="MissionsFilter.endDate"
        field={
          <Grid item xs={12} sm={4} md={2} className={classes.item}>
            <div className={classes.dateGroup}>
              <div className={classes.dateLabel}>
                {formatMessage("medical_controller.missions.endDate")}
              </div>
              <div className={classes.datePickersRow}>
                <TextField
                  className={classes.monthField}
                  value={filterValue("endMonth") || ""}
                  onChange={handleEndMonthChange}
                  placeholder="MM"
                  variant="outlined"
                  size="small"
                  inputProps={{
                    maxLength: 2,
                    style: { textAlign: "center" },
                  }}
                />
                <TextField
                  className={classes.yearField}
                  value={filterValue("endYear") || ""}
                  onChange={handleEndYearChange}
                  placeholder="YYYY"
                  variant="outlined"
                  size="small"
                  inputProps={{
                    maxLength: 4,
                    style: { textAlign: "center" },
                  }}
                />
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