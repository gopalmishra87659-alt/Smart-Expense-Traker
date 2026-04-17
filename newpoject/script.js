// State Variables
let budget = 0;
let expenses = [];
let chartInstance = null;
let typingInterval = null; // To prevent typing overlap

// DOM Elements
const budgetDisplay = document.getElementById("budgetDisplay");
const totalDisplay = document.getElementById("total");
const expenseList = document.getElementById("expenseList");
const analysisDiv = document.getElementById("analysis");
const suggestionDiv = document.getElementById("suggestion");
const aiAdviceDiv = document.getElementById("aiAdvice");
const expenseChartCanvas = document.getElementById("expenseChart");

// Set Budget
function setBudget() {
    const budgetInput = document.getElementById("budgetInput").value;
    if (budgetInput && budgetInput > 0) {
        budget = parseFloat(budgetInput);
        budgetDisplay.innerText = budget.toLocaleString('en-IN');
        document.getElementById("budgetInput").value = '';
        updateUI();
    } else {
        alert("Please enter a valid budget amount.");
    }
}

// Add Expense
function addExpense() {
    const amountInput = document.getElementById("amount").value;
    const categoryInput = document.getElementById("category").value;

    if (amountInput && amountInput > 0) {
        expenses.push({
            id: Date.now(),
            category: categoryInput,
            amount: parseFloat(amountInput)
        });
        document.getElementById("amount").value = '';
        updateUI();
    } else {
        alert("Please enter a valid expense amount.");
    }
}

// Delete Expense
function deleteExpense(id) {
    expenses = expenses.filter(expense => expense.id !== id);
    updateUI();
}

// Update Entire UI
function updateUI() {
    renderList();
    
    // Group data for charts and AI
    const categoryTotals = {};
    let totalSpent = 0;
    
    expenses.forEach(exp => {
        totalSpent += exp.amount;
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    totalDisplay.innerText = totalSpent.toLocaleString('en-IN');

    drawChart(categoryTotals);
    updateAnalysis(categoryTotals);
    suggest(totalSpent, categoryTotals);
    aiAdvisor(totalSpent, categoryTotals);
}

// Render the List
function renderList() {
    expenseList.innerHTML = "";
    expenses.forEach(exp => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span class="expense-info">${exp.category} - ₹${exp.amount.toLocaleString('en-IN')}</span>
            <button class="btn-danger" onclick="deleteExpense(${exp.id})">❌</button>
        `;
        expenseList.appendChild(li);
    });
}

// Draw Chart
function drawChart(data) {
    let ctx = expenseChartCanvas.getContext("2d");
    if (chartInstance) chartInstance.destroy();

    const categories = Object.keys(data);
    const amounts = Object.values(data);

    // If no data, show empty chart placeholder
    if (categories.length === 0) {
        chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: ['No Data'], datasets: [{ data: [1], backgroundColor: ["#e5e7eb"] }] },
            options: { plugins: { tooltip: { enabled: false } } }
        });
        return;
    }

    // Color map matching the categories
    const colors = {
        food: "#ef4444",      // Red
        travel: "#3b82f6",    // Blue
        shopping: "#f59e0b",  // Yellow
        bills: "#10b981",     // Green
        others: "#8b5cf6"     // Purple
    };

    const backgroundColors = categories.map(cat => colors[cat] || "#9ca3af");

    chartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)),
            datasets: [{
                data: amounts,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
        }
    });
}

// Update Analysis Text
function updateAnalysis(categoryTotals) {
    if (expenses.length === 0) {
        analysisDiv.innerText = "No expenses yet.";
        return;
    }

    let text = "";
    for (let cat in categoryTotals) {
        text += `${cat.charAt(0).toUpperCase() + cat.slice(1)}: ₹${categoryTotals[cat].toLocaleString('en-IN')}\n`;
    }
    analysisDiv.innerText = text;
}

// Basic Suggestion Rules
function suggest(totalSpent, categoryTotals) {
    const foodSpent = categoryTotals["food"] || 0;
    
    suggestionDiv.className = "alert-box"; // Reset classes

    if (totalSpent === 0) {
        suggestionDiv.innerText = "Start adding expenses!";
        suggestionDiv.classList.add("neutral");
    } else if (budget > 0 && totalSpent > budget) {
        suggestionDiv.innerText = "🚨 Budget Exceeded!";
        suggestionDiv.classList.add("danger");
    } else if (foodSpent > totalSpent * 0.5) {
        suggestionDiv.innerText = "⚠️ You are spending more than 50% on food!";
        suggestionDiv.classList.add("warning");
    } else if (totalSpent > 50000) {
        suggestionDiv.innerText = "⚠️ High overall spending!";
        suggestionDiv.classList.add("warning");
    } else {
        suggestionDiv.innerText = "✅ Good spending habits!";
        suggestionDiv.classList.add("success");
    }
}

// AI Advisor Logic
function aiAdvisor(totalSpent, categoryTotals) {
    if (expenses.length === 0) {
        aiAdviceDiv.innerText = "Add expenses for AI insights...";
        return;
    }

    let lastExp = expenses[expenses.length - 1];
    let text = "📊 Analyzing your patterns...\n\n";

    for (let cat in categoryTotals) {
        let percentage = (categoryTotals[cat] / totalSpent) * 100;
        if (percentage > 40) {
            text += `⚠️ High ${cat} spending (${percentage.toFixed(1)}%)\n`;
        }
    }

    if (budget > 0 && totalSpent > budget) text += "🚨 CRITICAL: You have blown past your monthly budget!\n";
    if (totalSpent > 50000 && totalSpent <= budget) text += "💸 Warning: High spending volume detected.\n";
    if (lastExp.amount > totalSpent * 0.4 && expenses.length > 1) {
        text += `🚨 Unusual spike detected: ₹${lastExp.amount} on ${lastExp.category}.\n`;
    }

    text += "\n💡 Tip: Follow the 50-30-20 rule (50% Needs, 30% Wants, 20% Savings).";

    typeEffect(text);
}

// AI Typing Effect
function typeEffect(text) {
    aiAdviceDiv.innerHTML = "";
    let i = 0;
    
    // Clear previous interval if user adds multiple expenses quickly
    if (typingInterval) clearInterval(typingInterval);

    typingInterval = setInterval(() => {
        // Handle newlines properly in HTML
        if (text[i] === '\n') {
            aiAdviceDiv.innerHTML += '<br>';
        } else {
            aiAdviceDiv.innerHTML += text[i];
        }
        i++;
        if (i >= text.length) clearInterval(typingInterval);
    }, 20);
}

// Initialize Empty UI on load
updateUI();