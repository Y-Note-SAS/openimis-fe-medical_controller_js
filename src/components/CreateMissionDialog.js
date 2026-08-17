import React, { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { injectIntl } from "react-intl";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Typography,
  TextField,
  FormLabel
} from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
import {
  combine,
  formatMessage,
  PublishedComponent,
  TextInput,
  withModulesManager,
  MonthPicker,
  YearPicker,
  journalize,
} from "@openimis/fe-core";
import { createMission } from "../actions";
import { MODULE_NAME } from "../constants";
import { getFirstDayOfMonth, getLastDayOfMonth } from "../helpers/utils";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

const styles = (theme) => ({
  dialogTitle: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    paddingBottom: theme.spacing(1),
  },
  titleText: {
    color: theme.palette.text.primary,
    fontWeight: 600,
  },
  dialogContent: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(1),
  },
  fieldItem: {
    padding: theme.spacing(1),
  },
  actions: {
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(1),
  },
  dateGroup: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
  },
  dateLabel: {
    fontSize: "0.80rem",
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.5),
    fontWeight: 300,
  },
  datePickersRow: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
});

const EMPTY_STATE = {
  region: null,
  district: null,
  healthFacilities: [],
  startMonth: "",
  startYear: "",
  endMonth: "",
  endYear: "",
};

const CreateMissionDialog = (props) => {
  const { classes, intl, modulesManager, open, onClose, onCreated } = props;
  const dispatch = useDispatch();
  const isSubmitting = useSelector(
    (state) => state.medical_controller?.isCreating ?? false
  );

  const [mission, setMission] = useState(EMPTY_STATE);
  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setMission((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleRegionChange = (value) => {
    setMission((prev) => ({
      ...prev,
      region: value,
      district: null,
      healthFacilities: [],
    }));
  };

  const handleDistrictChange = (value) => {
    setMission((prev) => ({
      ...prev,
      region: value?.parent ?? mission.region,
      district: value,
      healthFacilities: !!value ? mission.healthFacilities : [],
    }));
  };

  const onChangeHealthFacilities = (value) => {
    setMission((prev) => ({
      ...prev,
      region: value?.length > 0 ? value[0]?.location?.parent : mission.region,
      district: value?.length > 0 ? value[0]?.location : mission.district,
      healthFacilities: value ?? [],
    }));
  };

  const cansave = () => {
    const startDate = getFirstDayOfMonth(mission.startYear, mission.startMonth);
    const endDate = getLastDayOfMonth(mission.endYear, mission.endMonth);
    return !!mission.region && !!mission.district && !!mission.healthFacilities
      && mission.healthFacilities.length > 0 && !!mission.startMonth && !!mission.endMonth && !!mission.startYear
      && !!mission.endYear && (endDate > startDate);
  };

  const save = async () => {
    try {
      const response = await props.createMission(
        mission,
        formatMessage(intl, MODULE_NAME, "createMission"),
      );

      // If the action returned an error, don't close dialog
      if (!response || response.error) return;

      if (props.onCreated) props.onCreated();
      handleClose();
    } catch (err) {
      // swallow or log error; coreAlert is handled by the action
      console.error(err);
    }
  };

  const handleClose = () => {
    setMission(EMPTY_STATE);
    setErrors({});
    onClose();
  };

  const currentYear = new Date().getFullYear();

  const handleMonthChange = (field, value) => {
    if (value === "" || /^[0-9]{1,2}$/.test(value)) {
      const num = parseInt(value);
      if (value === "" || (num >= 1 && num <= 12)) {
        updateField(field, value);
      }
    }
  };

  const handleYearChange = (field, value) => {
    if (value === "" || /^[0-9]{1,4}$/.test(value)) {
      const num = parseInt(value);
      if (value === "" || num > 0) {
        updateField(field, value);
      }
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle disableTypography className={classes.dialogTitle}>
        <Typography variant="h6" className={classes.titleText}>
          {formatMessage(intl, MODULE_NAME, "createMission.title")}
        </Typography>
      </DialogTitle>

      <Divider />

      <DialogContent className={classes.dialogContent}>
        <Grid container>
          <Grid item xs={12} className={classes.fieldItem}>
            <PublishedComponent
              pubRef="location.LocationPicker"
              locationLevel={0}
              value={mission.region}
              withNull
              required
              onChange={handleRegionChange}
            />
          </Grid>

          <Grid item xs={12} className={classes.fieldItem}>
            <PublishedComponent
              pubRef="location.LocationPicker"
              locationLevel={1}
              value={mission.district}
              region={mission.region}
              withNull
              onChange={handleDistrictChange}
              required
              parentLocation={mission.region}
            />
          </Grid>

          <Grid item xs={12} className={classes.fieldItem}>
            <PublishedComponent
              pubRef="location.HealthFacilityPicker"
              value={mission.healthFacilities}
              district={mission.district}
              region={mission.region}
              multiple
              required
              onChange={onChangeHealthFacilities}
              onDataChange={(facilities) => updateField("healthFacilities", facilities)}
              autoComplete
            />
            {errors.healthFacilities && (
              <Typography className={classes.errorText}>
                {errors.healthFacilities}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} className={classes.fieldItem}>
            <div className={classes.dateGroup}>
              <FormLabel required className={classes.dateLabel}>
                {formatMessage(intl, MODULE_NAME, "createMission.startDate")}
              </FormLabel>
              <div className={classes.datePickersRow}>
                <Grid item xs={3}>
                  <MonthPicker
                    value={mission.startMonth}
                    onChange={(e) => updateField("startMonth", e)}
                    withNull={true}
                    withLabel={false}
                  />
                </Grid>
                <Grid item xs={2}>
                  <YearPicker
                    value={mission.startYear}
                    onChange={(e) => updateField("startYear", e)}
                    min={2020}
                    max={currentYear + 1}
                    withLabel={false}
                  />
                </Grid>
              </div>
              {errors.startDate && (
                <Typography className={classes.errorText}>
                  {errors.startDate}
                </Typography>
              )}
            </div>
          </Grid>

          <Grid item xs={12} className={classes.fieldItem}>
            <div className={classes.dateGroup}>
              <FormLabel required className={classes.dateLabel}>
                {formatMessage(intl, MODULE_NAME, "createMission.endDate")}
              </FormLabel>
              <div className={classes.datePickersRow}>
                <Grid item xs={3}>
                  <MonthPicker
                    value={mission.endMonth}
                    onChange={(e) => updateField("endMonth", e)}
                    withNull={true}
                    withLabel={false}
                  />
                </Grid>
                <Grid item xs={2}>
                  <YearPicker
                    value={mission.endYear}
                    onChange={(e) => updateField("endYear", e)}
                    min={mission.endMonth < mission.startMonth ? mission.startYear + 1 : mission.startYear || 2020}
                    max={currentYear + 2}
                    withLabel={false}
                  />
                </Grid>
              </div>
              {errors.endDate && (
                <Typography className={classes.errorText}>
                  {errors.endDate}
                </Typography>
              )}
            </div>
          </Grid>
        </Grid>
      </DialogContent>

      <Divider />

      <DialogActions className={classes.actions}>
        <Button onClick={handleClose} color="primary" disabled={isSubmitting}>
          {formatMessage(intl, MODULE_NAME, "createMission.cancel")}
        </Button>
        <Button
          onClick={save}
          color="primary"
          variant="contained"
          disabled={!cansave() || isSubmitting}
        >
          {formatMessage(intl, MODULE_NAME, "createMission.submit")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const mapDispatchToProps = (dispatch) => bindActionCreators({ createMission, journalize }, dispatch);

const enhance = combine(withModulesManager, withStyles(styles), connect(null, mapDispatchToProps));

export default injectIntl(enhance(CreateMissionDialog));