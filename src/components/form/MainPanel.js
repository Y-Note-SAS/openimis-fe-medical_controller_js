import React, { Fragment } from "react";

import { Grid, FormLabel, Button } from "@material-ui/core";
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
  ConstantBasedPicker,
  MonthPicker,
  YearPicker,
  useGraphqlQuery,
} from "@openimis/fe-core";
import { MISSION_STATUS, MODULE_NAME } from "../../constants";
import { getMonth, getYear } from "../../helpers/utils";

const styles = (theme) => ({
  item: theme.paper.item,
  dateLabel: {
    fontSize: "0.80rem",
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.5),
    fontWeight: 300,
  },
});

const MainPanel = (props) => {
  const {
    autoFocus,
    classes,
    edited,
    onEditedChanged,
    readOnly,
    intl
  } = props;

  // Normalize edited.healthFacilities into a safe array of healthFacility objects
  const _rawHealthFacilities = edited?.healthFacilities;
  let displayedHealthFacilities = [];
  if (Array.isArray(_rawHealthFacilities)) {
    displayedHealthFacilities = _rawHealthFacilities.map((hf) => hf?.healthFacility ?? hf);
  } else if (_rawHealthFacilities && Array.isArray(_rawHealthFacilities.edges)) {
    displayedHealthFacilities = _rawHealthFacilities.edges.map((e) => e?.node?.healthFacility ?? e?.node ?? e);
  } else {
    displayedHealthFacilities = [];
  }

  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations("medical_controller.MissionFormMainPanel", modulesManager);

  // Auditeurs de la mission (lecture seule)
  const missionCode = edited?.missionCode;
  const { data: missionUsersData } = useGraphqlQuery(
    `query MissionAuditors($missionCode: String) {
      missionsUsers(mission_MissionCode: $missionCode, first: 100) {
        edges {
          node {
            id
            user {
              id
              loginName
              lastName
              otherNames
            }
          }
        }
      }
    }`,
    { missionCode },
    { skip: !missionCode },
  );
  // Le chef de mission (createur) ne doit jamais apparaitre dans les auditeurs,
  // y compris pour les missions creees avant le controle cote backend.
  const chiefLoginName = edited?.user?.username;
  const auditors = (missionUsersData?.missionsUsers?.edges ?? [])
    .map((edge) => edge.node?.user)
    .filter(Boolean)
    .filter((user) => !chiefLoginName || user.loginName !== chiefLoginName);
  const auditorOptions = auditors.map((user) => ({
    id: user.id,
    interactiveId: user.id,
    username: user.loginName,
    lastName: user.lastName,
    otherNames: user.otherNames,
  }));

  const currentYear = new Date().getFullYear();

  return (
    <Grid container direction="column" className={classes.item} spacing={3}>
      <Grid container direction="row">
        <Grid item xs={2} className={classes.item}>
          <TextInput
            module="medical_controller"
            label="missions.details.code"
            value={edited?.missionCode ?? ""}
            onChange={(v) => onEditedChanged({ ...edited, missionCode: v })}
            readOnly={readOnly}
            autoFocus={autoFocus}
          />
        </Grid>
        <Grid item xs={2} className={classes.item}>
          <PublishedComponent
            pubRef="location.LocationPicker"
            locationLevel={0}
            value={edited.region}
            readOnly={readOnly}
            label={formatMessage("medical_controller.missions.region")}
          />
        </Grid>
        <Grid item xs={8} className={classes.item}>
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
      </Grid>
      <Grid container direction="row">
        <Grid item xs={12} className={classes.item}>
          <PublishedComponent
            pubRef="location.HealthFacilityPicker"
            value={displayedHealthFacilities}
            district={edited.district}
            region={edited.region}
            multiple
            autoComplete
            readOnly={readOnly}
          />
        </Grid>
      </Grid>
      <Grid container direction="row">
        <Grid item xs={12} sm={6} md={3} className={classes.item}>
          <PublishedComponent
            pubRef="medical_controller.MedicalControllerPicker"
            value={edited.user}
            label={formatMessage("medical_controller.missions.chief")}
            readOnly={readOnly}
          />
        </Grid>
        <Grid item xs={8} className={classes.item}>
          <PublishedComponent
            pubRef="medical_controller.MedicalControllerPicker"
            multiple
            readOnly
            value={auditorOptions}
            label={formatMessage("medical_controller.missions.auditors")}
          />
        </Grid>
      </Grid>
      <Grid container direction="row">
        <Grid item xs={6} md={3} className={classes.item}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} className={classes.item}>
              <FormLabel className={classes.dateLabel}>
                {formatMessage("medical_controller.MissionFormMainPanel.startDate")}
              </FormLabel>
              <Grid container direction="row" spacing={1} wrap="nowrap">
                <Grid item xs={8} className={classes.item}>
                  <MonthPicker
                    value={getMonth(edited.startDate)}
                    withLabel={false}
                    readOnly={readOnly}
                  />
                </Grid>
                <Grid item xs={4} className={classes.item}>
                  <YearPicker
                    value={getYear(edited.startDate)}
                    withLabel={false}
                    min={getYear(edited.startDate)}
                    max={currentYear + 1}
                    readOnly={readOnly}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} sm={6} className={classes.item}>
              <FormLabel className={classes.dateLabel}>
                {formatMessage("medical_controller.MissionFormMainPanel.endDate")}
              </FormLabel>
              <Grid container direction="row" spacing={1} wrap="nowrap">
                <Grid item xs={8} className={classes.item}>
                  <MonthPicker
                    value={getMonth(edited.endDate)}
                    withLabel={false}
                    readOnly={readOnly}
                  />
                </Grid>
                <Grid item xs={4} className={classes.item}>
                  <YearPicker
                    value={getYear(edited.endDate)}
                    withLabel={false}
                    min={getYear(edited.endDate)}
                    max={currentYear + 1}
                    readOnly={readOnly}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <Grid item className={classes.item}>
          <PublishedComponent
            pubRef="core.DatePicker"
            module={MODULE_NAME}
            label="medical_controller.missions.missionDate"
            value={edited?.missionDate}
            readOnly
          />
        </Grid>
        <Grid item xs={1} className={classes.item}>
          <ConstantBasedPicker
            module={MODULE_NAME}
            label="missions.status"
            constants={MISSION_STATUS}
            readOnly={readOnly}
            value={edited.status}
          />
        </Grid>
      </Grid>
    </Grid>
  );
};

const enhance = combine(withModulesManager, withTheme, withStyles(styles));

export default enhance(MainPanel);
