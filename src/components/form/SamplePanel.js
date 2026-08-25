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
} from "@openimis/fe-core";
import { MISSION_CATEGORIES, MODULE_NAME, MISSION_STATUS_CLOSED } from "../../constants";
import { fetchTotalSample, fetchClaimSample } from "../../actions";
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

const percentageOptions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
const defaultSample = {
    category1: 10,
    category2: 30,
    category3: 100,
    category4: 100,
};

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
        .map((hf) => hf?.uuid ?? hf?.id)
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
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [filters, setFilters] = useState({});
    const modulesManager = useModulesManager();
    const [hasGeneratedSample, setHasGeneratedSample] = useState(false);
    const [isGeneratingSample, setIsGeneratingSample] = useState(false);
    const initialFetchInitiated = useRef(false);
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
    const { formatMessage, formatMessageWithValues } = useTranslations(MODULE_NAME, modulesManager);

    useEffect(() => {
        if (!initialFetchInitiated.current) {
            const healthFacilities = Array.isArray(edited?.healthFacilities)
                ? edited.healthFacilities.map((hf) => hf?.healthFacility ?? hf)
                : edited?.healthFacilities?.edges
                    ? edited.healthFacilities.edges.map((edge) => edge?.node?.healthFacility ?? edge)
                    : [];
            const healthFacilityIds = healthFacilities
                .map((hf) => hf?.uuid ?? hf?.id)
                .filter(Boolean);

            if (healthFacilityIds.length > 0 && edited?.percentageOne) {
                initialFetchInitiated.current = true;
                const missionFilters = buildMissionFilters(edited);
                setFilters(missionFilters);
                dispatch(fetchClaimSample(modulesManager, missionFilters));
                setShowFilterPanel(true);
                if (typeof handleShowSampleActions === "function") handleShowSampleActions();
            }
        }
    }, [edited]);

    useEffect(() => {
        if (claimsPercentages?.category1 !== undefined && claimsPercentages?.category1 !== null && !hasGeneratedSample) {
            setHasGeneratedSample(true);
        }
    }, [claimsPercentages?.category1]);

    const safeNumber = (val) => val != null ? Number(val) : val;

    const sample = {
        category1: edited?.sample?.category1 ?? safeNumber(claimsPercentages?.category1) ?? defaultSample.category1,
        category2: edited?.sample?.category2 ?? safeNumber(claimsPercentages?.category2) ?? defaultSample.category2,
        category3: edited?.sample?.category3 ?? safeNumber(claimsPercentages?.category3) ?? defaultSample.category3,
        category4: edited?.sample?.category4 ?? safeNumber(claimsPercentages?.category4) ?? defaultSample.category4,
    };

    const resetSample = () => {
        if (!onEditedChanged) {
            return;
        }

        const resetValues = Object.keys(defaultSample).reduce((acc, key) => ({
            ...acc,
            [key]: 0,
        }), {});

        onEditedChanged({
            ...edited,
            sample: resetValues,
        });
    };

    const handleChange = (key, value) => {
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
                    category1: sample.category1 ?? defaultSample.category1,
                    category2: sample.category2 ?? defaultSample.category2,
                    category3: sample.category3 ?? defaultSample.category3,
                    category4: sample.category4 ?? defaultSample.category4,
                },
                edited?.missionCode,
            ));
        } catch (err) {
            console.error("fetchTotalSample error", err);
        }

        // 2ème temps : fetchClaimSample pour mettre à jour le searcher
        dispatch(fetchClaimSample(modulesManager, defaultFilters));

        if (!showFilterPanel) {
            setShowFilterPanel(true);
            resetSample();
        }
        setIsGeneratingSample(false);
    };

    const handleDownloadMission = () => {
        if (props.onDownloadMission) return props.onDownloadMission(edited);
        console.log("Download mission", edited);
    };

    const handleCloseMission = () => {
        if (props.onCloseMission) props.onCloseMission(edited);
        setHasGeneratedSample(false);
        setShowFilterPanel(false);
    };

    const categories = ["Categorie 1", "Categorie 2", "Categorie 3", "Categorie 4"];

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
                        {categories.map((label, index) => {
                            const key = `category${index + 1}`;
                            return (
                                <Grid item xs={2} className={classes.item} key={key}>
                                    <SelectInput
                                        module={MODULE_NAME}
                                        label={`MissionSample.${key}`}
                                        options={percentageOptions.map((value) => ({ value, label: `${value}%` }))}
                                        value={sample[key] ?? defaultSample[key]}
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
                {hasGeneratedSample && (
                    <PublishedComponent
                        pubRef="claim.ClaimSearcher"
                        modulesManager={modulesManager}
                        defaultFilters={filters}
                        cacheFiltersKey="medicalControllerMissionSampleClaims"
                        actions={[]}
                        onDoubleClick={null}
                        filterPane={(searcherProps) => (
                            <FilterMissionPanel
                                {...searcherProps}
                                edited={edited}
                                modulesManager={modulesManager}
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
                        fetchClaimsSample={() => {
                            dispatch(fetchClaimSample(modulesManager, filters));
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
