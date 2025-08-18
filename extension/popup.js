function scrapeKagglePage() {
  const title = document.querySelector('h1')?.innerText.trim();

  const descriptionContainer = document.querySelector('.sc-eTCgfj.iLRXUI');
  let description = '';
  if (descriptionContainer) {
    const paragraphs = descriptionContainer.querySelectorAll('p');
    const descriptionTexts = Array.from(paragraphs).map(p => p.innerText.trim());
    description = descriptionTexts.join('\n\n'); 
  }

  let schema = '';
  if (descriptionContainer) {
    const schemaRows = descriptionContainer.querySelectorAll('tbody > tr');
    const schemaData = [];
    schemaRows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length === 2) {
        const columnName = cells[0].innerText.trim();
        const columnDescription = cells[1].innerText.trim();
        schemaData.push(`- ${columnName}: ${columnDescription}`);
      }
    });
    schema = schemaData.join('\n'); 
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
    const formattedData = `Title: ${data.title}\n\nDescription: ${data.description}\n\nSchema:\n${data.schema}`;
    
    scrapedDataPre.innerText = formattedData;
    resultsDiv.classList.remove('hidden');
    analyzeBtn.innerText = 'Analysis Complete!';
    analyzeBtn.disabled = true;
  });
});