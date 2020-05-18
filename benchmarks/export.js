const fs = require("fs");

const colors = [
  "63, 142, 252",
  "116, 165, 127",
  "158, 206, 154",
  "58, 175, 185",
  "79, 124, 172",
  "113, 128, 172",
  "182, 140, 184",
  "219, 108, 121",
  "189, 79, 108",
  "138, 79, 125",
  "95, 75, 102",
  "204, 139, 134",
  "215, 129, 106",
  "245, 143, 41",
];

function prepareColors(length, opacity) {
  return Array.from(
    { length },
    (_, i) => `rgba(${colors[i % colors.length]}, ${opacity})`
  );
}

module.exports = function exportToHTML(title, path, summaries) {
  var header = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta http-equiv="X-UA-Compatible" />
      <script src="https://cdn.jsdelivr.net/npm/chart.js@2.8.0/dist/Chart.min.js"></script>
      <style>
        .wrapper {
          display: flex;
          flex: wrap;
          order: row;
        }
      </style>
      <title>${title}</title>
      <script>
        const format = (num) => {
        const chunked = []
        String(num)
            .split('')
            .reverse()
            .forEach((char, index) => {
            if (index % 3 === 0) {
                chunked.unshift([char])
            } else {
                chunked[0].unshift(char)
            }
            })

        return chunked.map((chunk) => chunk.join('')).join(' ')
        }
     </script>
    </head>
    <body>`;
  for (var summary of summaries) {
    const labels = summary.results.map((result) => result.name);
    const values = summary.results.map((result) => result.ops);

    header += `
            <div style="max-width: 800px;">
              <canvas id="chart${summary.date.getTime()}" width="16" height="9"></canvas>
            </div>
            <script>
              const ctx${summary.date.getTime()} = document.getElementById('chart${summary.date.getTime()}').getContext('2d')
              const chart${summary.date.getTime()} = new Chart(ctx${summary.date.getTime()}, {
                type: 'bar',
                data: {
                  labels: ${JSON.stringify(labels)},
                  datasets: [
                    {
                      data: ${JSON.stringify(values)},
                      backgroundColor: ${JSON.stringify(
                        prepareColors(values.length, 0.8)
                      )},
                      borderColor: ${JSON.stringify(
                        prepareColors(values.length, 1)
                      )},
                      borderWidth: 1,
                    },
                  ],
                },
                options: {
                  legend: {
                    display: false
                  },
                  title: {
                    display: true,
                    text: '${summary.name}',
                    fontSize: 16,
                    padding: 20,
                  },
                  tooltips: {
                    callbacks: {
                      label: (tooltipItem) => {
                        return format(tooltipItem.yLabel) + ' ops/s'
                      }
                    }
                  },
                  scales: {
                    yAxes: [
                      {
                        gridLines: {
                          color: 'rgba(127, 127, 127, 0.2)',
                        },
                        scaleLabel: {
                          display: true,
                          labelString: 'Operations per second',
                        },
                        ticks: {
                          beginAtZero: true,
                          callback: format,
                        },
                      },
                    ],
                    xAxes: [
                      {
                        gridLines: {
                          color: 'rgba(127, 127, 127, 0.2)',
                        },
                        maxBarThickness: 150,
                      },
                    ],
                  },
                },
              })
            </script>
    `;
  }
  header += `</body>
        </html>`;
  fs.writeFileSync(path, header);
};
