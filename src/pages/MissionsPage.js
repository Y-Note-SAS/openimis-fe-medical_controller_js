import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Add as AddIcon } from "@material-ui/icons";
import { Fab, Typography } from "@material-ui/core";
import { withStyles, withTheme } from "@material-ui/core/styles";
import { combine, Helmet, historyPush, useHistory, useTranslations, withModulesManager } from "@openimis/fe-core";
import MissionsSearcher from "../components/MissionsSearcher";
import CreateMissionDialog from "../components/CreateMissionDialog";
import { fetchMissions, fetchMission } from "../actions";
import { MODULE_NAME, RIGHT_MEDICAL_CONTROLLER } from "../constants";

const styles = (theme) => ({
  page: theme.page,
  fab: theme.fab,
});

const MissionsPage = (props) => {
  const { classes, modulesManager } = props;
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
  const dispatch = useDispatch();
  const rights = useSelector((state) => state.core?.user?.i_user?.rights ?? []);
  const missions = useSelector((state) => state.medical_controller?.missions ?? {});

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [redirectToLatest, setRedirectToLatest] = useState(false);
  const history = useHistory();

  if (!rights.includes(RIGHT_MEDICAL_CONTROLLER)) return null;

  const handleMissionCreated = async () => {
    await dispatch(fetchMissions([`orderBy: "-dateCreated"`]));
    setRedirectToLatest(true);
  };

  useEffect(() => {
    if (redirectToLatest && missions.items?.length > 0) {
      const latestMission = missions.items[0];
      setRedirectToLatest(false);
      historyPush(modulesManager, history, "medical_controller.route.mission", [latestMission.missionCode]);
    }
  }, [redirectToLatest, missions.items]);

  const onDoubleClick = (mission, newTab = false) => {
    historyPush(modulesManager, history, "medical_controller.route.mission", [mission.missionCode], newTab);
  };

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage("missions.page.title")} />
      <Typography variant="h5">{formatMessage("missions.page.title")}</Typography>
      <MissionsSearcher
        items={missions.items ?? []}
        pageInfo={missions.pageInfo ?? { totalCount: 0 }}
        fetching={missions.isFetching ?? false}
        fetched={missions.isFetched ?? false}
        error={missions.error}
        onFiltersChange={(filters) => dispatch(fetchMissions(filters))}
        onDoubleClick={onDoubleClick}
        onCreated={handleMissionCreated}
      />
      <div className={classes.fab}>
        <Fab color="primary" onClick={() => setCreateDialogOpen(true)}>
          <AddIcon />
        </Fab>
      </div>
      <CreateMissionDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreated={handleMissionCreated}
      />
    </div>
  );
};

const enhance = combine(withModulesManager, withTheme, withStyles(styles));

export default enhance(MissionsPage);
