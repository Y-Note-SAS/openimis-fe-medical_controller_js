import React, { useMemo, useState } from "react";
import { Autocomplete, useModulesManager, useTranslations } from "@openimis/fe-core";
import { MODULE_NAME } from "../constants";

const MOCK_MEDICAL_CONTROLLERS = [
  {
    id: "VXNlckdRTFR5cGU6YmM1NTQyNGYtMDcxMi00ODQwLWEyZjMtMGUyOTNiMGI1ZjM4",
    lastName: "bilongo",
    otherNames: "joseph",
    username: "Admin-jo"
  },
  {
    id: "VXNlckdREFTGTGRTQyNGYtMDcxMi00ODQwLWEyZjMtMGUyOTNiMGI1ZjM4",
    lastName: "Dr",
    otherNames: "Baboke",
    username: "Admin-baboke"
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
      `${controller.username} ${controller.lastName} ${controller.otherNames}`.toLowerCase().includes(search)
    );
  }, [searchString]);

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
