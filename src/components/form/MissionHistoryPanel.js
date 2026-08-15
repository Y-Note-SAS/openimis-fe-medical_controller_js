import React, { Fragment } from "react";
import { Grid, Paper, Typography, Divider } from "@material-ui/core";
import { FormattedMessage, Searcher, useTranslations } from "@openimis/fe-core";
import { MODULE_NAME } from "../../constants";

const MissionHistoryPanel = ({ classes, modulesManager, historyActions = [] }) => {
    const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
    const headers = [
        "MissionHistory.date",
        "MissionHistory.time",
        "MissionHistory.controller",
        "MissionHistory.action",
    ];

    const itemFormatters = [
        (h) => h.date,
        (h) => h.time,
        (h) => h.controller,
        (h) => h.action,
    ];

    return (
        <Fragment>
            <Searcher
                module={MODULE_NAME}
                headers={() => headers}
                itemFormatters={() => itemFormatters}
                items={historyActions}
                itemsPageInfo={{ totalCount: historyActions.length }}
                fetchingItems={false}
                fetchedItems={true}
                fetch={() => { }}
                tableTitle={formatMessage("MissionHistory.title")}
                rowIdentifier={(h, idx) => `${h.date}-${h.time}-${idx}`}
                canFetch={false}
            />
        </Fragment>
    );
};

export default MissionHistoryPanel;
