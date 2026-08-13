import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import clsx from "clsx";

import { withStyles, withTheme } from "@material-ui/core/styles";

import { Form, ProgressOrError, combine, ErrorBoundary } from "@openimis/fe-core";
import MainPanel from "./MainPanel";
import SamplePanel from "./SamplePanel";
import { fetchMission } from "../../actions";

const styles = (theme) => ({
  page: theme.page,
});

const MissionForm = (props) => {
  const { readOnly, onBack, modulesManager, mission_code, onChange, classes } =
    props;
  const dispatch = useDispatch();

  useEffect(() => {
    if (mission_code) {
      dispatch(fetchMission(modulesManager, mission_code));
    }
  }, [dispatch, modulesManager, mission_code]);

  const mission = useSelector((state) => state.medical_controller?.mission?.item ?? {});
  const isFetching = useSelector((state) => state.medical_controller?.mission?.isFetching ?? false);
  const isFetched = useSelector((state) => state.medical_controller?.mission?.isFetched ?? false);
  const error = useSelector((state) => state.medical_controller?.mission?.error ?? null);

  return (
    <div className={clsx(classes.page, readOnly && classes.locked)}>
      <ErrorBoundary>
        <ProgressOrError progress={isFetching} error={error} />
        {isFetched && (
          <Form
            module="medical_controller"
            title={"missions.details.title"}
            titleParams={{ missionCode: mission.missionCode ?? "" }}
            readOnly={readOnly}
            onEditedChanged={onChange}
            edited={mission}
            edited_id={mission.id}
            HeadPanel={MainPanel}
            Panels={[SamplePanel]}
            back={onBack}
          />)}
      </ErrorBoundary>
    </div>
  );
};

const enhance = combine(withTheme, withStyles(styles));

export default enhance(MissionForm);