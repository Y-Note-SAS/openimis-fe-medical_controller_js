import React, { Fragment } from "react";
import { Grid, Button, Typography, Divider, Paper } from "@material-ui/core";
import { withStyles, withTheme } from "@material-ui/core/styles";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import { combine, FormattedMessage, SelectInput } from "@openimis/fe-core";
import { MODULE_NAME } from "../../constants";

const styles = (theme) => ({
    tableTitle: {
        ...theme.table.title,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    item: theme.paper.item,
    fullHeight: {
        height: "100%",
    },
    paper: theme.paper.paper,
    actionButton: {
        marginLeft: "auto",
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        "&:hover": {
            backgroundColor: theme.palette.primary.dark,
        },
    },
});

const percentageOptions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
const defaultSample = {
    category1: 10,
    category2: 30,
    category3: 100,
    category4: 100,
};

const SamplePanel = (props) => {
    const { classes, edited, onEditedChanged, readOnly, actions } = props;
    const sample = {
        ...defaultSample,
        ...(edited?.sample ?? {}),
    };

    const handleChange = (key, value) => {
        onEditedChanged({
            ...edited,
            sample: {
                ...sample,
                [key]: value,
            },
        });
    };

    const categories = ["Categorie 1", "Categorie 2", "Categorie 3", "Categorie 4"];

    return (
        <Fragment>
            <Paper className={classes.paper}>
                <Grid container className={classes.tableTitle}>
                    <Grid item className={classes.item}>
                        <Typography>
                            <FormattedMessage module={MODULE_NAME} id="MissionSamplePanel.title" />
                        </Typography>
                    </Grid>
                    <Button
                        variant="contained"
                        color="primary"
                        className={classes.actionButton}
                        startIcon={<PlayArrowIcon />}
                    >
                        Obtenir un échantillon
                    </Button>
                </Grid>
                <Divider />
                <Grid container className={classes.item}>
                    <Grid container direction="row" spacing={2}>
                        {categories.map((label, index) => {
                            const key = `category${index + 1}`;
                            return (
                                <Grid item xs={2} className={classes.item}>
                                    <SelectInput
                                        module={MODULE_NAME}
                                        label={`MissionSamplePanel.${key}`}
                                        options={percentageOptions.map((value) => ({ value, label: `${value}%` }))}
                                        value={sample[key] ?? defaultSample[key]}
                                        onChange={(value) => handleChange(key, value)}
                                    />
                                </Grid>
                            );
                        })}
                    </Grid>
                </Grid>
            </Paper>
        </Fragment>
    );
};

const enhance = combine(withTheme, withStyles(styles));

export default enhance(SamplePanel);
