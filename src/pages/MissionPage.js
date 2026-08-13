import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
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
    const { classes, modulesManager, match } = props;
    const mission_code = match?.params?.mission_code ?? match?.params?.mission_id;
    const history = useHistory();
    const [isLocked, setLocked] = useState(false);
    const rights = useSelector((state) => state.core?.user?.i_user?.rights ?? []);
    if (!rights.includes(RIGHT_MEDICAL_CONTROLLER)) return null;

    return (
        <div className={classes.page}>
            <MissionForm
                readOnly={!rights.includes(RIGHT_MEDICAL_CONTROLLER) || !!isLocked || !isLocked}
                mission_code={mission_code}
                onBack={() => historyPush(modulesManager, history, "medical_controller.missionsList")}
            />
        </div>

    );
};

const enhance = combine(withTheme, withStyles(styles), withHistory, withModulesManager);

export default enhance(MissionPage);
