document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('data-table-body');
    const companies = ['ML', 'NB', 'BOOK'];
    let data = [];

    const createRow = (company, rowData) => {
        const row = document.createElement('tr');
        row.id = `row-${company}`;
        row.innerHTML = `
            <td>NAME</td>
            <td>${company}</td>
            <td><input type="number" class="editable" id="sold-${company}" value="${rowData.sold}"></td>
            <td><input type="number" class="editable" id="rate-${company}" value="${rowData.rate}"></td>
            <td class="calculated" id="total-${company}">${rowData.total.toFixed(2)}</td>
            <td><input type="number" class="editable" id="pwt-${company}" value="${rowData.pwt}"></td>
            <td><input type="number" class="editable" id="vc-${company}" value="${rowData.vc}"></td>
            <td class="calculated" id="current-bill-${company}">${rowData.currentBill.toFixed(2)}</td>
            <td>
                <button class="action-btn edit-btn" id="edit-${company}">Edit</button>
                <button class="action-btn delete-btn" id="delete-${company}">Clear</button>
            </td>
        `;
        return row;
    };

    const calculateRow = (company) => {
        const sold = parseFloat(document.getElementById(`sold-${company}`).value) || 0;
        const rate = parseFloat(document.getElementById(`rate-${company}`).value) || 0;
        const pwt = parseFloat(document.getElementById(`pwt-${company}`).value) || 0;
        const vc = parseFloat(document.getElementById(`vc-${company}`).value) || 0;

        const total = sold * rate;
        const currentBill = total - (pwt + vc);

        document.getElementById(`total-${company}`).textContent = total.toFixed(2);
        document.getElementById(`current-bill-${company}`).textContent = currentBill.toFixed(2);

        const dataIndex = data.findIndex(d => d.company === company);
        if (dataIndex > -1) {
            data[dataIndex] = { ...data[dataIndex], sold, rate, pwt, vc, total, currentBill };
        }

        calculateTotals();
    };

    const calculateTotals = () => {
        const totalSold = data.reduce((sum, d) => sum + d.sold, 0);
        const totalTotal = data.reduce((sum, d) => sum + d.total, 0);
        const totalPwt = data.reduce((sum, d) => sum + d.pwt, 0);
        const totalVc = data.reduce((sum, d) => sum + d.vc, 0);
        const totalCurrentBill = data.reduce((sum, d) => sum + d.currentBill, 0);

        document.getElementById('total-sold').textContent = totalSold;
        document.getElementById('total-total').textContent = totalTotal.toFixed(2);
        document.getElementById('total-pwt').textContent = totalPwt;
        document.getElementById('total-vc').textContent = totalVc;
        document.getElementById('total-current-bill').textContent = totalCurrentBill.toFixed(2);

        calculateSummary(totalCurrentBill);
    };

    const calculateSummary = (runningBill) => {
        const balance = parseFloat(document.getElementById('summary-balance').value) || 0;
        const outstanding = runningBill + balance;

        document.getElementById('summary-running-bill').textContent = runningBill.toFixed(2);
        document.getElementById('summary-outstanding').textContent = outstanding.toFixed(2);
        
        const summaryData = { balance: parseFloat(document.getElementById('summary-balance').value) || 0 };
        saveData(summaryData);
    };

    const saveData = (summaryData) => {
        const fullData = {
            rows: data,
            summary: summaryData || { balance: parseFloat(document.getElementById('summary-balance').value) || 0 }
        };
        localStorage.setItem('customerData', JSON.stringify(fullData));
    };

    const loadData = () => {
        const savedData = localStorage.getItem('customerData');
        if (savedData) {
            return JSON.parse(savedData);
        }
        // Default structure if no data is saved
        return {
            rows: companies.map(c => ({ company: c, sold: 0, rate: 0, total: 0, pwt: 0, vc: 0, currentBill: 0 })),
            summary: { balance: 0 }
        };
    };
    
    const toggleEditSave = (company, isEditing) => {
        const row = document.getElementById(`row-${company}`);
        const inputs = row.querySelectorAll('input.editable');
        const editBtn = document.getElementById(`edit-${company}`);

        inputs.forEach(input => {
            input.disabled = !isEditing;
            if(isEditing) {
                input.style.backgroundColor = "#fff8e1"; // yellow
            } else {
                input.style.backgroundColor = "#f0f0f0"; // grey
            }
        });

        if (isEditing) {
            editBtn.textContent = 'Save';
            editBtn.classList.remove('edit-btn');
            editBtn.classList.add('save-btn');
        } else {
            editBtn.textContent = 'Edit';
            editBtn.classList.remove('save-btn');
            editBtn.classList.add('edit-btn');
            calculateRow(company); // Recalculate and save on save
        }
    };

    const clearRow = (company) => {
        const inputs = ['sold', 'rate', 'pwt', 'vc'];
        inputs.forEach(id => {
            document.getElementById(`${id}-${company}`).value = 0;
        });
        calculateRow(company);
    };


    // Initialization
    const loadedData = loadData();
    data = loadedData.rows;
    document.getElementById('summary-balance').value = loadedData.summary.balance;

    companies.forEach(company => {
        const rowData = data.find(d => d.company === company);
        const rowElement = createRow(company, rowData);
        tableBody.appendChild(rowElement);
        toggleEditSave(company, false); // Initially set to non-editable
    });

    // Add event listeners
    companies.forEach(company => {
        const row = document.getElementById(`row-${company}`);
        row.addEventListener('input', () => calculateRow(company));
        
        const editBtn = document.getElementById(`edit-${company}`);
        editBtn.addEventListener('click', () => {
            const isEditing = editBtn.textContent === 'Edit';
            toggleEditSave(company, isEditing);
        });

        const deleteBtn = document.getElementById(`delete-${company}`);
        deleteBtn.addEventListener('click', () => clearRow(company));
    });

    document.getElementById('summary-balance').addEventListener('input', () => {
        const totalCurrentBill = data.reduce((sum, d) => sum + d.currentBill, 0);
        calculateSummary(totalCurrentBill);
    });

    calculateTotals(); // Initial calculation
});
