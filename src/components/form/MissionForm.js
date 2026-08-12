import React from "react";
import clsx from "clsx";

import { withStyles, withTheme } from "@material-ui/core/styles";

import { Form, ProgressOrError, combine, ErrorBoundary } from "@openimis/fe-core";
import MainPanel from "./MainPanel";

const styles = (theme) => ({
  page: theme.page,
  locked: theme.page.locked,
});

const MissionForm = (props) => {
  const { readOnly, onBack, onSave, mission, canSave, onReset, onChange, error, classes } =
    props;

  return (
    <div className={clsx(classes.page, readOnly && classes.locked)}>
      <ErrorBoundary>
        <ProgressOrError error={error} />
        <Form
          module="medical_controller"
          title={mission?.uuid ? "missions.details.title" : "missions.details.emptyTitle"}
          titleParams={{ label: mission.code ?? "" }}
          readOnly={readOnly}
          onEditedChanged={onChange}
          edited={mission}
          edited_id={mission.uuid}
          HeadPanel={MainPanel}
          Panels={[]}
          back={onBack}
        />
      </ErrorBoundary>
    </div>
  );
};

const enhance = combine(withTheme, withStyles(styles));

export default enhance(MissionForm);