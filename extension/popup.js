function scrapeKagglePage() {
  const title = document.querySelector('h1')?.innerText.trim();

  const descriptionContainer = document.querySelector('.sc-eTCgfj.iLRXUI');
  const description = descriptionContainer?.innerText.trim();

  let schema = '';

  const schemaTableRows = document.querySelectorAll('tbody > tr');
  if (schemaTableRows && schemaTableRows.length > 0) {
    const schemaData = [];
    schemaTableRows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length === 2) {
        const columnName = cells[0].innerText.trim();
        const columnDescription = cells[1].innerText.trim();
        if (columnName.toLowerCase() !== 'column name') {
          schemaData.push(`- ${columnName}: ${columnDescription}`);
        }
      }
    });
    schema = schemaData.join('\n');
  }

  if (!schema) {
    const columnHeaderElements = document.querySelectorAll('div[role="columnheader"]');
    if (columnHeaderElements && columnHeaderElements.length > 0) {
      const columnNames = [];
      columnHeaderElements.forEach(header => {
        if (header.innerText) {
          columnNames.push(header.innerText.trim());
        }
      });
      schema = "Columns: " + columnNames.join(', ');
    }
  }

  return {
    title,
    description,
    schema
  };
}


document.addEventListener('DOMContentLoaded', () => {
  const analyzeBtn = document.getElementById('analyzeBtn');
  const resultsDiv = document.getElementById('results');
  const scrapedDataPre = document.getElementById('scrapedData');

  analyzeBtn.addEventListener('click', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const scrapingResult = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: scrapeKagglePage,
    });

    const data = scrapingResult[0].result;
    let formattedData = `Title: ${data.title}\n\n--- Description ---\n${data.description}\n\n--- Data Schema ---\n${data.schema}`;
    
    formattedData = formattedData.replace(/View less/g, '').trim();

    scrapedDataPre.innerText = formattedData;
    resultsDiv.classList.remove('hidden');
    analyzeBtn.innerText = 'Analysis Complete!';
    analyzeBtn.disabled = true;
  });
});