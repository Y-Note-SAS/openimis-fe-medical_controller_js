import React, { Fragment, useState } from "react";
import { Grid, Button, Typography, Divider, Paper } from "@material-ui/core";
import { withStyles, withTheme } from "@material-ui/core/styles";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import { 
    combine, 
    FormattedMessage, 
    PublishedComponent, 
    SelectInput, 
    useTranslations 
} from "@openimis/fe-core";
import { MODULE_NAME } from "../../constants";
import FilterMissionPanel from "./FilterMissionPanel";

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
    const { classes, edited, onEditedChanged, readOnly, actions, modulesManager } = props;
    const { formatMessage } = useTranslations("medical_controller", modulesManager);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [filters, setFilters] = useState({});
    const [hasGeneratedSample, setHasGeneratedSample] = useState(false);

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

    const categories = ["Categorie 1", "Categorie 2", "Categorie 3", "Categorie 4"];

    return (
        <Fragment>
            <Paper className={classes.paper}>
                <Grid container className={classes.tableTitle}>
                    <Grid item className={classes.item}>
                        <Typography>
                            <FormattedMessage module={MODULE_NAME} id="MissionSamplePanel.title" />
                        </Typography>
                    </Grid>
                    <Button
                        variant="contained"
                        color="primary"
                        className={classes.actionButton}
                        startIcon={<PlayArrowIcon />}
                        onClick={handleGenerateSample}
                    >
                        {hasGeneratedSample ? "Ajouter un échantillon" : "Obtenir un échantillon"}
                    </Button>
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
            )}
        </Fragment>
    );
};

const enhance = combine(withTheme, withStyles(styles));

export default enhance(SamplePanel);
