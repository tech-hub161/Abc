document.addEventListener('DOMContentLoaded', () => {
    const customerNameInput = document.getElementById('customer-name');
    const customerView = document.getElementById('customer-view');
    const tableBody = document.getElementById('data-table-body');
    const summaryBalanceInput = document.getElementById('summary-balance');
    const addNewCustomerBtn = document.getElementById('add-new-customer-btn');
    const saveDataBtn = document.getElementById('save-data-btn');
    const reportBtn = document.getElementById('report-btn');

    let customers = [];
    let currentCustomerId = null;
    const NUM_ROWS_PER_CUSTOMER = 7; // New requirement: 7 rows for new customers

    // Helper to generate unique IDs
    const generateUniqueId = () => `customer-${Date.now()}`;

    // Creates a single row HTML structure
    const createRowHtml = (customerId, rowIndex, rowData, customerName) => {
        const companyName = rowData.company || `Item ${rowIndex + 1}`;
        return `
            <tr id="row-${customerId}-${rowIndex}">
                <td><input type="text" class="editable" id="company-${customerId}-${rowIndex}" value="${companyName}"></td>
                <td><input type="number" class="editable" id="sold-${customerId}-${rowIndex}" value="${rowData.sold}"></td>
                <td><input type="number" class="editable" id="rate-${customerId}-${rowIndex}" value="${rowData.rate}"></td>
                <td class="calculated" id="total-${customerId}-${rowIndex}">${rowData.total.toFixed(2)}</td>
                <td><input type="number" class="editable" id="pwt-${customerId}-${rowIndex}" value="${rowData.pwt}"></td>
                <td><input type="number" class="editable" id="vc-${customerId}-${rowIndex}" value="${rowData.vc}"></td>
                <td class="calculated" id="current-bill-${customerId}-${rowIndex}">${rowData.currentBill.toFixed(2)}</td>
                <td>
                    <button class="action-btn delete-btn" data-customer-id="${customerId}" data-row-index="${rowIndex}">Clear</button>
                </td>
            </tr>
        `;
    };

    // Renders the table for the current customer
    const renderCustomerTable = () => {
        const currentCustomer = customers.find(c => c.id === currentCustomerId);
        if (!currentCustomer) return;

        customerNameInput.value = currentCustomer.customerName; // Set customer name input
        tableBody.innerHTML = ''; // Clear existing rows
        currentCustomer.rows.forEach((rowData, index) => {
            tableBody.innerHTML += createRowHtml(currentCustomerId, index, rowData, currentCustomer.customerName);
        });

        // Update summary balance input
        summaryBalanceInput.value = currentCustomer.summary.balance;

        // Re-attach event listeners for the current customer's table
        attachTableEventListeners();
        calculateAll(); // Recalculate everything for the rendered table
    };

    // Calculates a single row's Total and Current Bill
    const calculateRow = (customerId, rowIndex) => {
        const customer = customers.find(c => c.id === customerId);
        if (!customer) return;

        const rowData = customer.rows[rowIndex];
        if (!rowData) return;

        const sold = parseFloat(document.getElementById(`sold-${customerId}-${rowIndex}`).value) || 0;
        const rate = parseFloat(document.getElementById(`rate-${customerId}-${rowIndex}`).value) || 0;
        const pwt = parseFloat(document.getElementById(`pwt-${customerId}-${rowIndex}`).value) || 0;
        const vc = parseFloat(document.getElementById(`vc-${customerId}-${rowIndex}`).value) || 0;

        const total = sold * rate;
        const currentBill = total - (pwt + vc);

        document.getElementById(`total-${customerId}-${rowIndex}`).textContent = total.toFixed(2);
        document.getElementById(`current-bill-${customerId}-${rowIndex}`).textContent = currentBill.toFixed(2);

        // Update data model
        rowData.sold = sold;
        rowData.rate = rate;
        rowData.pwt = pwt;
        rowData.vc = vc;
        rowData.total = total;
        rowData.currentBill = currentBill;

        calculateAll();
    };

    // Calculates total row values and summary
    const calculateAll = () => {
        const currentCustomer = customers.find(c => c.id === currentCustomerId);
        if (!currentCustomer) return;

        const totalSold = currentCustomer.rows.reduce((sum, d) => sum + d.sold, 0);
        const totalTotal = currentCustomer.rows.reduce((sum, d) => sum + d.total, 0);
        const totalPwt = currentCustomer.rows.reduce((sum, d) => sum + d.pwt, 0);
        const totalVc = currentCustomer.rows.reduce((sum, d) => sum + d.vc, 0);
        const totalCurrentBill = currentCustomer.rows.reduce((sum, d) => sum + d.currentBill, 0);

        document.getElementById('total-sold').textContent = totalSold;
        document.getElementById('total-total').textContent = totalTotal.toFixed(2);
        document.getElementById('total-pwt').textContent = totalPwt;
        document.getElementById('total-vc').textContent = totalVc;
        document.getElementById('total-current-bill').textContent = totalCurrentBill.toFixed(2);

        // Summary calculations
        const runningBill = totalCurrentBill;
        const balance = parseFloat(summaryBalanceInput.value) || 0;
        const outstanding = runningBill + balance;

        document.getElementById('summary-running-bill').textContent = runningBill.toFixed(2);
        document.getElementById('summary-outstanding').textContent = outstanding.toFixed(2);

        // Update customer summary in data model
        currentCustomer.summary.runningBill = runningBill;
        currentCustomer.summary.balance = balance;
        currentCustomer.summary.outstanding = outstanding;

        // Auto-save on calculation (can be removed if explicit save is preferred)
        saveAllCustomers();
    };

    // Clears a row's editable fields
    const clearRow = (customerId, rowIndex) => {
        const customer = customers.find(c => c.id === customerId);
        if (!customer) return;

        const rowData = customer.rows[rowIndex];
        if (!rowData) return;

        const inputs = ['company', 'sold', 'rate', 'pwt', 'vc'];
        inputs.forEach(id => {
            const inputElement = document.getElementById(`${id}-${customerId}-${rowIndex}`);
            if (inputElement) {
                inputElement.value = (id === 'company') ? `Item ${rowIndex + 1}` : 0;
            }
        });

        // Update data model
        rowData.company = `Item ${rowIndex + 1}`;
        rowData.sold = 0;
        rowData.rate = 0;
        rowData.pwt = 0;
        rowData.vc = 0;
        rowData.total = 0;
        rowData.currentBill = 0;

        calculateRow(customerId, rowIndex);
    };

    // Saves all customer data to local storage
    const saveAllCustomers = () => {
        localStorage.setItem('allCustomersData', JSON.stringify(customers));
    };

    // Loads all customer data from local storage
    const loadAllCustomers = () => {
        const savedData = localStorage.getItem('allCustomersData');
        if (savedData) {
            customers = JSON.parse(savedData);
            // Ensure all loaded rows have necessary calculated fields
            customers.forEach(customer => {
                customer.rows.forEach(row => {
                    row.total = row.sold * row.rate;
                    row.currentBill = row.total - (row.pwt + row.vc);
                });
            });
        } else {
            // Initialize with one default customer if no data
            customers.push(createDefaultCustomer());
        }
        currentCustomerId = customers[0].id; // Set first customer as current
    };

    // Creates a new default customer object
    const createDefaultCustomer = () => {
        const newCustomerId = generateUniqueId();
        const newCustomer = {
            id: newCustomerId,
            customerName: `Customer ${customers.length + 1}`,
            rows: [],
            summary: { balance: 0, runningBill: 0, outstanding: 0 }
        };
        for (let i = 0; i < NUM_ROWS_PER_CUSTOMER; i++) {
            newCustomer.rows.push({
                company: `Item ${i + 1}`,
                sold: 0,
                rate: 0,
                total: 0,
                pwt: 0,
                vc: 0,
                currentBill: 0,
            });
        }
        return newCustomer;
    };

    // Event delegation for table rows (input, edit, clear)
    const attachTableEventListeners = () => {
        // Remove previous listeners to prevent duplicates
        customerView.removeEventListener('input', handleTableInput);
        customerView.removeEventListener('click', handleTableClick);

        // Add new listeners
        customerView.addEventListener('input', handleTableInput);
        customerView.addEventListener('click', handleTableClick);
    };

    const handleTableInput = (event) => {
        if (event.target.classList.contains('editable')) {
            const idParts = event.target.id.split('-');
            const customerId = idParts[1];
            const rowIndex = parseInt(idParts[2]);
            
            // Update the company in the data model immediately
            const customer = customers.find(c => c.id === customerId);
            if (customer) {
                const field = idParts[0];
                if (field === 'company') customer.rows[rowIndex].company = event.target.value;
            }

            // Only trigger full row calculation for numeric inputs
            if (['sold', 'rate', 'pwt', 'vc'].includes(idParts[0])) {
                calculateRow(customerId, rowIndex);
            } else {
                saveAllCustomers(); // Save text changes immediately
            }
        }
    };

    const handleTableClick = (event) => {
        if (event.target.classList.contains('action-btn')) {
            const customerId = event.target.dataset.customerId;
            const rowIndex = parseInt(event.target.dataset.rowIndex);

            if (event.target.classList.contains('delete-btn')) {
                clearRow(customerId, rowIndex);
            }
        }
    };

    // Main button event listeners
    addNewCustomerBtn.addEventListener('click', () => {
        const newCustomer = createDefaultCustomer();
        customers.push(newCustomer);
        currentCustomerId = newCustomer.id;
        renderCustomerTable();
        saveAllCustomers();
    });

    saveDataBtn.addEventListener('click', () => {
        saveAllCustomers();
        alert('Data saved successfully!');
    });

    reportBtn.addEventListener('click', () => {
        alert('Report functionality is not yet implemented.');
        // Future: Generate a report based on current customer data
    });

    summaryBalanceInput.addEventListener('input', () => {
        calculateAll();
    });

    customerNameInput.addEventListener('input', () => {
        const currentCustomer = customers.find(c => c.id === currentCustomerId);
        if (currentCustomer) {
            currentCustomer.customerName = customerNameInput.value;
            saveAllCustomers();
        }
    });

    // Initial load and render
    loadAllCustomers();
    renderCustomerTable();
});
