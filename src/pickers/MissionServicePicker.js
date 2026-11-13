import React, { useMemo, useState } from "react";
import { Autocomplete, useGraphqlQuery, useModulesManager, useTranslations } from "@openimis/fe-core";
import { MODULE_NAME } from "../constants";

// Services de type forfaitaire (packagetype = P) : CPN1, CPN2, ... (categorie 1)
const MissionServicePicker = (props) => {
    const {
        label,
        multiple,
        onChange,
        placeholder,
        readOnly,
        required,
        value,
        withLabel = true,
        withPlaceholder,
    } = props;
    const modulesManager = useModulesManager();
    const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
    const [searchString, setSearchString] = useState("");

    const { isLoading, data, error } = useGraphqlQuery(
        `query MissionServicePicker {
            medicalServices(packagetype: P, first: 100) {
                edges {
                    node {
                        id
                        code
                        name
                    }
                }
            }
        }`,
        {},
    );

    const options = useMemo(() => {
        const nodes = data?.medicalServices?.edges?.map((edge) => edge.node) ?? [];
        const search = String(searchString ?? "").toLowerCase();
        if (!search) {
            return nodes;
        }
        return nodes.filter((node) =>
            `${node.code} ${node.name}`.toLowerCase().includes(search)
        );
    }, [data, searchString]);

    const formatService = (service) =>
        service && service.code ? `${service.code} — ${service.name}` : "";

    return (
        <Autocomplete
            multiple={multiple}
            required={required}
            placeholder={placeholder ?? formatMessage("MissionServicePicker.placeholder")}
            label={label ?? formatMessage("MissionServicePicker.label")}
            withLabel={withLabel}
            withPlaceholder={withPlaceholder}
            readOnly={readOnly}
            options={options}
            isLoading={isLoading}
            error={error}
            value={value}
            getOptionLabel={formatService}
            onChange={(option) => onChange?.(option)}
            filterSelectedOptions
            onInputChange={(input) => setSearchString(input ?? "")}
        />
    );
};

export default MissionServicePicker;
