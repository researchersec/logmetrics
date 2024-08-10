document.getElementById('logFile').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            const parsedData = parseLogData(content);
            displayLog(content);
            displayStatistics(parsedData);
            createCharts(parsedData);
        };
        reader.readAsText(file);
    }
});

document.getElementById('searchBar').addEventListener('input', function(event) {
    const searchTerm = event.target.value.toLowerCase();
    filterLog(searchTerm);
});

document.getElementById('exportCSV').addEventListener('click', function() {
    exportToCSV();
});

function parseLogData(content) {
    const lines = content.split('\n');
    const eventTypes = {};
    const timestamps = [];
    const damageOverTime = [];
    let totalDamage = 0;
    let totalEvents = 0;

    lines.forEach(line => {
        if (line.trim() !== '') {
            const [timestamp, eventType, ...details] = line.split(' ');

            // Track event types count
            if (!eventTypes[eventType]) {
                eventTypes[eventType] = 0;
            }
            eventTypes[eventType]++;
            totalEvents++;

            // Track timestamps
            timestamps.push(timestamp);

            // Capture damage events (assuming damage is represented by an integer in the details)
            if (eventType === 'DAMAGE') {
                const damageValue = parseInt(details[details.length - 1], 10);
                if (!isNaN(damageValue)) {
                    totalDamage += damageValue;
                    damageOverTime.push({ timestamp, damage: damageValue });
                }
            }
        }
    });

    return { eventTypes, timestamps, damageOverTime, totalDamage, totalEvents, rawContent: content };
}

function displayLog(content) {
    const lines = content.split('\n');
    let html = '<table id="logTable"><tr><th>Timestamp</th><th>Event</th><th>Details</th></tr>';

    lines.forEach(line => {
        if (line.trim() !== '') {
            const [timestamp, eventType, ...details] = line.split(' ');
            html += `<tr><td>${timestamp}</td><td>${eventType}</td><td>${details.join(' ')}</td></tr>`;
        }
    });

    html += '</table>';
    document.getElementById('logDisplay').innerHTML = html;
}

function filterLog(searchTerm) {
    const rows = document.querySelectorAll('#logTable tr');
    rows.forEach((row, index) => {
        if (index === 0) return; // Skip header row
        const eventType = row.cells[1].textContent.toLowerCase();
        const details = row.cells[2].textContent.toLowerCase();
        if (eventType.includes(searchTerm) || details.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function displayStatistics(data) {
    const statsDiv = document.createElement('div');
    statsDiv.id = 'statistics';
    
    const totalEvents = `<p>Total Events: ${data.totalEvents}</p>`;
    const totalDamage = `<p>Total Damage: ${data.totalDamage}</p>`;
    const avgDamage = `<p>Average Damage Per Event: ${(data.totalDamage / data.damageOverTime.length).toFixed(2)}</p>`;

    let eventTypeStats = '<h3>Event Types Breakdown:</h3><ul>';
    for (const [eventType, count] of Object.entries(data.eventTypes)) {
        eventTypeStats += `<li>${eventType}: ${count}</li>`;
    }
    eventTypeStats += '</ul>';

    statsDiv.innerHTML = totalEvents + totalDamage + avgDamage + eventTypeStats;
    document.body.insertBefore(statsDiv, document.getElementById('charts'));
}

function createCharts(data) {
    const chartsDiv = document.getElementById('charts');
    chartsDiv.innerHTML = ''; // Clear previous charts

    // Bar Chart for Event Types
    const eventTypesCtx = document.createElement('canvas');
    chartsDiv.appendChild(eventTypesCtx);

    new Chart(eventTypesCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(data.eventTypes),
            datasets: [{
                label: 'Event Counts',
                data: Object.values(data.eventTypes),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Line Chart for Damage Over Time
    const damageOverTimeCtx = document.createElement('canvas');
    chartsDiv.appendChild(damageOverTimeCtx);

    new Chart(damageOverTimeCtx, {
        type: 'line',
        data: {
            labels: data.damageOverTime.map(entry => entry.timestamp),
            datasets: [{
                label: 'Damage',
                data: data.damageOverTime.map(entry => entry.damage),
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Pie Chart for Event Type Distribution
    const eventTypePieCtx = document.createElement('canvas');
    chartsDiv.appendChild(eventTypePieCtx);

    new Chart(eventTypePieCtx, {
        type: 'pie',
        data: {
            labels: Object.keys(data.eventTypes),
            datasets: [{
                label: 'Event Type Distribution',
                data: Object.values(data.eventTypes),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true
        }
    });
}

function exportToCSV() {
    const rows = document.querySelectorAll('#logTable tr');
    let csvContent = '';

    rows.forEach(row => {
        const cells = row.querySelectorAll('td, th');
        const rowData = [];
        cells.forEach(cell => {
            rowData.push(cell.textContent);
        });
        csvContent += rowData.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'log_data.csv');
    a.click();
}
