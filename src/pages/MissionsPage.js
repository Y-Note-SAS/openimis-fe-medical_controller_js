import React from "react";
import { injectIntl } from "react-intl";
import { Typography } from "@material-ui/core";
import { withStyles, withTheme } from "@material-ui/core/styles";
import { combine, formatMessage, Helmet, withModulesManager } from "@openimis/fe-core";

const styles = (theme) => ({
  page: theme.page,
});

const MissionsPage = (props) => {
  const { classes, intl } = props;

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage(intl, "medical_controller", "missions.page.title")} />
      <Typography variant="h5">
        {formatMessage(intl, "medical_controller", "missions.page.title")}
      </Typography>
    </div>
  );
};

const enhance = combine(withModulesManager, injectIntl, withTheme, withStyles(styles));

export default enhance(MissionsPage);
