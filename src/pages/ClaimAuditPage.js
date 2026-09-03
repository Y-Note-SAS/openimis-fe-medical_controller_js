import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { formatMessageWithValues, historyPush, withHistory, withModulesManager } from "@openimis/fe-core";
import { ClaimForm, RIGHT_LOAD, updateClaim } from "@openimis/fe-claim";
import { fetchMission } from "../actions";
import { RIGHT_MEDICAL_CONTROLLER } from "../constants";

const styles = (theme) => ({
  page: theme.page,
});

class ClaimAuditPage extends Component {
  componentDidMount() {
    this.fetchMissionIfNeeded();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.mission_code !== this.props.mission_code) {
      this.fetchMissionIfNeeded();
    }
  }

  fetchMissionIfNeeded = () => {
    const { fetchMission: loadMission, mission, mission_code, modulesManager } = this.props;
    if (!mission && mission_code) {
      loadMission(modulesManager, mission_code);
    }
  };

  save = (claim) => this.props.updateClaim(
    this.props.modulesManager,
    claim,
    formatMessageWithValues(this.props.intl, "claim", "AuditClaim.mutationLabel", { code: claim.code }),
  );

  render() {
    const { classes, modulesManager, history, rights, claim_uuid, mission, mission_code } = this.props;
    if (!rights.includes(RIGHT_LOAD, RIGHT_MEDICAL_CONTROLLER)) return null;

    return (
      <div className={classes.page}>
        <ClaimForm
          claim_uuid={claim_uuid}
          back={() => historyPush(modulesManager, history, "medical_controller.route.mission", [mission_code])}
          save={this.save}
          isHealthFacilityPage={false}
          mission={mission}
          forAudit={true}
        />
      </div>
    );
  }
}

const mapStateToProps = (state, props) => ({
  rights: state.core?.user?.i_user?.rights ?? [],
  claim_uuid: props.match.params.claim_uuid,
  mission_code: props.match.params.mission_code,
  mission_status: props.match.params.mission_status,
  mission: props.location?.state?.mission
    ?? (state.medical_controller?.mission?.item?.missionCode === props.match.params.mission_code
      ? state.medical_controller.mission.item
      : null),
});

const mapDispatchToProps = (dispatch) => bindActionCreators({ fetchMission, updateClaim }, dispatch);

export default withHistory(
  withModulesManager(connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(ClaimAuditPage))))),
);
