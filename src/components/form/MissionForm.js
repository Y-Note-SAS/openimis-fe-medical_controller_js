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

  // Réinitialiser la mission quand le mission_code change
  useEffect(() => {
    setMission({});
  }, [mission_code]);

  useEffect(() => {
    if (isFetched && fetchedMission && fetchedMission.missionCode === mission_code) {
      setMission(fetchedMission);
    }
  }, [isFetched, fetchedMission, mission_code]);

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
      )
    ).then((response) => {
      // Si la mutation a échoué, on ne ferme pas le dialogue et on ne refetch pas
      if (response?.error) {
        // coreAlert est déjà dispatché par graphql, le dialogue reste ouvert
        return;
      }
      // Succès : fermer le dialogue et rafraîchir la mission
      setShowCloseDialog(false);
      if (mission.missionCode) {
        dispatch(fetchMission(modulesManager, mission.missionCode));
      }
    });
  };

  actions.push(
    {
      button: (
        <Button
          variant="contained"
          color="primary"
          style={{ display: showSampleActions && !!mission?.missionCode ? "inline-flex" : "none" }}
          startIcon={<GetAppIcon />}
          onClick={() => {
            if (!mission?.missionCode) return;
            window.open(`${window.location.origin}${baseApiUrl}/medical_controller/registers/download_mission/${mission.missionCode}/`, '_blank');
          }}
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
          style={{ display: showSampleActions && !!mission?.missionCode && mission?.status != MISSION_STATUS_CLOSED ? "inline-flex" : "none" }}
          onClick={handleOpenCloseDialog}
        >
          {formatMessage("missionForm.close")}
        </Button>
      ),
    })

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