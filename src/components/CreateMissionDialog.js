import React, { useState, useCallback, useRef, useEffect } from "react";
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
  decodeId,
} from "@openimis/fe-core";
import { createMission, checkMissionAvailability, checkHealthFacilitiesAvailability } from "../actions";
import MedicalControllerPicker from "../pickers/MedicalControllerPicker";
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
  errorText: {
    color: theme.palette.error.main,
    fontSize: "0.80rem",
    marginTop: theme.spacing(0.5),
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
  auditors: [],
  missionDate: null,
};

const CreateMissionDialog = (props) => {
  const { classes, intl, modulesManager, open, onClose, onCreated } = props;
  const dispatch = useDispatch();
  const isSubmitting = useSelector(
    (state) => state.medical_controller?.isCreating ?? false
  );
  const currentInteractiveUserId = useSelector(
    (state) => state.core?.user?.i_user?.id
  );
  const currentUser = useSelector((state) => state.core?.user);
  // Le chef de mission est le createur de la mission : affiche en lecture seule
  const chiefName =
    [currentUser?.i_user?.last_name, currentUser?.i_user?.other_names]
      .filter(Boolean)
      .join(" ") || currentUser?.username || "";

  const [mission, setMission] = useState(EMPTY_STATE);
  const [errors, setErrors] = useState({});
  // Etat de la verification de disponibilite : loading / error / empty / verified
  // verified = true uniquement si la derniere verification a reussi avec une liste non vide
  const [availability, setAvailability] = useState({
    loading: false,
    error: false,
    empty: false,
    verified: false,
  });
  const districtRef = useRef(null);
  const lastAvailabilityKeyRef = useRef(null);

  const resetAvailability = () =>
    setAvailability({ loading: false, error: false, empty: false, verified: false });

  // Remonter jusqu'au champ district quand une erreur y est affichée
  useEffect(() => {
    if (errors.district && districtRef.current) {
      districtRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [errors.district]);

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
    lastAvailabilityKeyRef.current = null;
    resetAvailability();
  };

  const handleDistrictChange = (value) => {
    setMission((prev) => ({
      ...prev,
      region: value?.parent ?? mission.region,
      district: value,
      healthFacilities: !!value ? mission.healthFacilities : [],
    }));
    if (errors.district) {
      setErrors((prev) => ({ ...prev, district: null }));
    }
    // La selection a change : on invalide le resultat de la verification precedente
    lastAvailabilityKeyRef.current = null;
    resetAvailability();
  };

  const onChangeHealthFacilities = (value) => {
    setMission((prev) => ({
      ...prev,
      region: value?.length > 0 ? value[0]?.location?.parent : mission.region,
      district: value?.length > 0 ? value[0]?.location : mission.district,
      healthFacilities: value ?? [],
    }));
    if (errors.healthFacilities) {
      setErrors((prev) => ({ ...prev, healthFacilities: null }));
    }
    // La selection a change : on invalide le resultat de la verification precedente
    lastAvailabilityKeyRef.current = null;
    resetAvailability();
  };

  const cansave = () => {
    const startDate = getFirstDayOfMonth(mission.startYear, mission.startMonth);
    const endDate = getLastDayOfMonth(mission.endYear, mission.endMonth);
    const fieldsValid =
      !!mission.region &&
      !!mission.district &&
      !!mission.healthFacilities &&
      mission.healthFacilities.length > 0 &&
      !!mission.startMonth &&
      !!mission.endMonth &&
      !!mission.startYear &&
      !!mission.endYear &&
      endDate > startDate &&
      !!mission.missionDate;

    // Bloque la sauvegarde si la verification de disponibilite est en cours,
    // en erreur, si elle a retourne une liste vide, ou si elle n'a pas encore
    // ete effectuee avec succes (verified).
    const availabilityValid =
      availability.verified &&
      !availability.loading &&
      !availability.error &&
      !availability.empty;

    return fieldsValid && availabilityValid;
  };

  const save = async () => {
    // Garde de sécurité : vérifier que le district existe avant de continuer
    if (!mission.district) return;

    const startDate = getFirstDayOfMonth(mission.startYear, mission.startMonth);
    const endDate = getLastDayOfMonth(mission.endYear, mission.endMonth);

    try {
      // Le chef de mission (utilisateur courant) ne doit jamais partir comme auditeur
      const auditors = (mission.auditors ?? []).filter(
        (auditor) =>
          (!currentInteractiveUserId ||
            auditor?.interactiveId !== currentInteractiveUserId) &&
          (!currentUser?.username || auditor?.username !== currentUser.username),
      );

      const response = await props.createMission(
        {
          ...mission,
          auditors,
          districts: mission.districts,
          healthFacilities: mission.healthFacilities,
        },
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
    lastAvailabilityKeyRef.current = null;
    resetAvailability();
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

  // Normalise un id (encode ou non) pour pouvoir comparer selection et reponse backend
  const normalizeId = (value) => {
    if (value == null) return null;
    try {
      return decodeId(value);
    } catch (e) {
      return value;
    }
  };

  // Garde uniquement les elements presents dans la liste retournee par le backend.
  // La liste retournee peut contenir des objets ({ id, uuid }) ou directement des ids.
  const keepAvailable = (selected, available) => {
    const keys = new Set();
    (available ?? []).forEach((item) => {
      if (item == null) return;
      if (typeof item === "object") {
        [item.id, item.uuid].forEach((value) => {
          if (value == null) return;
          keys.add(String(value));
          const normalized = normalizeId(value);
          if (normalized != null) keys.add(String(normalized));
        });
      } else {
        keys.add(String(item));
      }
    });

    return (selected ?? []).filter((item) => {
      const rawId = typeof item === "object" ? item?.id ?? item?.uuid : item;
      if (rawId == null) return false;
      const normalized = normalizeId(rawId);
      return keys.has(String(rawId)) || (normalized != null && keys.has(String(normalized)));
    });
  };

  // Declenche la verification de disponibilite au changement de la periode (date de fin)
  // ou de la selection (district / formations sanitaires)
  useEffect(() => {
    const { startMonth, startYear, endMonth, endYear } = mission;
    const hasDistrict = !!mission.district;
    const hasHealthFacilities =
      Array.isArray(mission.healthFacilities) && mission.healthFacilities.length > 0;

    // Prerequis incomplets : aucune verification possible, le bouton reste desactive
    if (!startMonth || !startYear || !endMonth || !endYear) {
      resetAvailability();
      return;
    }

    const startDate = getFirstDayOfMonth(startYear, startMonth);
    const endDate = getLastDayOfMonth(endYear, endMonth);
    if (!(endDate > startDate)) {
      resetAvailability();
      return;
    }

    if (!hasDistrict && !hasHealthFacilities) {
      resetAvailability();
      return;
    }

    const districtKey = mission.district ? mission.district?.id ?? mission.district?.uuid : "";
    const healthFacilityKey = (mission.healthFacilities ?? [])
      .map((hf) => hf?.id ?? hf?.uuid)
      .filter(Boolean)
      .join(",");
    const availabilityKey = `${startDate}|${endDate}|${districtKey}|${healthFacilityKey}`;
    if (lastAvailabilityKeyRef.current === availabilityKey) return;

    let cancelled = false;

    const run = async () => {
      setAvailability({ loading: true, error: false, empty: false, verified: false });

      try {
        const response = await props.checkHealthFacilitiesAvailability(
          mission.district ? [mission.district] : [],
          mission.healthFacilities,
          startDate,
          endDate,
        );

        if (cancelled) return;

        if (!response || response.error) {
          setAvailability({ loading: false, error: true, empty: false, verified: false });
          setErrors((prev) => ({
            ...prev,
            healthFacilities: formatMessage(
              intl,
              MODULE_NAME,
              "createMission.availabilityError",
            ),
          }));
          return;
        }

        // La requete peut exposer le resultat sous l'un ou l'autre de ces noms
        const responseData = response?.payload?.data;
        const availabilityData =
          responseData?.checkHealthFacilitiesAvailability ??
          responseData?.checkMissionAvailability;
        if (!availabilityData) {
          setAvailability({ loading: false, error: true, empty: false, verified: false });
          return;
        }

        // La reponse peut etre :
        //  - un objet { districts: [...], healthFacilities: [...] }
        //  - un objet { districtIds: [...], healthFacilityIds: [...] }
        //  - directement une liste de formations sanitaires
        const pickList = (obj, keys) => {
          for (const key of keys) {
            if (obj && obj[key] != null) return obj[key];
          }
          return null;
        };

        const availableDistricts = Array.isArray(availabilityData)
          ? null
          : pickList(availabilityData, ["districts", "districtIds"]);
        const availableHealthFacilitiesList = Array.isArray(availabilityData)
          ? availabilityData
          : pickList(availabilityData, ["healthFacilities", "healthFacilityIds"]) ?? [];

        // Aucun district disponible sur la periode => liste vide
        if (Array.isArray(availableDistricts) && availableDistricts.length === 0) {
          setAvailability({ loading: false, error: false, empty: true, verified: false });
          setErrors((prev) => ({
            ...prev,
            district: formatMessage(
              intl,
              MODULE_NAME,
              "createMission.noDistrictAvailable",
            ),
          }));
          return;
        }

        // Aucune formation sanitaire disponible sur la periode => liste vide
        if (
          !Array.isArray(availableHealthFacilitiesList) ||
          availableHealthFacilitiesList.length === 0
        ) {
          setAvailability({ loading: false, error: false, empty: true, verified: false });
          setErrors((prev) => ({
            ...prev,
            healthFacilities: formatMessage(
              intl,
              MODULE_NAME,
              "createMission.noHealthFacilityAvailable",
            ),
          }));
          return;
        }

        const availableHealthFacilities = keepAvailable(
          mission.healthFacilities,
          availableHealthFacilitiesList,
        );

        // Si le filtrage ne laisse aucune formation sanitaire, on bloque aussi
        if (availableHealthFacilities.length === 0) {
          setAvailability({ loading: false, error: false, empty: true, verified: false });
          setErrors((prev) => ({
            ...prev,
            healthFacilities: formatMessage(
              intl,
              MODULE_NAME,
              "createMission.noHealthFacilityAvailable",
            ),
          }));
          return;
        }

        // Si la reponse contient aussi le district, on verifie qu'il est disponible
        if (Array.isArray(availableDistricts) && mission.district) {
          const availableDistrictSelection = keepAvailable(
            [mission.district],
            availableDistricts,
          );
          if (availableDistrictSelection.length === 0) {
            setAvailability({ loading: false, error: false, empty: true, verified: false });
            setErrors((prev) => ({
              ...prev,
              district: formatMessage(
                intl,
                MODULE_NAME,
                "createMission.noDistrictAvailable",
              ),
            }));
            return;
          }
        }

        // Le filtrage peut modifier la selection : on memorise la cle resultante
        // pour ne pas relancer une requete identique (evite la boucle).
        const filteredHealthFacilityKey = availableHealthFacilities
          .map((hf) => hf?.id ?? hf?.uuid)
          .filter(Boolean)
          .join(",");
        lastAvailabilityKeyRef.current = `${startDate}|${endDate}|${districtKey}|${filteredHealthFacilityKey}`;

        setMission((prev) => ({
          ...prev,
          healthFacilities: availableHealthFacilities,
        }));
        setAvailability({ loading: false, error: false, empty: false, verified: true });
        setErrors((prev) => ({ ...prev, healthFacilities: null, district: null }));
      } catch (err) {
        if (cancelled) return;
        console.error("checkHealthFacilitiesAvailability error", err);
        setAvailability({ loading: false, error: true, empty: false, verified: false });
        setErrors((prev) => ({
          ...prev,
          healthFacilities: formatMessage(
            intl,
            MODULE_NAME,
            "createMission.availabilityError",
          ),
        }));
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [
    mission.startMonth,
    mission.startYear,
    mission.endMonth,
    mission.endYear,
    mission.district,
    mission.healthFacilities,
  ]);

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
            <TextInput
              module={MODULE_NAME}
              label="missions.chief"
              value={chiefName}
              readOnly
            />
          </Grid>

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

          <Grid item xs={12} className={classes.fieldItem} ref={districtRef}>
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
            {errors.district && (
              <Typography color="error" variant="body2" style={{ marginTop: 4 }}>
                {errors.district}
              </Typography>
            )}
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

          <Grid item xs={12} className={classes.fieldItem}>
            <MedicalControllerPicker
              multiple
              value={mission.auditors}
              excludeIds={currentInteractiveUserId ? [currentInteractiveUserId] : []}
              excludeUsernames={currentUser?.username ? [currentUser.username] : []}
              label={formatMessage(intl, MODULE_NAME, "createMission.auditors")}
              onChange={(value) => updateField("auditors", value ?? [])}
            />
          </Grid>

          <Grid item xs={12} className={classes.fieldItem}>
            <PublishedComponent
              pubRef="core.DatePicker"
              module={MODULE_NAME}
              label="createMission.missionDate"
              value={mission.missionDate}
              required
              onChange={(value) => updateField("missionDate", value)}
            />
            {errors.missionDate && (
              <Typography className={classes.errorText}>
                {errors.missionDate}
              </Typography>
            )}
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

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      createMission,
      journalize,
      checkMissionAvailability,
      checkHealthFacilitiesAvailability,
    },
    dispatch,
  );

const enhance = combine(withModulesManager, withStyles(styles), connect(null, mapDispatchToProps));

export default injectIntl(enhance(CreateMissionDialog));