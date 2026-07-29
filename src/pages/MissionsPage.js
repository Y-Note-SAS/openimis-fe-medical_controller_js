import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Add as AddIcon } from "@material-ui/icons";
import { Fab, Typography } from "@material-ui/core";
import { withStyles, withTheme } from "@material-ui/core/styles";
import { combine, Helmet, useTranslations, withModulesManager } from "@openimis/fe-core";
import MissionsSearcher from "../components/MissionsSearcher";
import { fetchMedicalControllerMissions } from "../actions";
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

  if (!rights.includes(RIGHT_MEDICAL_CONTROLLER)) return null;

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
        onFiltersChange={(filters) => dispatch(fetchMedicalControllerMissions(modulesManager, filters))}
      />
      <div className={classes.fab}>
        <Fab color="primary">
          <AddIcon />
        </Fab>
      </div>
    </div>
  );
};

const enhance = combine(withModulesManager, withTheme, withStyles(styles));

export default enhance(MissionsPage);
