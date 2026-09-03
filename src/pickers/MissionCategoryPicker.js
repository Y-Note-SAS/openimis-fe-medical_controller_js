import React, { Component } from "react";
import { ConstantBasedPicker } from "@openimis/fe-core";
import { MISSION_CATEGORIES } from "../constants";

class MissionCategoryPicker extends Component {
  render() {
    return <ConstantBasedPicker module="medical_controller" label="missionSample.category" constants={MISSION_CATEGORIES} {...this.props} />;
  }
}

export default MissionCategoryPicker;