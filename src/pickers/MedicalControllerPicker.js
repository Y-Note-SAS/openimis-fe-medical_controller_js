import React, { useMemo, useState } from "react";
import { Autocomplete, useModulesManager, useTranslations, useGraphqlQuery } from "@openimis/fe-core";
import { MODULE_NAME } from "../constants";
const MedicalControllerPicker = (props) => {
  const {
    filterOptions,
    filterSelectedOptions,
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
    `query MedicalControllerPicker($searchString: String, $first: Int) {
      medicalControllers(username_Icontains: $searchString, first: $first) {
        edges {
          node {
            id
            username
            iUser { id otherNames lastName }
          }
        }
      }
    }`,
    { searchString, first: 20 },
  );

  const options = useMemo(() => {
    const nodes = data?.medicalControllers?.edges?.map((e) => e.node) ?? [];
    return nodes.map((n) => ({ id: n.id, username: n.username, lastName: n.iUser?.lastName, otherNames: n.iUser?.otherNames }));
  }, [data]);

  const formatMedicalController = (controller) =>
    controller ? `${controller.username} ${controller.lastName} ${controller.otherNames}` : "";

  return (
    <Autocomplete
      multiple={multiple}
      required={required}
      placeholder={placeholder ?? formatMessage("MedicalControllerPicker.placeholder")}
      label={label ?? formatMessage("MedicalControllerPicker.label")}
      withLabel={withLabel}
      withPlaceholder={withPlaceholder}
      readOnly={readOnly}
      options={options}
      isLoading={isLoading}
      error={error}
      value={value}
      getOptionLabel={formatMedicalController}
      onChange={(option) => onChange?.(option, option ? formatMedicalController(option) : null)}
      filterOptions={filterOptions}
      filterSelectedOptions={filterSelectedOptions}
      onInputChange={(input) => setSearchString(input ?? "")}
    />
  );
};

export default MedicalControllerPicker;
