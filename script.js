const people = ['La L', 'La A', 'Le A', 'Le B', 'Le T', 'La G'];
let expenses = [];
let expenseChart, pieChart;

// Initialiser les graphiques
function initCharts() {
    // Graphique linéaire
    const ctx1 = document.getElementById('expenseChart').getContext('2d');
    expenseChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Dépenses cumulées',
                data: [],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        }
    });

    // Graphique en camembert
    const ctx2 = document.getElementById('pieChart').getContext('2d');
    pieChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: people,
            datasets: [{
                data: [0, 0, 0, 0, 0, 0],
                backgroundColor: [
                    '#667eea',
                    '#764ba2',
                    '#f093fb',
                    '#f5576c',
                    '#4facfe',
                    '#00f2fe'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

// Ajouter une dépense
document.getElementById('expenseForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const payer = document.getElementById('payer').value;
    
    const participants = [];
    people.forEach(person => {
        const checkbox = document.getElementById(`part_${person.replace(/\s/g, '_')}`);
        if (checkbox && checkbox.checked) {
            participants.push(person);
        }
    });
    
    if (participants.length === 0) {
        alert('Veuillez sélectionner au moins un participant !');
        return;
    }
    
    const expense = {
        id: Date.now(),
        description,
        amount,
        payer,
        participants,
        date: new Date().toLocaleDateString('fr-FR')
    };
    
    expenses.push(expense);
    updateDisplay();
    this.reset();
});

// Mettre à jour l'affichage
function updateDisplay() {
    updateExpenseList();
    updateBalances();
    updateStats();
    updateCharts();
    updateSettlements();
}

// Mettre à jour la liste des dépenses
function updateExpenseList() {
    const list = document.getElementById('expenseList');
    
    if (expenses.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #888; margin-top: 50px;">Aucune dépense enregistrée</p>';
        return;
    }
    
    list.innerHTML = expenses.map(expense => `
        <div class="expense-item">
            <div class="expense-header">
                <strong>${expense.description}</strong>
                <span class="expense-amount">${expense.amount.toFixed(2)}€</span>
            </div>
            <div>Payé par: <strong>${expense.payer}</strong></div>
            <div class="expense-participants">
                Participants: ${expense.participants.join(', ')}
            </div>
            <div class="expense-date">${expense.date}</div>
        </div>
    `).join('');
}

// Calculer les balances
function calculateBalances() {
    const balances = {};
    people.forEach(person => {
        balances[person] = 0;
    });
    
    expenses.forEach(expense => {
        const sharePerPerson = expense.amount / expense.participants.length;
        
        // Le payeur reçoit le montant total
        balances[expense.payer] += expense.amount;
        
        // Chaque participant doit sa part
        expense.participants.forEach(participant => {
            balances[participant] -= sharePerPerson;
        });
    });
    
    return balances;
}

// Mettre à jour les balances
function updateBalances() {
    const balances = calculateBalances();
    const grid = document.getElementById('balanceGrid');
    
    grid.innerHTML = people.map(person => {
        const balance = balances[person];
        const isPositive = balance > 0;
        const isNegative = balance < 0;
        
        return `
            <div class="balance-card ${isPositive ? 'positive' : isNegative ? 'negative' : ''}">
                <div class="balance-name">${person}</div>
                <div class="balance-amount">${balance.toFixed(2)}€</div>
            </div>
        `;
    }).join('');
}

// Mettre à jour les statistiques
function updateStats() {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const average = expenses.length > 0 ? total / expenses.length : 0;
    
    document.getElementById('totalExpenses').textContent = total.toFixed(2) + '€';
    document.getElementById('averageExpense').textContent = average.toFixed(2) + '€';
    document.getElementById('expenseCount').textContent = expenses.length;
}

// Mettre à jour les graphiques
function updateCharts() {
    // Graphique linéaire
    const sortedExpenses = [...expenses].sort((a, b) => {
        const dateA = new Date(a.date.split('/').reverse().join('-'));
        const dateB = new Date(b.date.split('/').reverse().join('-'));
        return dateA - dateB;
    });
    
    let cumulative = 0;
    const labels = [];
    const data = [];
    
    sortedExpenses.forEach(expense => {
        cumulative += expense.amount;
        labels.push(expense.date);
        data.push(cumulative);
    });
    
    expenseChart.data.labels = labels;
    expenseChart.data.datasets[0].data = data;
    expenseChart.update();
    
    // Graphique en camembert
    const personTotals = {};
    people.forEach(person => {
        personTotals[person] = 0;
    });
    
    expenses.forEach(expense => {
        personTotals[expense.payer] += expense.amount;
    });
    
    pieChart.data.datasets[0].data = people.map(person => personTotals[person]);
    pieChart.update();
}

// Calculer les règlements
function calculateSettlements() {
    const balances = calculateBalances();
    const settlements = [];
    
    // Créer des copies pour manipulation
    const debtors = [];
    const creditors = [];
    
    people.forEach(person => {
        const balance = balances[person];
        if (balance < -0.01) {
            debtors.push({ person, amount: -balance });
        } else if (balance > 0.01) {
            creditors.push({ person, amount: balance });
        }
    });
    
    // Calculer les règlements optimaux
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);
    
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];
        
        const amount = Math.min(debtor.amount, creditor.amount);
        
        if (amount > 0.01) {
            settlements.push({
                from: debtor.person,
                to: creditor.person,
                amount: amount
            });
        }
        
        debtor.amount -= amount;
        creditor.amount -= amount;
        
        if (debtor.amount < 0.01) i++;
        if (creditor.amount < 0.01) j++;
    }
    
    return settlements;
}

// Mettre à jour les règlements
function updateSettlements() {
    const settlements = calculateSettlements();
    const container = document.getElementById('settlements');
    
    if (settlements.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Aucun règlement nécessaire</p>';
        return;
    }
    
    container.innerHTML = settlements.map(settlement => `
        <div class="settlement-item">
            <span><strong>${settlement.from}</strong> doit <strong>${settlement.amount.toFixed(2)}€</strong> à <strong>${settlement.to}</strong></span>
            <span class="settlement-amount">${settlement.amount.toFixed(2)}€</span>
        </div>
    `).join('');
}

// Initialiser l'application
document.addEventListener('DOMContentLoaded', function() {
    initCharts();
    updateDisplay();
});
