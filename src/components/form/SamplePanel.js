import React, { Fragment, useState } from "react";
import { Grid, Button, Typography, Divider, Paper, Table, TableHead, TableBody, TableRow, TableCell } from "@material-ui/core";
import { withStyles, withTheme } from "@material-ui/core/styles";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import GetAppIcon from "@material-ui/icons/GetApp";
import StopIcon from "@material-ui/icons/Stop";
import {
    combine,
    FormattedMessage,
    PublishedComponent,
    SelectInput,
    useTranslations
} from "@openimis/fe-core";
import { MODULE_NAME } from "../../constants";
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

    const missionFilters = {};
    // if (mission.region) {
    //     missionFilters.region = {
    //         value: mission.region,
    //         filter: `healthFacility_Location_Parent_Uuid: "${mission.region.uuid}"`,
    //     };
    // }
    // if (healthFacilities.length) {
    //     missionFilters.healthFacility = {
    //         value: healthFacilities,
    //         filter: `healthFacility_Id_In: ["${healthFacilities.map((hf) => hf.uuid).filter(Boolean).join('", "')}"]`,
    //     };
    // }
    return missionFilters;
};

const SamplePanel = (props) => {
    const { classes, edited, onEditedChanged, readOnly, actions, modulesManager, handleShowSampleActions } = props;
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [filters, setFilters] = useState({});
    const [hasGeneratedSample, setHasGeneratedSample] = useState(false);
    const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);

    const sample = {
        ...defaultSample,
        ...(edited?.sample ?? {}),
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

    const handleGenerateSample = () => {
        const defaultFilters = buildMissionFilters(edited);
        setFilters(defaultFilters);
        handleShowSampleActions();

        if (!showFilterPanel) {
            setShowFilterPanel(true);
            setHasGeneratedSample(true);
            resetSample();
            return;
        }

        if (!hasGeneratedSample) {
            setShowFilterPanel(true);
            setHasGeneratedSample(true);
            resetSample();
        }
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

    const historyActions = [
        { date: "2026-08-01", time: "09:30", controller: "Dr. Jean Dupont", action: "Création de mission" },
        { date: "2026-08-02", time: "11:15", controller: "Dr. Marie Curie", action: "Validation" },
        { date: "2026-08-05", time: "14:45", controller: "Dr. Paul Martin", action: "Clôture" },
    ];

    return (
        <Fragment>
            <Paper className={classes.paper}>
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
                                        label={`MissionSamplePanel.${key}`}
                                        options={percentageOptions.map((value) => ({ value, label: `${value}%` }))}
                                        value={sample[key] ?? defaultSample[key]}
                                        onChange={(value) => handleChange(key, value)}
                                    />
                                </Grid>
                            );
                        })}
                    </Grid>
                </Grid>
            </Paper>

            {showFilterPanel && hasGeneratedSample && (
                <Grid className={classes.item}>
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
                        canFetch={true}
                        onChangeFilters={(newFilters) => setFilters(newFilters)}
                        forAudit={true}
                    />
                </Grid>
            )}

            {hasGeneratedSample && (
                <Grid className={classes.item}>
                    <MissionHistoryPanel classes={classes} modulesManager={modulesManager} historyActions={historyActions} />
                </Grid>
            )}
        </Fragment>
    );
};

const enhance = combine(withTheme, withStyles(styles));

export default enhance(SamplePanel);
