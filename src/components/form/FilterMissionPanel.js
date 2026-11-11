import React, { useMemo, useState } from "react";
import { Grid, Typography } from "@material-ui/core";
import { withStyles, withTheme } from "@material-ui/core/styles";
import { useIntl } from "react-intl";
import {
    combine,
    PublishedComponent,
    SelectInput,
    useTranslations,
    withModulesManager,
} from "@openimis/fe-core";
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
    error: {
        color: theme.palette.error.main,
        fontSize: "0.75rem",
        marginTop: theme.spacing(0.5),
    },
});

const MAX_MONTHS = 36;

const FilterMissionPanel = (props) => {
    const { classes, filters = {}, modulesManager, edited, onChangeFilters = () => { } } = props;
    const intl = useIntl();
    const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
    const [rangeError, setRangeError] = useState(null);

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

    const categoryFilter = (value) => value !== null ? {
        id: "category",
        value,
        filter: `${value}`,
    } : { id: "category", value };

    // Mois contenus dans la mission (bornes incluses)
    const missionMonths = useMemo(() => {
        if (!edited?.startDate || !edited?.endDate) {
            return [];
        }
        const start = new Date(edited.startDate);
        const end = new Date(edited.endDate);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            return [];
        }
        const months = [];
        let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
        const last = new Date(end.getFullYear(), end.getMonth(), 1);
        while (cursor <= last && months.length < MAX_MONTHS) {
            months.push({
                value: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`,
                label: intl.formatDate(cursor, { month: "long", year: "numeric" }),
            });
            cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
        }
        return months;
    }, [edited?.startDate, edited?.endDate, intl]);

    const dateFilter = (id, value) => ({
        id,
        value: value || null,
        filter: value ? `claim_DateTo_${id === "dateFrom" ? "Gte" : "Lte"}: "${value}"` : null,
    });

    const onChangeDate = (id, value) => {
        const from = id === "dateFrom" ? value : filterValue("dateFrom");
        const to = id === "dateTo" ? value : filterValue("dateTo");
        if (from && to && from > to) {
            setRangeError(formatMessage("MissionFilterPanel.dateRangeError"));
            return;
        }
        setRangeError(null);
        // le mois est un raccourci : une saisie manuelle le remet a zero
        onChangeFilters([
            dateFilter("dateFrom", from),
            dateFilter("dateTo", to),
            { id: "month", value: null, filter: null },
        ]);
    };

    const onChangeMonth = (value) => {
        if (!value) {
            setRangeError(null);
            onChangeFilters([
                { id: "month", value: null, filter: null },
                dateFilter("dateFrom", null),
                dateFilter("dateTo", null),
            ]);
            return;
        }
        const [year, month] = String(value).split("-").map(Number);
        const lastDay = new Date(year, month, 0).getDate();
        setRangeError(null);
        onChangeFilters([
            { id: "month", value, filter: null },
            dateFilter("dateFrom", `${value}-01`),
            dateFilter("dateTo", `${value}-${String(lastDay).padStart(2, "0")}`),
        ]);
    };

    const monthOptions = [
        { value: "", label: formatMessage("MissionFilterPanel.allMonths") },
        ...missionMonths,
    ];

    return (
        <Grid container className={classes.item} spacing={2}>
            <Grid item xs={healthFacilitiesValue.length < 6 ? 6 : 12} className={classes.item}>
                <PublishedComponent
                    pubRef="location.HealthFacilityPicker"
                    value={healthFacilitiesValue}
                    options={defaultMissionHealthFacilities}
                    multiple
                    autoComplete
                    withNull
                    onChange={(value) => onChangeFilters(buildHealthFacilityFilter(value))}
                />
            </Grid>

            <Grid item xs={4} md={2} className={classes.item}>
                <PublishedComponent
                    pubRef="medical_controller.MissionCategoryPicker"
                    withLabel
                    label="MissionFilterPanel.category"
                    value={filterValue("category")}
                    onChange={(value) => onChangeFilters([categoryFilter(value)].filter(Boolean))}
                />
            </Grid>

            <Grid item xs={6} md={3} className={classes.item}>
                <PublishedComponent
                    pubRef="core.DatePicker"
                    module={MODULE_NAME}
                    label="MissionFilterPanel.periodFrom"
                    value={filterValue("dateFrom")}
                    onChange={(value) => onChangeDate("dateFrom", value)}
                />
            </Grid>

            <Grid item xs={6} md={3} className={classes.item}>
                <PublishedComponent
                    pubRef="core.DatePicker"
                    module={MODULE_NAME}
                    label="MissionFilterPanel.periodTo"
                    value={filterValue("dateTo")}
                    onChange={(value) => onChangeDate("dateTo", value)}
                />
            </Grid>

            <Grid item xs={6} md={2} className={classes.item}>
                <SelectInput
                    module={MODULE_NAME}
                    name="missionMonth"
                    label="MissionFilterPanel.month"
                    options={monthOptions}
                    value={filterValue("month") ?? ""}
                    onChange={onChangeMonth}
                />
            </Grid>

            {rangeError && (
                <Grid item xs={12}>
                    <Typography className={classes.error}>{rangeError}</Typography>
                </Grid>
            )}
        </Grid>
    );
};

const enhance = combine(withTheme, withStyles(styles));

export default enhance(FilterMissionPanel);
