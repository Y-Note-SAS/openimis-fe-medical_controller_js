import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { withStyles, withTheme } from "@material-ui/core/styles";
import { combine, Helmet, useHistory, useParams, useTranslations, withModulesManager, withHistory } from "@openimis/fe-core";
import { fetchMission } from "../actions";
import { CircularProgress } from "@material-ui/core";
import { Typography, Grid, Paper } from "@material-ui/core";
import { MODULE_NAME, RIGHT_MEDICAL_CONTROLLER } from "../constants";
import MissionForm from "../components/form/MissionForm";

const styles = (theme) => ({
    page: theme.page,
    paper: theme.paper,
    section: {
        padding: theme.spacing(3),
        marginBottom: theme.spacing(3),
    },
    title: {
        marginBottom: theme.spacing(2),
    },
    fieldLabel: {
        fontWeight: 600,
        marginBottom: theme.spacing(1),
    },
    fieldValue: {
        marginBottom: theme.spacing(2),
    },
    row: {
        marginBottom: theme.spacing(1),
    },
});


const MissionPage = (props) => {
    const { classes, modulesManager } = props;
    const { formatMessage, formatMessageWithValues } = useTranslations(MODULE_NAME, modulesManager);
    const { mission_id } = useParams();
    const history = useHistory();
    const [isLocked, setLocked] = useState(false);
    const [isLoaded, setLoaded] = useState(false);
    const dispatch = useDispatch();

    const rights = useSelector((state) => state.core?.user?.i_user?.rights ?? []);
    const missions = useSelector((state) => state.medical_controller?.missions?.items ?? []);
    const fetchedMission = useSelector((state) => state.medical_controller?.mission?.item ?? null);
    const isFetching = useSelector((state) => state.medical_controller?.mission?.isFetching ?? false);
    const mission = (fetchedMission && fetchedMission.id === mission_id)
        ? fetchedMission
        : missions.find((m) => m.id === mission_id);

    if (!rights.includes(RIGHT_MEDICAL_CONTROLLER)) return null;
    if (!mission) return <Typography>{formatMessage("missions.details.notFound")}</Typography>;

    // When opening the page, fetch full mission details by missionCode
    useEffect(() => {
        if (mission?.missionCode) {
            dispatch(fetchMission(modulesManager, mission.missionCode));
        }
    }, [dispatch, modulesManager, mission?.missionCode]);

    return (
        <>
            {isFetching && (
                <Grid container justifyContent="center" style={{ margin: 16 }}>
                    <CircularProgress />
                </Grid>
            )}
            <MissionForm
                readOnly={!rights.includes(RIGHT_MEDICAL_CONTROLLER) || !!isLocked || !isLocked}
                mission={mission}
                onBack={() => historyPush(modulesManager, history, "medical_controller.missionsList")}
            />
        </>
    );
};

const enhance = combine(withTheme, withStyles(styles), withHistory, withModulesManager);

export default enhance(MissionPage);
