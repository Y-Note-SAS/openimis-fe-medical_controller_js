import React from "react";
import { connect, useDispatch } from "react-redux";

import { Grid } from "@material-ui/core";
import { withTheme, withStyles } from "@material-ui/core/styles";

import {
  combine,
  NumberInput,
  PublishedComponent,
  TextInput,
  useModulesManager,
  useTranslations,
  ValidatedTextInput,
  withModulesManager,
  ConstantBasedPicker
} from "@openimis/fe-core";
import { MISSION_STATUS, MODULE_NAME } from "../../constants";

const styles = (theme) => ({
  item: theme.paper.item,
});

const MainPanel = (props) => {
  const {
    autoFocus,
    classes,
    edited,
    onEditedChanged,
    readOnly,
  } = props;

  const dispatch = useDispatch();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations("medical_controller.MissionFormMainPanel", modulesManager);

  return (
    <Grid container direction="row">
      <Grid item xs={3} className={classes.item}>
        <TextInput
          module="medical_controller"
          label="missions.details.code"
          value={edited?.code ?? ""}
          onChange={(v) => onEditedChanged({ ...edited, code: v })}
          readOnly={readOnly}
          autoFocus={autoFocus}
        />
      </Grid>
      <Grid item xs={4} className={classes.item}>
        <PublishedComponent
          pubRef="location.LocationPicker"
          locationLevel={0}
          value={edited.region}
          readonly={readOnly}
          label={formatMessage("medical_controller.missions.region")}
        />
      </Grid>
      <Grid item xs={4} className={classes.item}>
        <PublishedComponent
          pubRef="location.LocationPicker"
          locationLevel={1}
          value={edited.district}
          region={edited.region}
          parentLocation={edited.region}
          readOnly={readOnly}
          label={formatMessage("medical_controller.missions.district")}
        />
      </Grid>
      <Grid item xs={12} className={classes.item}>
        <PublishedComponent
          pubRef="location.HealthFacilityPicker"
          value={edited.healthFacilities}
          district={edited.district}
          region={edited.region}
          multiple
          autoComplete
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3} className={classes.item}>
        <PublishedComponent
          pubRef="medical_controller.MedicalControllerPicker"
          value={edited.medicalController}
          label={formatMessage("medical_controller.missions.medicalController")}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={4} className={classes.item}>
        <ConstantBasedPicker
          module={MODULE_NAME}
          label="missions.status"
          constants={MISSION_STATUS}
          readOnly={readOnly}
          value={edited.status}
        />
      </Grid>
    </Grid>
  );
};

const enhance = combine(withModulesManager, withTheme, withStyles(styles));

export default enhance(MainPanel);
