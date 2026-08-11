import React, { useState, useCallback } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import { bindActionCreators } from "redux";
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
  YearPicker
} from "@openimis/fe-core";
import { createMedicalControllerMission } from "../actions";
import { MODULE_NAME } from "../constants";
import { getFirstDayOfMonth } from "../helpers/utils";

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
  codeLabel: {
    color: theme.palette.primary.main,
    fontSize: "0.75rem",
    marginBottom: theme.spacing(0.5),
  },
  codeValue: {
    color: theme.palette.text.secondary,
    fontSize: "1rem",
    borderBottom: `1px solid ${theme.palette.divider}`,
    paddingBottom: theme.spacing(0.5),
  },
  errorText: {
    color: theme.palette.error.main,
    fontSize: "0.75rem",
    marginTop: theme.spacing(0.5),
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

const EMPTY_STATE = {
  region: null,
  district: null,
  healthFacilities: [],
  startMonth: "",
  startYear: "",
  endMonth: "",
  endYear: "",
};

const generateMockCode = () => {
  const num = Math.floor(Math.random() * 9000000 + 1000000);
  return String(num);
};

const CreateMissionDialog = (props) => {
  const { classes, intl, modulesManager, open, onClose, onCreated, healthFacilities } = props;
  const dispatch = useDispatch();
  const isSubmitting = useSelector(
    (state) => state.medical_controller?.isCreating ?? false
  );

  const [form, setForm] = useState(EMPTY_STATE);
  const [errors, setErrors] = useState({});
  const [mockCode] = useState(generateMockCode);

  const fmt = useCallback(
    (key) => formatMessage(intl, MODULE_NAME, key),
    [intl]
  );

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleRegionChange = (value) => {
    setForm((prev) => ({
      ...prev,
      region: value,
      district: null,
      healthFacilities: [],
    }));
    setErrors((prev) => ({ ...prev, region: null, district: null, healthFacilities: null }));
  };

  const handleDistrictChange = (value) => {
    console.log(healthFacilities)
    setForm((prev) => ({
      ...prev,
      region: value?.parent ?? form.region,
      district: value,
      healthFacilities: [],
    }));
    setErrors((prev) => ({ ...prev, healthFacilities: null }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.region) {
      newErrors.region = fmt("createMission.error.regionRequired");
    }
    if (!form.healthFacilities || form.healthFacilities.length === 0) {
      newErrors.healthFacilities = fmt("createMission.error.healthFacilitiesRequired");
    }
    if (!form.startMonth || !form.startYear) {
      newErrors.startDate = fmt("createMission.error.startDateRequired");
    }
    if (!form.endMonth || !form.endYear) {
      newErrors.endDate = fmt("createMission.error.endDateRequired");
    }

    if (form.startMonth && form.startYear && form.endMonth && form.endYear) {
      const startDate = new Date(parseInt(form.startYear), parseInt(form.startMonth) - 1);
      const endDate = new Date(parseInt(form.endYear), parseInt(form.endMonth) - 1);
      if (endDate < startDate) {
        newErrors.endDate = fmt("createMission.error.endBeforeStart");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const startDate = new Date(parseInt(form.startYear), parseInt(form.startMonth) - 1, 1);
    const endDate = new Date(parseInt(form.endYear), parseInt(form.endMonth) - 1, 1);
    const lastDayOfMonth = new Date(parseInt(form.endYear), parseInt(form.endMonth), 0);
    endDate.setDate(lastDayOfMonth.getDate());

    const payload = {
      code: mockCode,
      regionId: form.region?.uuid,
      districtId: form.district?.uuid ?? null,
      healthFacilityIds: form.healthFacilities.map((hf) => hf.uuid),
      startDate: getFirstDayOfMonth(form.startMonth, form.startYear),
      endDate: endDate.toISOString().split("T")[0],
    };

    dispatch(createMedicalControllerMission(modulesManager, payload, onCreated));
    handleClose();
  };

  const handleClose = () => {
    setForm(EMPTY_STATE);
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
          {fmt("createMission.title")}
        </Typography>
      </DialogTitle>

      <Divider />

      <DialogContent className={classes.dialogContent}>
        <Grid container>
          <Grid item xs={12} className={classes.fieldItem}>
            <Typography className={classes.codeLabel}>
              {fmt("createMission.code")}
            </Typography>
            <Typography className={classes.codeValue}>{mockCode}</Typography>
          </Grid>

          <Grid item xs={12} className={classes.fieldItem}>
            <PublishedComponent
              pubRef="location.LocationPicker"
              locationLevel={0}
              value={form.region}
              withNull
              required
              onChange={handleRegionChange}
            />
            {errors.region && (
              <Typography className={classes.errorText}>
                {errors.region}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} className={classes.fieldItem}>
            <PublishedComponent
              pubRef="location.LocationPicker"
              locationLevel={1}
              value={form.district}
              region={form.region}
              withNull
              onChange={handleDistrictChange}
              required
              parentLocation={form.region}
            />
          </Grid>

          <Grid item xs={12} className={classes.fieldItem}>
            <PublishedComponent
              pubRef="location.HealthFacilityPicker"
              value={form.healthFacilities}
              district={form.district}
              region={form.region}
              multiple
              required
              onChange={(value) => updateField("healthFacilities", value ?? [])}
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
                {fmt("createMission.startDate")}
              </FormLabel>
              <div className={classes.datePickersRow}>
                <Grid item xs={3}>
                  <MonthPicker
                    value={form.startMonth}
                    onChange={(e) => handleMonthChange("startMonth", e)}
                    withNull={true}
                    withLabel={false}
                  />
                </Grid>
                <Grid item xs={2}>
                  <YearPicker
                    value={form.startYear}
                    onChange={(e) => handleYearChange("startYear", e)}
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
                {fmt("createMission.endDate")}
              </FormLabel>
              <div className={classes.datePickersRow}>
                <Grid item xs={3}>
                  <MonthPicker
                    value={form.endMonth}
                    onChange={(e) => handleMonthChange("endMonth", e)}
                    withNull={true}
                    withLabel={false}
                  />
                </Grid>
                <Grid item xs={2}>
                  <YearPicker
                    value={form.endYear}
                    onChange={(e) => handleYearChange("endYear", e)}
                    min={form.endMonth < form.startMonth ? form.startYear + 1 : form.startYear || 2020}
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
          {fmt("createMission.cancel")}
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={isSubmitting}
        >
          {fmt("createMission.submit")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const mapStateToProps = (state) => ({
  healthFacilities: state.loc?.healthFacilities,
});

const enhance = combine(withModulesManager, withStyles(styles), connect(mapStateToProps));

export default injectIntl(enhance(CreateMissionDialog));