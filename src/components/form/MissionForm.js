import React, { useState, useEffect, Fragment } from "react";
import { useSelector, useDispatch } from "react-redux";
import clsx from "clsx";

import { withStyles, withTheme } from "@material-ui/core/styles";

import {
  Form,
  ProgressOrError,
  combine,
  ErrorBoundary,
  useTranslations
} from "@openimis/fe-core";
import { Button, Typography } from "@material-ui/core";
import GetAppIcon from "@material-ui/icons/GetApp";
import StopIcon from "@material-ui/icons/Stop";
import MainPanel from "./MainPanel";
import SamplePanel from "./SamplePanel";
import { fetchMission } from "../../actions";
import { MODULE_NAME } from "../../constants";

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

  const fetchedMission = useSelector((state) => state.medical_controller?.mission?.item ?? {});
  const isFetching = useSelector((state) => state.medical_controller?.mission?.isFetching ?? false);
  const isFetched = useSelector((state) => state.medical_controller?.mission?.isFetched ?? false);
  const error = useSelector((state) => state.medical_controller?.mission?.error ?? null);
  const [mission, setMission] = useState({});
  const [showSampleActions, setShowSampleActions] = useState(false);
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
  const actions = [];

  useEffect(() => {
    if (isFetched && fetchedMission) {
      setMission((prev) => {
        if (prev?.id === fetchedMission?.id && prev?.missionCode === fetchedMission?.missionCode) {
          return prev;
        }
        return fetchedMission;
      });
    }
  }, [isFetched, fetchedMission]);

  const handleEditedChanged = (newMission) => {
    setMission(newMission);
    if (onChange) {
      onChange(newMission);
    }
  };

  const handleShowSampleActions = () => {
    setShowSampleActions(true);
  }

  actions.push(
    {
      button: (
        <Button
          variant="contained"
          color="primary"
          style={{ display: showSampleActions ? "inline-flex" : "none" }}
          startIcon={<GetAppIcon />}
          onClick={() => (props.onDownloadMission ? props.onDownloadMission(mission) : console.log("Download mission", mission))}
        >
          {formatMessage("missionForm.download")}
        </Button>
      ),
    },
    {
      button: (
        <Button
          variant="contained"
          color="primary"
          startIcon={<StopIcon />}
          style={{ display: showSampleActions ? "inline-flex" : "none" }}
          onClick={() => {
            if (props.onCloseMission) props.onCloseMission(mission);
          }}
        >
          {formatMessage("missionForm.close")}
        </Button>
      ),
    },
  );

  return (
    <div className={clsx(classes.page, readOnly && classes.locked)}>
      <ErrorBoundary>
        <ProgressOrError progress={isFetching} error={error} />
        {isFetched && (
          <Fragment>
            <Form
              module="medical_controller"
              title={"missions.details.title"}
              titleParams={{ missionCode: mission.missionCode ?? fetchedMission.missionCode ?? "" }}
              readOnly={readOnly}
              onEditedChanged={handleEditedChanged}
              edited={mission}
              edited_id={mission.id ?? fetchedMission.id}
              HeadPanel={MainPanel}
              Panels={[SamplePanel]}
              back={onBack}
              actions={actions}
              modulesManager={modulesManager}
              handleShowSampleActions={handleShowSampleActions}
            />
          </Fragment>
        )}
      </ErrorBoundary>
    </div>
  );
};

const enhance = combine(withTheme, withStyles(styles));

export default enhance(MissionForm);