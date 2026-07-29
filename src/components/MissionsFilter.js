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
import { Grid } from "@material-ui/core";
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
              label="medical_controller.missions.code"
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
              label={formatMessage("missions.medicalController")}
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
      <ControlledField
        module={MODULE_NAME}
        id="MissionsFilter.startDate"
        field={
          <Grid item xs={12} sm={4} md={2} className={classes.item}>
            <PublishedComponent
              pubRef="core.DatePicker"
              module={MODULE_NAME}
              label="medical_controller.missions.startDate"
              value={filterValue("startDate")}
              withNull
              onChange={(value) => onChangeFilters([startDateFilter(value)])}
            />
          </Grid>
        }
      />
      <ControlledField
        module={MODULE_NAME}
        id="MissionsFilter.endDate"
        field={
          <Grid item xs={12} sm={4} md={2} className={classes.item}>
            <PublishedComponent
              pubRef="core.DatePicker"
              module={MODULE_NAME}
              label="medical_controller.missions.endDate"
              value={filterValue("endDate")}
              withNull
              onChange={(value) => onChangeFilters([endDateFilter(value)])}
            />
          </Grid>
        }
      />
    </Grid>
  );
};

const enhance = combine(withTheme, withStyles(styles), withModulesManager);

export default enhance(MissionsFilter);
