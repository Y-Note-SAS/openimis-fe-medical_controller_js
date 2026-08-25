import React, { useState, useEffect, Fragment } from "react";
import { useSelector, useDispatch } from "react-redux";
import clsx from "clsx";

import { withStyles, withTheme } from "@material-ui/core/styles";

import {
  Form,
  ProgressOrError,
  combine,
  ErrorBoundary,
  useTranslations,
  coreConfirm,
  baseApiUrl
} from "@openimis/fe-core";
import { Button, Typography, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@material-ui/core";
import GetAppIcon from "@material-ui/icons/GetApp";
import StopIcon from "@material-ui/icons/Stop";
import MainPanel from "./MainPanel";
import SamplePanel from "./SamplePanel";
import { fetchMission, updateMission } from "../../actions";
import { MISSION_STATUS_CLOSED, MODULE_NAME } from "../../constants";

const styles = (theme) => ({
  page: theme.page,
});

const MissionForm = (props) => {
  const { intl, readOnly, onBack, modulesManager, mission_code, onChange, classes } =
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
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const { formatMessage, formatMessageWithValues } = useTranslations(MODULE_NAME, modulesManager);
  const actions = [];

  useEffect(() => {
    if (isFetched && fetchedMission) {
      setMission((prev) => {
        // if (prev?.id === fetchedMission?.id && prev?.missionCode === fetchedMission?.missionCode) {
        //   return prev;
        // }
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

  const handleOpenCloseDialog = () => setShowCloseDialog(true);
  const handleCloseCloseDialog = () => setShowCloseDialog(false);
  const handleConfirmClose = () => {
    dispatch(
      updateMission(
        { ...mission, status: "C" },
        formatMessageWithValues("closeMission.mutationLabel", { code: mission.missionCode, })
      )).then(() => {
        if (mission.missionCode) {
          dispatch(fetchMission(modulesManager, mission.missionCode));
        }
      });
    setShowCloseDialog(false);
  };

  if (!!mission && mission?.status != MISSION_STATUS_CLOSED) {
    actions.push(
      {
        button: (
          <Button
            variant="contained"
            color="primary"
            style={{ display: showSampleActions ? "inline-flex" : "none" }}
            startIcon={<GetAppIcon />}
            onClick={() => window.open(`${window.location.origin}${baseApiUrl}/medical_controller/registers/download_mission/${mission.missionCode}/`, '_blank')}
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
            onClick={handleOpenCloseDialog}
          >
            {formatMessage("missionForm.close")}
          </Button>
        ),
      })
  }

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
            <Dialog
              open={showCloseDialog}
              onClose={handleCloseCloseDialog}
              aria-labelledby="confirm-close-title"
            >
              <DialogTitle id="confirm-close-title">{formatMessage("medical_controller.missionForm.confirmClose.title")}</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  {formatMessage("medical_controller.missionForm.confirmClose.message")}
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseCloseDialog} color="primary">
                  {formatMessage("cancel")}
                </Button>
                <Button onClick={handleConfirmClose} color="primary" autoFocus>
                  {formatMessage("ok")}
                </Button>
              </DialogActions>
            </Dialog>
          </Fragment>
        )}
      </ErrorBoundary>
    </div>
  );
};

const enhance = combine(withTheme, withStyles(styles));

export default enhance(MissionForm);