const CompanySettingModal = require("../../models/v1/company_settings_modal");

class CompanySettingsService {
  async create(companySettingData) {
    try {
      let settingsData = {
        company_name: companySettingData.companyName,
        branch_name: companySettingData.branchName,
        sub_branch: companySettingData.subBranch,
        account_module: companySettingData.accountModule,
        default_branch: companySettingData.defaultBranch,
        default_sub_branch: companySettingData.defaultSubBranch,
      };
      const companySetting = await CompanySettingModal.create(settingsData);
      return companySetting;
    } catch (error) {
      throw error;
    }
  }

  async findAllCompanySettings() {
    try {
      const companySettings = await CompanySettingModal.findAll();
      return companySettings;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = CompanySettingsService;
