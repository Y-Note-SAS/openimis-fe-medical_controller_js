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
} from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
import {
  combine,
  formatMessage,
  PublishedComponent,
  TextInput,
  withModulesManager,
} from "@openimis/fe-core";
import { createMedicalControllerMission } from "../actions";
import { MODULE_NAME } from "../constants";

const styles = (theme) => ({
  dialogTitle: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    paddingBottom: theme.spacing(1),
  },
  titleText: {
    color: theme.palette.primary.contrastText,
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
});

const EMPTY_STATE = {
  region: null,
  district: null,
  healthFacilities: [],
  startMonth: null,
  endMonth: null,
};

const generateMockCode = () => {
  const num = Math.floor(Math.random() * 9000000 + 1000000);
  return String(num);
};

const CreateMissionDialog = (props) => {
  const { classes, intl, modulesManager, open, onClose, onCreated } = props;
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
    setForm((prev) => ({
      ...prev,
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
    if (!form.startMonth) {
      newErrors.startMonth = fmt("createMission.error.startDateRequired");
    }
    if (!form.endMonth) {
      newErrors.endMonth = fmt("createMission.error.endDateRequired");
    }
    if (form.startMonth && form.endMonth && form.startMonth > form.endMonth) {
      newErrors.endMonth = fmt("createMission.error.endBeforeStart");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const payload = {
      code: mockCode,
      regionId: form.region?.uuid,
      districtId: form.district?.uuid ?? null,
      healthFacilityIds: form.healthFacilities.map((hf) => hf.uuid),
      startDate: form.startMonth,
      endDate: form.endMonth,
    };

    dispatch(createMedicalControllerMission(modulesManager, payload, onCreated));
    handleClose();
  };

  const handleClose = () => {
    setForm(EMPTY_STATE);
    setErrors({});
    onClose();
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
              pubRef="location.RegionPicker"
              value={form.region}
              withNull
              allRegions
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
              pubRef="location.DistrictPicker"
              value={form.district}
              region={form.region}
              withNull
              onChange={handleDistrictChange}
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
            />
            {errors.healthFacilities && (
              <Typography className={classes.errorText}>
                {errors.healthFacilities}
              </Typography>
            )}
          </Grid>

          <Grid item xs={6} className={classes.fieldItem}>
            <PublishedComponent
              pubRef="core.MonthYearPicker"
              module={MODULE_NAME}
              label="createMission.startDate"
              value={form.startMonth}
              required
              onChange={(value) => updateField("startMonth", value)}
            />
            {errors.startMonth && (
              <Typography className={classes.errorText}>
                {errors.startMonth}
              </Typography>
            )}
          </Grid>

          <Grid item xs={6} className={classes.fieldItem}>
            <PublishedComponent
              pubRef="core.MonthYearPicker"
              module={MODULE_NAME}
              label="createMission.endDate"
              value={form.endMonth}
              required
              onChange={(value) => updateField("endMonth", value)}
            />
            {errors.endMonth && (
              <Typography className={classes.errorText}>
                {errors.endMonth}
              </Typography>
            )}
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

const enhance = combine(withModulesManager, withStyles(styles));

export default injectIntl(enhance(CreateMissionDialog));
