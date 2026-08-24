import React from "react";
import { Grid, Divider, Paper, Typography } from "@material-ui/core";
import { withStyles, withTheme } from "@material-ui/core/styles";
import { combine, FormattedMessage, PublishedComponent, SelectInput } from "@openimis/fe-core";
import { MODULE_NAME } from "../../constants";

const styles = (theme) => ({
    paper: {
        ...theme.paper.paper,
        marginTop: theme.spacing(2),
    },
    title: {
        ...theme.table.title,
        display: "flex",
        alignItems: "center",
        minHeight: theme.spacing(5),
    },
    item: theme.paper.item,
    fieldRow: {
        marginTop: theme.spacing(2),
    },
});

const categoryOptions = [
    { value: "1", label: "Catégorie 1" },
    { value: "2", label: "Catégorie 2" },
    { value: "3", label: "Catégorie 3" },
    { value: "4", label: "Catégorie 4" },
];

const FilterMissionPanel = (props) => {
    const { classes, filters = {}, modulesManager, edited, onChangeFilters = () => { } } = props;

    const normalizeHealthFacilities = (raw) => {
        if (Array.isArray(raw)) {
            return raw.map((hf) => hf?.healthFacility ?? hf);
        }

        if (raw && Array.isArray(raw.edges)) {
            return raw.edges.map((e) => e?.node?.healthFacility ?? e?.node ?? e);
        }

        return [];
    };

    const buildHealthFacilityFilter = (value) => {
        const list = Array.isArray(value) ? value : value ? [value] : [];
        const uuids = list.map((hf) => hf?.uuid ?? hf?.id).filter(Boolean);
        const regionValue = list[0]?.location?.parent ?? edited?.region ?? null;
        const districtValue = list[0]?.location ?? edited?.district ?? null;

        return [
            { id: "region", value: regionValue, filter: regionValue ? `healthFacility_Location_Parent_Uuid: "${regionValue.uuid}"` : null },
            { id: "district", value: districtValue, filter: districtValue ? `healthFacility_Location_Uuid: "${districtValue.uuid}"` : null },
            { id: "healthFacility", value: list, filter: uuids.length ? `healthFacility_Id_In: ["${uuids.join('", "')}"]` : null },
        ];
    };

    const defaultMissionHealthFacilities = normalizeHealthFacilities(edited?.healthFacilities ?? []);
    const filterValue = (key) => filters?.[key]?.value ?? null;
    const healthFacilitiesValue = filterValue("healthFacility") ?? defaultMissionHealthFacilities;

    const categoryFilter = (value) => ({
        id: "category",
        value,
        filter: value ? value : null,
    });

    return (
        <Grid container className={classes.item} spacing={2}>
            <Grid item xs={healthFacilitiesValue.length < 6 ? 6 : 12} className={classes.item}>
                <PublishedComponent
                    pubRef="location.HealthFacilityPicker"
                    value={healthFacilitiesValue}
                    district={edited?.district}
                    region={edited?.region}
                    multiple
                    autoComplete
                    withNull
                    onChange={(value) => onChangeFilters(buildHealthFacilityFilter(value))}
                />
            </Grid>

            <Grid item xs={4} md={2} className={classes.item}>
                <SelectInput
                    module={MODULE_NAME}
                    label="MissionFilterPanel.category"
                    value={filterValue("category")}
                    onChange={(value) => onChangeFilters([categoryFilter(value)])}
                    options={categoryOptions}
                />
            </Grid>
        </Grid>
    );
};

const enhance = combine(withTheme, withStyles(styles));

export default enhance(FilterMissionPanel);
