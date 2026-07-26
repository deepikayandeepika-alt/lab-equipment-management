// ========================================
// LAB EQUIPMENT MANAGEMENT SYSTEM
// ========================================

// Store all equipment records
let equipmentData = [];

// Get HTML elements
const totalRecords = document.getElementById("totalRecords");
const issuedRecords = document.getElementById("issuedRecords");
const serviceDueRecords = document.getElementById("serviceDueRecords");
const damagedRecords = document.getElementById("damagedRecords");

const searchInput = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect");

const recordCount = document.getElementById("recordCount");

const loadingMessage = document.getElementById("loadingMessage");
const errorMessage = document.getElementById("errorMessage");
const emptyMessage = document.getElementById("emptyMessage");

const tableContainer = document.getElementById("tableContainer");
const equipmentTableBody = document.getElementById("equipmentTableBody");

const detailSection = document.getElementById("detailSection");
const detailContent = document.getElementById("detailContent");
const backButton = document.getElementById("backButton");


// ========================================
// LOAD DATA FROM JSON FILE
// ========================================

async function loadEquipmentData() {

    try {

        // Show loading message
        loadingMessage.classList.remove("hidden");
        errorMessage.classList.add("hidden");
        tableContainer.classList.add("hidden");

        const response = await fetch("data/equipment.json");

        // Check if file loaded correctly
        if (!response.ok) {
            throw new Error("Unable to load equipment data");
        }

        // Convert response to JSON
        equipmentData = await response.json();

        // Hide loading message
        loadingMessage.classList.add("hidden");

        // Update summary
        updateSummary();

        // Display records
        displayRecords();

    } catch (error) {

        console.error("Error loading data:", error);

        // Hide loading
        loadingMessage.classList.add("hidden");

        // Show error message
        errorMessage.classList.remove("hidden");

    }
}


// ========================================
// UPDATE DASHBOARD SUMMARY
// ========================================

function updateSummary() {

    // Total records
    totalRecords.textContent = equipmentData.length;

    // Currently issued
    const issued = equipmentData.filter(record => {
        return record.return_date === "";
    });

    issuedRecords.textContent = issued.length;

    // Service due
    const today = new Date();

    const serviceDue = equipmentData.filter(record => {

        // Ignore records without service date
        if (!record.next_service_date) {
            return false;
        }

        const serviceDate = new Date(record.next_service_date);

        return serviceDate < today;
    });

    serviceDueRecords.textContent = serviceDue.length;


    // Damaged
    const damaged = equipmentData.filter(record => {

        return record.condition === "Damaged" ||
               record.condition === "Needs Repair";

    });

    damagedRecords.textContent = damaged.length;

}


// ========================================
// DISPLAY RECORDS
// ========================================

function displayRecords() {

    // Get search value
    const searchText = searchInput.value.toLowerCase().trim();

    // Get selected filter
    const selectedFilter = filterSelect.value;


    // Filter records
    const filteredRecords = equipmentData.filter(record => {

        // Search across important fields
        const matchesSearch =

            (record.equipment_name || "")
                .toLowerCase()
                .includes(searchText)

            ||

            (record.equipment_id || "")
                .toLowerCase()
                .includes(searchText)

            ||

            (record.issued_to || "")
                .toLowerCase()
                .includes(searchText);


        // Filter logic
        let matchesFilter = true;


        // Currently issued
        if (selectedFilter === "issued") {

            matchesFilter = record.return_date === "";

        }


        // Returned
        else if (selectedFilter === "returned") {

            matchesFilter = record.return_date !== "";

        }


        // Damaged
        else if (selectedFilter === "damaged") {

            matchesFilter =
                record.condition === "Damaged" ||
                record.condition === "Needs Repair";

        }


        // Service due
        else if (selectedFilter === "serviceDue") {

            if (!record.next_service_date) {

                matchesFilter = false;

            } else {

                const serviceDate =
                    new Date(record.next_service_date);

                const today = new Date();

                matchesFilter = serviceDate < today;

            }

        }


        return matchesSearch && matchesFilter;

    });


    // Update record count
    recordCount.textContent =
        `Showing ${filteredRecords.length} of ${equipmentData.length} records`;


    // Clear previous table
    equipmentTableBody.innerHTML = "";


    // If no records found
    if (filteredRecords.length === 0) {

        tableContainer.classList.add("hidden");

        emptyMessage.classList.remove("hidden");

        return;

    }


    // Show table
    tableContainer.classList.remove("hidden");

    emptyMessage.classList.add("hidden");


    // Create table rows
    filteredRecords.forEach(record => {

        const row = document.createElement("tr");


        // Determine return status
        let returnStatus = "";

        if (record.return_date) {

            returnStatus =
                `<span class="status-badge status-returned">
                    Returned
                </span>`;

        } else {

            returnStatus =
                `<span class="status-badge status-issued">
                    Not Returned
                </span>`;

        }


        // Determine service status
        let serviceStatus = getServiceStatus(record);


        // Create row
        row.innerHTML = `

            <td>
                <strong>
                    ${record.equipment_name || "Information unavailable"}
                </strong>
            </td>

            <td>
                ${record.equipment_id || "Not available"}
            </td>

            <td>
                ${record.issued_to || "Not available"}
            </td>

            <td>
                ${formatDate(record.issue_date)}
            </td>

            <td>
                ${record.return_date
                    ? formatDate(record.return_date)
                    : "Not returned"}
            </td>

            <td>
                ${record.condition || "Not available"}
            </td>

            <td>
                ${serviceStatus}
            </td>

            <td>
                <button
                    class="view-button"
                    onclick="showDetails('${record.record_id}')"
                >
                    View
                </button>
            </td>

        `;


        // Add row to table
        equipmentTableBody.appendChild(row);

    });

}


// ========================================
// SERVICE STATUS
// ========================================

function getServiceStatus(record) {

    // Missing service date
    if (!record.next_service_date) {

        return `
            <span class="status-badge">
                Service date unavailable
            </span>
        `;

    }


    const today = new Date();

    const serviceDate =
        new Date(record.next_service_date);


    // Service overdue
    if (serviceDate < today) {

        const daysOverdue =
            calculateDaysDifference(serviceDate, today);

        return `
            <span class="status-badge status-service">
                Service overdue
                (${daysOverdue} days)
            </span>
        `;

    }


    // Service upcoming
    return `
        <span class="status-badge status-returned">
            Service up to date
        </span>
    `;

}


// ========================================
// SHOW EQUIPMENT DETAILS
// ========================================

function showDetails(recordId) {

    // Find selected record
    const record = equipmentData.find(
        item => item.record_id === recordId
    );


    // If record not found
    if (!record) {

        detailContent.innerHTML = `
            <div class="message error-message">
                Equipment record could not be found.
            </div>
        `;

        return;

    }


    // Calculate service information
    let serviceSummary = "";


    if (!record.next_service_date) {

        serviceSummary = `
            <h3>Service Date Unavailable</h3>
            <p>
                No service or calibration date is available
                for this equipment.
            </p>
        `;

    } else {

        const today = new Date();

        const serviceDate =
            new Date(record.next_service_date);


        if (serviceDate < today) {

            const daysOverdue =
                calculateDaysDifference(serviceDate, today);

            serviceSummary = `
                <h3>
                    Service Overdue by ${daysOverdue} Days
                </h3>

                <p>
                    This equipment has passed its
                    scheduled service date.
                </p>
            `;

        } else {

            const daysRemaining =
                calculateDaysDifference(today, serviceDate);

            serviceSummary = `
                <h3>
                    Service Due in ${daysRemaining} Days
                </h3>

                <p>
                    The equipment is currently within
                    its service period.
                </p>
            `;

        }

    }


    // Display details
    detailContent.innerHTML = `

        <div class="detail-summary">
            ${serviceSummary}
        </div>


        <div class="detail-grid">

            <div class="detail-item">
                <span>Record ID</span>
                <strong>
                    ${record.record_id || "Not available"}
                </strong>
            </div>


            <div class="detail-item">
                <span>Equipment ID</span>
                <strong>
                    ${record.equipment_id || "Not available"}
                </strong>
            </div>


            <div class="detail-item">
                <span>Equipment Name</span>
                <strong>
                    ${record.equipment_name ||
                     "Information unavailable"}
                </strong>
            </div>


            <div class="detail-item">
                <span>Issued To</span>
                <strong>
                    ${record.issued_to ||
                     "No related person found"}
                </strong>
            </div>


            <div class="detail-item">
                <span>Issue Date</span>
                <strong>
                    ${formatDate(record.issue_date)}
                </strong>
            </div>


            <div class="detail-item">
                <span>Return Date</span>
                <strong>
                    ${record.return_date
                        ? formatDate(record.return_date)
                        : "Not returned"}
                </strong>
            </div>


            <div class="detail-item">
                <span>Condition</span>
                <strong>
                    ${record.condition ||
                     "Condition unavailable"}
                </strong>
            </div>


            <div class="detail-item">
                <span>Next Service Date</span>
                <strong>
                    ${formatDate(record.next_service_date)}
                </strong>
            </div>

        </div>

    `;


    // Hide main table
    tableContainer.classList.add("hidden");

    // Hide controls
    document.querySelector(".controls")
        .classList.add("hidden");

    // Hide summary cards
    document.querySelector(".summary-grid")
        .classList.add("hidden");

    // Hide record count
    document.querySelector(".record-info")
        .classList.add("hidden");

    // Show detail section
    detailSection.classList.remove("hidden");

    // Scroll to detail section
    detailSection.scrollIntoView({
        behavior: "smooth"
    });

}



function calculateDaysDifference(startDate, endDate) {

    const difference =
        endDate.getTime() - startDate.getTime();

    const days =
        Math.ceil(
            difference / (1000 * 60 * 60 * 24)
        );

    return Math.max(days, 0);

}


function formatDate(dateString) {

    // Missing date
    if (!dateString) {

        return "Not available";

    }


    const date = new Date(dateString);


    if (isNaN(date.getTime())) {

        return "Invalid date";

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}



searchInput.addEventListener(
    "input",
    displayRecords
);



filterSelect.addEventListener(
    "change",
    displayRecords
);




backButton.addEventListener(
    "click",
    function() {

        // Hide details
        detailSection.classList.add("hidden");

        // Show main content
        document.querySelector(".controls")
            .classList.remove("hidden");

        document.querySelector(".summary-grid")
            .classList.remove("hidden");

        document.querySelector(".record-info")
            .classList.remove("hidden");

        tableContainer.classList.remove("hidden");

        // Scroll to top
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }
);



loadEquipmentData();