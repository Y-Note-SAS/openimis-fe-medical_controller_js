import React, { useState } from "react";
import { useSelector } from "react-redux";
import { withStyles, withTheme } from "@material-ui/core/styles";
import { combine, Helmet, useHistory, useParams, useTranslations, withModulesManager, withHistory } from "@openimis/fe-core";
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
    const { mission_uuid } = useParams();
    const history = useHistory();
    const [isLocked, setLocked] = useState(true);
    const [isLoaded, setLoaded] = useState(false);

    const rights = useSelector((state) => state.core?.user?.i_user?.rights ?? []);
    const missions = useSelector((state) => state.medical_controller?.missions?.items ?? []);
    const mission = missions.find((m) => m.uuid === mission_uuid);

    if (!rights.includes(RIGHT_MEDICAL_CONTROLLER)) return null;
    if (!mission) return <Typography>{formatMessage("missions.details.notFound")}</Typography>;

    return (
        <MissionForm
            readOnly={!rights.includes(RIGHT_MEDICAL_CONTROLLER) || !!isLocked}
            mission={mission}
            onBack={() => historyPush(modulesManager, history, "medical_controller.missionsList")}
        />
    );
};

const enhance = combine(withTheme, withStyles(styles), withHistory, withModulesManager);

export default enhance(MissionPage);
