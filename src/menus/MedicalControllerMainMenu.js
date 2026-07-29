import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { AssignmentTurnedIn, ListAlt } from "@material-ui/icons";
import { formatMessage, MainMenuContribution } from "@openimis/fe-core";
import { RIGHT_MEDICAL_CONTROLLER } from "../constants";

class MedicalControllerMainMenu extends Component {
  render() {
    const { rights } = this.props;
    const entries = [];

    if (rights.includes(RIGHT_MEDICAL_CONTROLLER)) {
      entries.push({
        text: formatMessage(this.props.intl, "medical_controller", "menu.missions"),
        icon: <ListAlt />,
        route: "/medical-controller/missions",
      });
    }

    if (!entries.length) return null;

    return (
      <MainMenuContribution
        {...this.props}
        header={formatMessage(this.props.intl, "medical_controller", "mainMenu")}
        icon={<AssignmentTurnedIn />}
        entries={entries}
      />
    );
  }
}

const mapStateToProps = (state) => ({
  rights: state.core?.user?.i_user?.rights ?? [],
});

export default injectIntl(connect(mapStateToProps)(MedicalControllerMainMenu));
