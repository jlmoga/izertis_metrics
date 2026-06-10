# Running the Application with a Local Server

This application stores data in the browser. To work correctly and avoid losing data on page refresh (especially in Chrome/Edge), it is recommended to run it through a local server rather than opening the file directly.

## Instructions

1. Make sure you have **Node.js** installed.
2. Open a terminal in the project folder.
3. Run the following command to install dependencies and start the server:
   ```bash
   npm start
   ```
4. The application will open automatically at `http://localhost:8080`.

If you don't have Node.js, you can also use Python:
```bash
python -m http.server 8080
```
Then open your browser at `http://localhost:8080`.

---

# User Manual

## Settings Window

The settings window opens by clicking the gear icon (⚙) in the top-right bar.

### Interface Language

The **Language** dropdown lets you change the language of all interface texts. Available languages:

| Code | Language   |
|------|------------|
| ca   | Català     |
| es   | Español    |
| en   | English    |

The language is automatically detected from the browser settings the first time the application is opened. If the browser uses an unsupported language, English is set by default. The selection is saved in the browser and restored in subsequent sessions.

> **Note:** The interface language is independent of the **communication language** used in the billing section to generate the text of emails and documents sent to the client.

### Colour Theme

The **Theme** dropdown lets you switch between appearance modes:

| Option | Description                                  |
|--------|----------------------------------------------|
| Light  | White background, dark text (day mode)       |
| Dark   | Dark background, light text (night mode)     |
| System | Follows the operating system preference      |

The selected theme is saved in the browser and restored automatically.

### Loading Data Files

The application works with two independent datasets that are loaded manually:

#### Imputations

Contains hours logged per project and technician. To load them:

1. Navigate to the **Imputations** tab.
2. Click **Select folder** or drag the folder directly to the upload area.
3. Select the folder containing the CSV imputations files exported from the management system.

The application processes all `.csv` files in the folder and merges the data automatically.

#### Absences

Contains staff absence records. The process is equivalent:

1. Navigate to the **Absences** tab.
2. Click **Select folder** or drag the folder to the upload area.
3. Select the folder containing the CSV absence files.

Data is saved in the browser (IndexedDB) and restored automatically when the application is reopened. To clear it and load a new dataset, click the reset button (circular arrow icon) in the settings window.

---

# config.json — Documentation

Configuration file for clients and projects used in the billing workflow.

## Structure

```jsonc
{
    "customers": [
        {
            "customer_id": "",           // Client identifier from the imputations system (must match exactly)
            "customer_name": "",         // Official client name (used for display purposes only)
            "customer_validation_intro": "",        // Generic opening text for communications with this client
            "customer_validation_observations": "", // Generic closing text for communications with this client
            "list_mails_validation": "",            // Comma-separated list of addresses to receive billing validation emails
            "projects": [
                {
                    "project_id": "",                // Project identifier from the imputations system (must match exactly)
                    "project_description": "",        // Full project description
                    "cost_calculation": "hours|days|fixed", // Cost calculation unit: "hours", "days" or "fixed"
                    "cost_fixed": 0,                  // Fixed billing amount (only relevant when cost_calculation = "fixed")
                    "hours_per_day": 8,               // Hours per working day (only relevant when cost_calculation = "days")
                    "project_navision_code": "",      // Navision project code
                    "is_time_materials": true,        // Whether the project is on a time & materials basis
                    "ok_required": true,              // Whether the client requires prior approval before invoicing
                    "list_mails_OMO": "",             // Comma-separated list of recipients for billing order emails
                    "validation_intro": "",           // Opening text for the billing validation email
                    "validation_observations": "",    // Closing text for the billing validation email
                    "OMO_intro": "",                  // Opening text for the billing order
                    "OMO_observations": ""            // Closing text for the billing order
                }
            ]
        }
    ]
}
```

## Notes

- `cost_calculation`: accepts `"hours"` (calculated by hours), `"days"` (calculated by working days) or `"fixed"` (fixed amount regardless of the hours breakdown).
- `cost_fixed`: fixed billing amount for the project; used only when `cost_calculation = "fixed"`. The technicians' hours breakdown is shown for reference but does not affect the billed amount.
- `list_mails_validation`: defined at client level (not project level); multiple addresses separated by commas, e.g. `"joan@izertis.com,maria@izertis.com"`.
- `list_mails_OMO`: multiple addresses separated by commas, e.g. `"joan@izertis.com,maria@izertis.com"`.
- `customer_validation_intro` and `customer_validation_observations`: client-level texts, shared across all projects for that client. They complement the per-project `validation_intro` and `validation_observations` fields.
- The file `config_template.json` contains the clean template for adding new records.
