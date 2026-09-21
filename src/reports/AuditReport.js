import { Grid } from "@material-ui/core";
import { PublishedComponent, formatMessage } from "@openimis/fe-core";
import React, { useEffect, useState } from "react";
import { injectIntl } from "react-intl";
import { useSelector } from "react-redux";

const AuditReport = (props) => {
    const { intl, values, setValues } = props;
    const userHealthFacility = useSelector((state) => state.loc.userHealthFacilityFullPath);
    const [isLocationInitialized, setIsLocationInitialized] = useState(false);

    useEffect(() => {
        if (!isLocationInitialized && userHealthFacility?.code) {
            setValues({
                ...values,
                region: userHealthFacility?.location?.parent,
                district: userHealthFacility?.location,
                hflocation: userHealthFacility,
            });
            setIsLocationInitialized(true);
        }
    }, [userHealthFacility, isLocationInitialized, values, setValues]);

    const onRegionChange = (region) => {
        setValues({
            ...values,
            region,
            district: null,
            hflocation: null,
        });
    };

    const onDistrictChange = (district) => {
        setValues({
            ...values,
            district,
            region: district?.parent ?? values?.region,
            hflocation: null,
        });
    };

    const onHealtFacilityChange = (hflocation) => {
        setValues({ ...values, hflocation });
    };

    return (
        <Grid container direction="column" spacing={1}>
            <Grid item>
                <PublishedComponent
                    pubRef="location.LocationPicker"
                    locationLevel={0}
                    value={values?.region}
                    required
                    withNull
                    label={formatMessage(intl, "location", "RegionPicker.label")}
                    onChange={onRegionChange}
                />
            </Grid>
            <Grid item>
                <PublishedComponent
                    pubRef="location.LocationPicker"
                    locationLevel={1}
                    value={values?.district}
                    region={values?.region}
                    required
                    withNull
                    onChange={onDistrictChange}
                    label={formatMessage(intl, "location", "DistrictPicker.label")}
                    parentLocation={values?.region}
                />
            </Grid>
            <Grid item>
                <PublishedComponent
                    pubRef="location.HealthFacilityPicker"
                    region={values?.region}
                    district={values?.district}
                    value={values?.hflocation}
                    required
                    onChange={(hflocation) => onHealtFacilityChange(hflocation)}
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