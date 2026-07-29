import React, { useMemo, useState } from "react";
import { Autocomplete, useModulesManager, useTranslations } from "@openimis/fe-core";
import { MODULE_NAME } from "../constants";

const MOCK_MEDICAL_CONTROLLERS = [
  {
    id: "medical-controller-1",
    uuid: "medical-controller-1",
    code: "CM001",
    lastName: "NTSOULOUNG",
    otherNames: "NTSOUI Armel",
  },
  {
    id: "medical-controller-2",
    uuid: "medical-controller-2",
    code: "CM002",
    lastName: "NDONNANG",
    otherNames: "NDONL Romeo",
  },
];

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

  const options = useMemo(() => {
    const search = String(searchString ?? "").toLowerCase();
    if (!search) return MOCK_MEDICAL_CONTROLLERS;

    return MOCK_MEDICAL_CONTROLLERS.filter((controller) =>
      `${controller.code} ${controller.lastName} ${controller.otherNames}`.toLowerCase().includes(search)
    );
  }, [searchString]);

  const formatMedicalController = (controller) =>
    controller ? `${controller.code} ${controller.lastName} ${controller.otherNames}` : "";

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
      isLoading={false}
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
