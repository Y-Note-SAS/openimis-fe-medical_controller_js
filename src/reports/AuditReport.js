import { Grid } from "@material-ui/core";
import { PublishedComponent } from "@openimis/fe-core";
import React, { useEffect } from "react";
import { injectIntl } from "react-intl";
import { useSelector } from "react-redux";

const AuditReport = (props) => {
  const { values, setValues, user } = props;
  const userHealthFacility = useSelector((state) => state.loc.userHealthFacilityFullPath);
  const readOnly = !!userHealthFacility && userHealthFacility?.code;

  useEffect(() => {
    if (userHealthFacility?.code) {
      setValues({
        ...values,
        hflocation: userHealthFacility,
        district: userHealthFacility?.location
      })
    }
  }, values);

  const onHealtFacilityChange = (hflocation) => {
    setValues({ ...values, hflocation })
  }
  return (
    <Grid container direction="column" spacing={1}>
      <Grid item>
        <PublishedComponent
          pubRef="location.HealthFacilityPicker"
          district={values.district}
          onChange={(hflocation) =>
            onHealtFacilityChange(hflocation)
          }
          value={values.hflocation}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item>
        <PublishedComponent
          pubRef="core.DatePicker"
          value={values.dateFrom}
          module="medical_controller"
          required
          label="auditReport.dateFrom"
          onChange={(dateFrom) => setValues({ ...values, dateFrom })}
        />
      </Grid>
      <Grid item>
        <PublishedComponent
          pubRef="core.DatePicker"
          value={values.dateTo}
          module="medical_controller"
          required
          label="auditReport.dateTo"
          onChange={(dateTo) => setValues({ ...values, dateTo })}
        />
      </Grid>
    </Grid>
  );
};


export default injectIntl(AuditReport);