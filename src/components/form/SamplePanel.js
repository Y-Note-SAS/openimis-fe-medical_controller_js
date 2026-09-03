import React, { Fragment, useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Grid, Button, Typography, Divider, Paper, Table, TableHead, TableBody, TableRow, TableCell } from "@material-ui/core";
import { withStyles, withTheme } from "@material-ui/core/styles";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import GetAppIcon from "@material-ui/icons/GetApp";
import StopIcon from "@material-ui/icons/Stop";
import {
    combine,
    FormattedMessage,
    ProgressOrError,
    PublishedComponent,
    SelectInput,
    useTranslations,
    useModulesManager,
    useHistory,
    historyPush
} from "@openimis/fe-core";
import { MISSION_CATEGORIES, MODULE_NAME, MISSION_STATUS_CLOSED, PERCENTAGE_OPTIONS, DEFAULT_SAMPLE } from "../../constants";
import { fetchTotalSample, fetchClaimSample, fetchMissionHistory } from "../../actions";
import FilterMissionPanel from "./FilterMissionPanel";
import MissionHistoryPanel from "./MissionHistoryPanel";

const styles = (theme) => ({
    tableTitle: {
        ...theme.table.title,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    item: theme.paper.item,
    fullHeight: {
        height: "100%",
    },
    paper: theme.paper.paper,
    table: {
        minWidth: "100%",
    },
    actionButton: {
        marginLeft: "auto",
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        "&:hover": {
            backgroundColor: theme.palette.primary.dark,
        },
    },
});

const buildMissionFilters = (mission = {}) => {
    const _rawHealthFacilities = mission?.healthFacilities;
    if (!mission?.healthFacilities && !mission?.region && !mission?.district) {
        return {};
    }

    const healthFacilities = Array.isArray(_rawHealthFacilities)
        ? mission.healthFacilities.map((hf) => hf?.healthFacility ?? hf)
        : Array.isArray(_rawHealthFacilities.edges)
            ? _rawHealthFacilities.edges.map((edge) => edge?.node?.healthFacility ?? edge)
            : [];

    const healthFacilityIds = healthFacilities
        .map((hf) => hf?.id)
        .filter(Boolean);

    const missionFilters = {};

    // Filtre sur la catégorie (par défaut null)
    missionFilters.category = {
        value: null,
        filter: null,
    };

    // Filtre sur le code de la mission
    if (mission?.missionCode) {
        missionFilters.missionCode = {
            value: mission.missionCode,
            filter: `missionCode: "${mission.missionCode}"`,
        };
    }

    // Filtre sur la liste des IDs des healthFacilities
    if (healthFacilityIds.length) {
        missionFilters.healthFacility = {
            value: healthFacilities,
            filter: `healthFacility_Id_In: ["${healthFacilityIds.join('", "')}"]`,
        };
    }

    return missionFilters;
};

const SamplePanel = (props) => {
    const { classes, edited, onEditedChanged, readOnly, actions, handleShowSampleActions } = props;
    const dispatch = useDispatch();
    const history = useHistory();
    const [filters, setFilters] = useState({});
    const modulesManager = useModulesManager();
    const [hasGeneratedSample, setHasGeneratedSample] = useState(false);
    const [isGeneratingSample, setIsGeneratingSample] = useState(false);
    // Clé utilisée pour remonter le ClaimSearcher et réinitialiser ses filtres internes
    const [sampleGenKey, setSampleGenKey] = useState(0);
    // Valeurs locales des pourcentages (permettent de garder les choix de l'utilisateur)
    const [sampleValues, setSampleValues] = useState({ category1: 0, category2: 0, category3: 0, category4: 0 });
    const lastProcessedSignature = useRef(null);
    const {
        fetchingClaims,
        fetchedClaims,
        errorClaims,
        items: claims,
        pageInfo: claimsPageInfo,
    } = useSelector(
        (state) => state.medical_controller?.claims ?? {
            fetchingClaims: false,
            fetchedClaims: false,
            errorClaims: null,
            items: [],
            pageInfo: { totalCount: 0 },
        },
    );
    const claimsTotals = useSelector((state) => state.medical_controller?.claims?.totals ?? {});
    const claimsPercentages = useSelector((state) => state.medical_controller?.claims?.percentages ?? {});
    const isFetchingSample = useSelector((state) => state.medical_controller?.claimsSample?.isFetching ?? false);
    const sampleError = useSelector((state) => state.medical_controller?.claimsSample?.error ?? null);
    const { formatMessage, formatMessageWithValues } = useTranslations(MODULE_NAME, modulesManager);

    // Dériver les champs de la mission qui conditionnent l'échantillon
    const missionCode = edited?.missionCode;
    const healthFacilities = Array.isArray(edited?.healthFacilities)
        ? edited.healthFacilities.map((hf) => hf?.healthFacility ?? hf)
        : edited?.healthFacilities?.edges
            ? edited.healthFacilities.edges.map((edge) => edge?.node?.healthFacility ?? edge)
            : [];
    const healthFacilityIds = healthFacilities
        .map((hf) => hf?.id)
        .filter(Boolean);
    // Signature stable : rejoue l'effet si le code ou les établissements changent
    const missionSignature = `${missionCode ?? ""}|${healthFacilityIds.join(",")}`;

    useEffect(() => {
        if (!!missionCode && !!edited.percentageOne) {
            setHasGeneratedSample(true);

            if (healthFacilityIds.length > 0 && lastProcessedSignature.current !== missionSignature) {
                lastProcessedSignature.current = missionSignature;
                const missionFilters = buildMissionFilters(edited);
                setFilters(missionFilters);
                dispatch(fetchClaimSample(modulesManager, missionFilters));
                if (typeof handleShowSampleActions === "function") handleShowSampleActions();
            }
        }
    }, [missionCode, missionSignature, edited.percentageOne, healthFacilityIds.length, handleShowSampleActions]);

    const safeNumber = (val) => val != null ? Number(val) : val;

    // Si la mission n'a pas de pourcentages définis, utiliser les valeurs par défaut
    const hasMissionPercentages = edited?.percentageOne != null;

    // Si un échantillonnage a été généré, les pourcentages partent de 0
    // (valeur stockée dans sampleValues pour permettre à l'utilisateur de les modifier)
    const sample = hasGeneratedSample
        ? sampleValues
        : hasMissionPercentages
            ? {
                category1: edited?.sample?.category1 ?? safeNumber(claimsPercentages?.category1) ?? DEFAULT_SAMPLE.category1,
                category2: edited?.sample?.category2 ?? safeNumber(claimsPercentages?.category2) ?? DEFAULT_SAMPLE.category2,
                category3: edited?.sample?.category3 ?? safeNumber(claimsPercentages?.category3) ?? DEFAULT_SAMPLE.category3,
                category4: edited?.sample?.category4 ?? safeNumber(claimsPercentages?.category4) ?? DEFAULT_SAMPLE.category4,
            }
            : { ...DEFAULT_SAMPLE };

    const resetSample = () => {
        if (!onEditedChanged) {
            return;
        }

        const resetValues = Object.keys(DEFAULT_SAMPLE).reduce((acc, key) => ({
            ...acc,
            [key]: 0,
        }), {});

        onEditedChanged({
            ...edited,
            sample: resetValues,
        });
    };

    const handleChange = (key, value) => {
        if (hasGeneratedSample) {
            // Conserver le choix de l'utilisateur dans l'état local
            setSampleValues((prev) => ({ ...prev, [key]: value }));
            return;
        }
        if (!onEditedChanged) {
            return;
        }

        onEditedChanged({
            ...edited,
            sample: {
                ...sample,
                [key]: value,
            },
        });
    };

    const handleGenerateSample = async () => {
        setIsGeneratingSample(true);
        const defaultFilters = buildMissionFilters(edited);
        setFilters(defaultFilters);
        setHasGeneratedSample(true)
        setSampleGenKey((key) => key + 1);
        setSampleValues({ category1: 0, category2: 0, category3: 0, category4: 0 });
        try {
            if (typeof handleShowSampleActions === "function") handleShowSampleActions();
        } catch (err) {
            console.error("handleShowSampleActions error", err);
        }

        // Extraire les IDs des healthFacilities pour fetchTotalSample
        const rawHealthFacilities = edited?.healthFacilities;
        let healthFacilityIds = [];
        if (rawHealthFacilities) {
            if (Array.isArray(rawHealthFacilities)) {
                healthFacilityIds = rawHealthFacilities.map((hf) => hf?.healthFacility?.id ?? hf?.id).filter(Boolean);
            } else if (rawHealthFacilities.edges) {
                healthFacilityIds = rawHealthFacilities.edges
                    .map((edge) => edge?.node?.healthFacility?.id ?? edge?.node?.id)
                    .filter(Boolean);
            }
        }

        // 1er temps : fetchTotalSample pour récupérer les totaux
        try {
            await dispatch(fetchTotalSample(
                modulesManager,
                healthFacilityIds,
                {
                    category1: sample.category1 ?? DEFAULT_SAMPLE.category1,
                    category2: sample.category2 ?? DEFAULT_SAMPLE.category2,
                    category3: sample.category3 ?? DEFAULT_SAMPLE.category3,
                    category4: sample.category4 ?? DEFAULT_SAMPLE.category4,
                },
                edited?.missionCode,
            ));
        } catch (err) {
            console.error("fetchTotalSample error", err);
        }

        // 2ème temps : fetchClaimSample pour mettre à jour le searcher
        dispatch(fetchClaimSample(modulesManager, defaultFilters));

        // Rafraîchir l'historique de la mission
        if (edited?.missionCode) {
            dispatch(fetchMissionHistory(modulesManager, edited.missionCode));
        }
        setIsGeneratingSample(false);
    };

    const handleDownloadMission = () => {
        if (props.onDownloadMission) return props.onDownloadMission(edited);
    };

    const handleCloseMission = () => {
        if (props.onCloseMission) props.onCloseMission(edited);
    };

    const onClaimDoubleClick = (claim, newTab = false) => {
        historyPush(
            modulesManager,
            history,
            "medical_controller.route.claimAudit",
            [edited?.missionCode ?? "", claim.uuid],
            newTab,
            "",
            { mission: edited },
        );
    };

    return (
        <Fragment>
            {!!edited && edited.status != MISSION_STATUS_CLOSED && (<Paper className={classes.paper}>
                <Grid container className={classes.tableTitle}>
                    <Grid item className={classes.paperHeader}>
                        <Typography variant="h6">
                            <FormattedMessage module={MODULE_NAME} id="MissionSamplePanel.title" />
                        </Typography>
                    </Grid>
                    <Grid item className={classes.item} style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
                        <Button
                            variant="contained"
                            color="primary"
                            className={classes.actionButton}
                            startIcon={<PlayArrowIcon />}
                            disabled={isGeneratingSample || fetchingClaims}
                            onClick={handleGenerateSample}
                        >
                            {hasGeneratedSample ? formatMessage("MissionSamplePanel.addSample") : formatMessage("MissionSamplePanel.getSample")}
                        </Button>
                    </Grid>
                </Grid>

                <Divider />
                <Grid container className={classes.item}>
                    <Grid container direction="row" spacing={2}>
                        {MISSION_CATEGORIES.map((label, index) => {
                            const key = `category${label}`;
                            return (
                                <Grid item xs={2} className={classes.item} key={key}>
                                    <SelectInput
                                        module={MODULE_NAME}
                                        label={`MissionSample.${key}`}
                                        options={PERCENTAGE_OPTIONS.map((value) => ({ value, label: `${value}%` }))}
                                        value={sample[key] ?? DEFAULT_SAMPLE[key]}
                                        onChange={(value) => handleChange(key, value)}
                                        key={`${key}-${hasGeneratedSample ? 'loaded' : 'init'}`}
                                    />
                                    {hasGeneratedSample && (
                                        <Typography variant="body2" style={{ marginTop: 4 }}>
                                            {formatMessageWithValues(
                                                'claimSample.total',
                                                { totalCategory: claimsTotals?.[`category${index + 1}`] ?? 0 }
                                            )}
                                        </Typography>
                                    )}
                                </Grid>
                            );
                        })}
                    </Grid>
                </Grid>
            </Paper>)}
            <Grid className={classes.item}>
                <ProgressOrError progress={isFetchingSample} error={errorClaims || sampleError} />
                {hasGeneratedSample && (
                    <PublishedComponent
                        key={`claimSearcher-${sampleGenKey}`}
                        pubRef="claim.ClaimSearcher"
                        modulesManager={modulesManager}
                        defaultFilters={buildMissionFilters(edited)}
                        actions={[]}
                        onDoubleClick={onClaimDoubleClick}
                        filterPane={(searcherProps) => (
                            <FilterMissionPanel
                                {...searcherProps}
                                modulesManager={modulesManager}
                                edited={edited}
                                onChangeFilters={searcherProps.onChangeFilters}
                            />
                        )}
                        edited={edited}
                        canFetch={false}
                        onChangeFilters={(newFilters) => {
                            setFilters(newFilters);
                            dispatch(fetchClaimSample(modulesManager, newFilters));
                        }}
                        forAudit={true}
                        fetchingClaims={fetchingClaims}
                        fetchedClaims={fetchedClaims}
                        errorClaims={errorClaims}
                        claims={claims}
                        claimsPageInfo={claimsPageInfo}
                        fetchClaimsSample={(prms) => {
                            dispatch(fetchClaimSample(modulesManager, buildMissionFilters(edited)));
                        }}
                    />
                )}

            </Grid>

            <Grid className={classes.item}>
                <MissionHistoryPanel classes={classes} modulesManager={modulesManager} missionCode={edited?.missionCode} />
            </Grid>

        </Fragment>
    );
};

const enhance = combine(withTheme, withStyles(styles));

export default enhance(SamplePanel);
